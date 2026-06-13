import axios from 'axios'

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || ''
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || ''
const PASSKEY = process.env.MPESA_PASSKEY || ''
const SHORTCODE = process.env.MPESA_SHORTCODE || ''
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL || ''

const BASE_URL = SHORTCODE === '174379'
  ? 'https://sandbox.safaricom.co.ke'
  : 'https://api.safaricom.co.ke'

let tokenCache: { token: string; expiry: number } | null = null

function formatPhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)\+]/g, '')
  if (cleaned.startsWith('0')) cleaned = '254' + cleaned.slice(1)
  if (cleaned.startsWith('+')) cleaned = cleaned.slice(1)
  if (!cleaned.startsWith('254')) cleaned = '254' + cleaned
  return cleaned
}

function timestamp(): string {
  const now = new Date()
  const y = now.getFullYear()
  const M = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  const s = String(now.getSeconds()).padStart(2, '0')
  return `${y}${M}${d}${h}${m}${s}`
}

function password(): string {
  const ts = timestamp()
  const str = `${SHORTCODE}${PASSKEY}${ts}`
  return Buffer.from(str).toString('base64')
}

async function getToken(): Promise<string> {
  if (tokenCache && tokenCache.expiry > Date.now()) {
    return tokenCache.token
  }

  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')
  const res = await axios.get(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  })

  const token = res.data.access_token
  const expiresIn = (res.data.expires_in || 3599) * 1000
  tokenCache = { token, expiry: Date.now() + expiresIn - 60000 }
  return token
}

export async function stkPush(
  phoneNumber: string,
  amount: number,
  accountReference: string,
  transactionDesc = 'Danoscar Bite Payment'
): Promise<{ success: boolean; checkoutRequestId?: string; merchantRequestId?: string; error?: string }> {
  if (!CONSUMER_KEY || !CONSUMER_SECRET || !PASSKEY || !SHORTCODE) {
    return { success: false, error: 'M-Pesa not configured. Set MPESA_* env vars.' }
  }

  try {
    const token = await getToken()
    const phone = formatPhone(phoneNumber)

    const body = {
      BusinessShortCode: SHORTCODE,
      Password: password(),
      Timestamp: timestamp(),
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: phone,
      PartyB: SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: CALLBACK_URL,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc,
    }

    const res = await axios.post(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, body, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.data.ResponseCode === '0') {
      return {
        success: true,
        checkoutRequestId: res.data.CheckoutRequestID,
        merchantRequestId: res.data.MerchantRequestID,
      }
    }

    return { success: false, error: res.data.ResponseDescription || 'STK push failed' }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as { response: { data: { errorMessage?: string } } }
      return { success: false, error: axiosErr.response?.data?.errorMessage || 'M-Pesa API error' }
    }
    return { success: false, error: 'M-Pesa connection failed' }
  }
}

export async function queryStatus(checkoutRequestId: string): Promise<{
  success: boolean
  resultCode?: string
  resultDesc?: string
  amount?: number
  mpesaReceipt?: string
  phone?: string
}> {
  if (!CONSUMER_KEY || !CONSUMER_SECRET || !PASSKEY || !SHORTCODE) {
    return { success: false }
  }

  try {
    const token = await getToken()
    const body = {
      BusinessShortCode: SHORTCODE,
      Password: password(),
      Timestamp: timestamp(),
      CheckoutRequestID: checkoutRequestId,
    }

    const res = await axios.post(`${BASE_URL}/mpesa/stkpushquery/v1/query`, body, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.data.ResultCode === '0') {
      const items = res.data.CallbackMetadata?.Item || []
      const getItem = (k: string) => items.find((i: { Name: string; Value?: unknown }) => i.Name === k)?.Value

      return {
        success: true,
        resultCode: '0',
        resultDesc: res.data.ResultDesc,
        amount: getItem('Amount') as number | undefined,
        mpesaReceipt: getItem('MpesaReceiptNumber') as string | undefined,
        phone: getItem('PhoneNumber') as string | undefined,
      }
    }

    return { success: false, resultCode: res.data.ResultCode, resultDesc: res.data.ResultDesc }
  } catch {
    return { success: false }
  }
}

export function isConfigured(): boolean {
  return !!(CONSUMER_KEY && CONSUMER_SECRET && PASSKEY && SHORTCODE && CALLBACK_URL)
}

export { formatPhone }
