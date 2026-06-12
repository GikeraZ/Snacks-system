import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'

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
          orderItems: {
            include: { product: true },
          },
          delivery: true,
        },
      })

      const pointsEarned = Math.floor(Number(amount))
      await prisma.user.update({
        where: { id: session.user.id },
        data: { loyaltyPoints: { increment: pointsEarned } },
      })

      const receipt = {
        businessName: 'Danoscar Bite',
        orderNumber: order.orderNumber,
        transactionCode: mpesaReceipt,
        amount: Number(amount),
        phoneNumber: phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1****$3'),
        items: order.orderItems.map(i => ({
          name: i.product.name,
          quantity: i.quantity,
          price: i.unitPrice,
          total: i.totalPrice,
        })),
        date: new Date().toISOString(),
      }

      return res.status(200).json({
        success: true,
        mpesaCode,
        mpesaReceipt,
        receipt,
        orderId: order.id,
      })
    }

    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error) {
    console.error('M-Pesa API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
