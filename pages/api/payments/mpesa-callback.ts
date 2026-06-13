import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { queryStatus, isConfigured } from '@/lib/mpesa'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
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
            await prisma.order.update({
              where: { id: order.id },
              data: {
                paymentMethod: 'MPESA',
                paymentStatus: 'COMPLETED',
                mpesaReceipt: callbackResult.mpesaReceipt,
              },
            })

            const items = await prisma.orderItem.findMany({
              where: { orderId: order.id },
            })

            for (const item of items) {
              await prisma.product.update({
                where: { id: item.productId },
                data: { stockQuantity: { decrement: item.quantity } },
              })
            }

            const pointsEarned = Math.floor(callbackResult.amount || 0)
            await prisma.user.update({
              where: { id: order.customerId },
              data: { loyaltyPoints: { increment: pointsEarned } },
            })

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
    const phone = getItem('PhoneNumber') as string | undefined

    if (!mpesaReceipt) {
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'No receipt' })
    }

    const order = await prisma.order.findFirst({
      where: { mpesaCode: checkoutRequestId },
    })

    if (!order) {
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Order not found' })
    }

    if (order.paymentStatus === 'COMPLETED') {
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Already completed' })
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'COMPLETED',
        mpesaReceipt,
        ...(phone ? { delivery: { update: { customerPhone: phone } } } : {}),
      },
    })

    const items = await prisma.orderItem.findMany({
      where: { orderId: order.id },
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

    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' })
  } catch (error) {
    console.error('M-Pesa callback error:', error)
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Error accepted' })
  }
}
