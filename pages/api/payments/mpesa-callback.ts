import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { queryStatus } from '@/lib/mpesa'
import { auditLog } from '@/lib/security'

const CALLBACK_SECRET = process.env.MPESA_CALLBACK_SECRET || ''
const SAFARICOM_IPS = ['196.201.214.200', '196.201.214.206', '196.201.213.114', '196.201.214.207', '196.201.213.44', '196.201.212.127', '196.201.212.138', '196.201.212.129']

function validateCallbackOrigin(req: NextApiRequest): boolean {
  if (CALLBACK_SECRET) {
    const authHeader = req.headers['authorization'] as string || ''
    const bearerToken = authHeader.replace('Bearer ', '').trim()
    if (bearerToken === CALLBACK_SECRET) return true
  }

  const forwarded = req.headers['x-forwarded-for'] as string || ''
  const ip = forwarded.split(',')[0]?.trim() || req.socket.remoteAddress || ''
  if (SAFARICOM_IPS.includes(ip)) return true

  if (process.env.NODE_ENV === 'development') return true

  return false
}

async function completePayment(orderId: string, mpesaReceipt: string, amount: number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { paymentStatus: true, customerId: true, totalAmount: true },
  })

  if (!order || order.paymentStatus === 'COMPLETED') return

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'COMPLETED',
      mpesaReceipt,
    },
  })

  const items = await prisma.orderItem.findMany({
    where: { orderId },
  })

  for (const item of items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stockQuantity: { decrement: item.quantity } },
    })
  }

  const pointsEarned = Math.floor(amount || Number(order.totalAmount))
  await prisma.user.update({
    where: { id: order.customerId },
    data: { loyaltyPoints: { increment: pointsEarned } },
  })

  await auditLog({
    action: 'MPESA_CALLBACK',
    description: `Payment completed for order ${orderId}, receipt: ${mpesaReceipt}`,
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    if (!validateCallbackOrigin(req)) {
      console.warn('M-Pesa callback validation failed - possible spoof attempt')
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Received' })
    }

    const body = req.body
    const checkoutRequestId = body?.Body?.stkCallback?.CheckoutRequestID

    if (!checkoutRequestId) {
      const { checkoutRequestId: crid } = req.query
      if (crid && typeof crid === 'string') {
        const callbackResult = await queryStatus(crid)
        if (callbackResult.success && callbackResult.mpesaReceipt) {
          const order = await prisma.order.findFirst({
            where: { mpesaCode: crid },
          })
          if (order && order.paymentStatus !== 'COMPLETED') {
            await completePayment(order.id, callbackResult.mpesaReceipt, callbackResult.amount || 0)
            return res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' })
          }
        }
        return res.status(200).json({ ResultCode: 1, ResultDesc: 'Not found or already completed' })
      }
      return res.status(400).json({ error: 'Missing CheckoutRequestID' })
    }

    const resultCode = body.Body.stkCallback.ResultCode
    const resultDesc = body.Body.stkCallback.ResultDesc

    if (resultCode !== 0) {
      console.warn('M-Pesa callback failed:', resultDesc)
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Received' })
    }

    const metadata = body.Body.stkCallback.CallbackMetadata?.Item || []
    const getItem = (key: string) => metadata.find((i: { Name: string; Value?: unknown }) => i.Name === key)?.Value

    const mpesaReceipt = getItem('MpesaReceiptNumber') as string | undefined
    const amount = getItem('Amount') as number | undefined

    if (!mpesaReceipt) {
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'No receipt' })
    }

    const order = await prisma.order.findFirst({
      where: { mpesaCode: checkoutRequestId },
    })

    if (!order) {
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Order not found' })
    }

    await completePayment(order.id, mpesaReceipt, amount || Number(order.totalAmount))

    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' })
  } catch (error) {
    console.error('M-Pesa callback error:', error)
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Error accepted' })
  }
}
