import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'

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

      const mpesaCode = `MP${Date.now()}`

      const order = await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentMethod: 'MPESA',
          paymentStatus: 'COMPLETED',
          mpesaCode,
        },
      })

      const pointsEarned = Math.floor(Number(amount))
      await prisma.user.update({
        where: { id: session.user.id },
        data: { loyaltyPoints: { increment: pointsEarned } },
      })

      return res.status(200).json({ success: true, mpesaCode, order: JSON.parse(JSON.stringify(order)) })
    }

    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error) {
    console.error('M-Pesa API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
