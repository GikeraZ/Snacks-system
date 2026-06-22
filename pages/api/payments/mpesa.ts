import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { stkPush, isConfigured } from '@/lib/mpesa'

function generateMpesaReceipt(): string {
  const prefix = 'PBC'
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${prefix}${result}`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session || !session.user.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (req.method === 'POST') {
      const { phoneNumber, amount, orderId } = req.body

      if (!orderId || !amount) {
        return res.status(400).json({ error: 'Order ID and amount are required' })
      }

      if (!phoneNumber) {
        return res.status(400).json({ error: 'M-Pesa phone number is required' })
      }

      const existing = await prisma.order.findUnique({
        where: { id: orderId },
        select: { paymentStatus: true, customerId: true, notes: true },
      })
      if (!existing) {
        return res.status(404).json({ error: 'Order not found' })
      }
      if (existing.paymentStatus === 'COMPLETED') {
        return res.status(400).json({ error: 'Order already paid' })
      }
      if (existing.customerId !== session.user.id) {
        return res.status(403).json({ error: 'Order does not belong to you' })
      }

      if (isConfigured()) {
        const result = await stkPush(phoneNumber, amount, `ORD-${orderId.slice(-8)}`, 'Hot Take Payment')

        if (!result.success) {
          return res.status(400).json({ error: result.error || 'M-Pesa STK push failed' })
        }

        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentMethod: 'MPESA',
            mpesaCode: result.checkoutRequestId,
            notes: `CheckoutRequestID: ${result.checkoutRequestId} | ${existing.notes || ''}`,
          },
        })

        return res.status(200).json({
          success: true,
          checkoutRequestId: result.checkoutRequestId,
          merchantRequestId: result.merchantRequestId,
          orderId,
          message: 'M-Pesa STK push sent. Check your phone to enter PIN.',
        })
      }

      const mpesaReceipt = generateMpesaReceipt()
      const mpesaCode = `MP${Date.now()}`

      const order = await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentMethod: 'MPESA',
          paymentStatus: 'COMPLETED',
          mpesaCode,
          mpesaReceipt,
        },
        include: {
          orderItems: { include: { product: true } },
          delivery: true,
        },
      })

      for (const item of order.orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } },
        })
      }

      const pointsEarned = Math.floor(Number(amount))
      await prisma.user.update({
        where: { id: session.user.id },
        data: { loyaltyPoints: { increment: pointsEarned } },
      })

      const businessName = (await prisma.receiptSetting.findFirst())?.businessName || 'Hot Take'
      const maskedPhone = phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1****$3')

      return res.status(200).json({
        success: true,
        mpesaCode,
        mpesaReceipt,
        receipt: {
          businessName,
          orderNumber: order.orderNumber,
          transactionCode: mpesaReceipt,
          amount: Number(amount),
          phoneNumber: maskedPhone,
          items: order.orderItems.map(i => ({
            name: i.product.name,
            quantity: i.quantity,
            price: i.unitPrice,
            total: i.totalPrice,
          })),
          date: new Date().toISOString(),
        },
        orderId: order.id,
        simulated: true,
        message: 'Demo mode: M-Pesa payment simulated.',
      })
    }

    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error) {
    console.error('M-Pesa API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
