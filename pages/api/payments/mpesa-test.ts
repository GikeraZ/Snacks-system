import type { NextApiRequest, NextApiResponse } from 'next'
import { isConfigured } from '@/lib/mpesa'
import axios from 'axios'

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || ''
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || ''
const PASSKEY = process.env.MPESA_PASSKEY || ''
const SHORTCODE = process.env.MPESA_SHORTCODE || ''
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL || ''

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const results: Record<string, unknown> = {}

  const config: Record<string, unknown> = {
    hasConsumerKey: !!CONSUMER_KEY,
    hasConsumerSecret: !!CONSUMER_SECRET,
    hasPasskey: !!PASSKEY,
    hasShortcode: !!SHORTCODE,
    hasCallbackUrl: !!CALLBACK_URL,
    shortcode: SHORTCODE,
    callbackUrl: CALLBACK_URL ? CALLBACK_URL.substring(0, 40) + '...' : '(empty)',
    isConfigured: isConfigured(),
    shortcodePreview: SHORTCODE.substring(0, 6),
    passkeyLength: PASSKEY.length,
  }
  results.config = config

  if (!isConfigured()) {
    return res.status(200).json({ status: 'NOT_CONFIGURED', ...results })
  }

  const BASE_URL = SHORTCODE === '174379'
    ? 'https://sandbox.safaricom.co.ke'
    : 'https://api.safaricom.co.ke'
  results.baseUrl = BASE_URL

  try {
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')
    const tokenRes = await axios.get(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${auth}` },
      timeout: 15000,
    })
    results.tokenSuccess = true
    results.tokenPreview = tokenRes.data.access_token?.substring(0, 20) + '...'

    const phone = '254708374149'
    const ts = (() => {
      const now = new Date()
      const y = now.getFullYear()
      const M = String(now.getMonth() + 1).padStart(2, '0')
      const d = String(now.getDate()).padStart(2, '0')
      const h = String(now.getHours()).padStart(2, '0')
      const m = String(now.getMinutes()).padStart(2, '0')
      const s = String(now.getSeconds()).padStart(2, '0')
      return `${y}${M}${d}${h}${m}${s}`
    })()
    const pw = Buffer.from(`${SHORTCODE}${PASSKEY}${ts}`).toString('base64')

    const body = {
      BusinessShortCode: SHORTCODE,
      Password: pw,
      Timestamp: ts,
      TransactionType: 'CustomerPayBillOnline',
      Amount: 1,
      PartyA: phone,
      PartyB: SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: CALLBACK_URL,
      AccountReference: 'TEST',
      TransactionDesc: 'Test payment',
    }
    results.stkBody = body

    const stkRes = await axios.post(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, body, {
      headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
      timeout: 15000,
    })
    results.stkResponse = stkRes.data
    results.stkSuccess = stkRes.data.ResponseCode === '0'
    results.status = results.stkSuccess ? 'STK_SENT' : 'STK_FAILED'
  } catch (err: unknown) {
    results.status = 'ERROR'
    if (err && typeof err === 'object') {
      const e = err as { response?: { data?: unknown; status?: number }; message?: string; code?: string }
      results.errorType = e.constructor?.name
      if (e.response) {
        results.errorResponse = e.response.data
        results.errorStatus = e.response.status
      } else if (e.code === 'ECONNABORTED') {
        results.errorMessage = 'Request timed out'
      } else {
        results.errorMessage = e.message
      }
    }
  }

  return res.status(200).json(results)
}
