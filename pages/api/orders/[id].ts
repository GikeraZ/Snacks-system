import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'BUSINESS_PARTNER', 'CASHIER']

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { id } = req.query
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid order ID' })
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: { include: { product: { select: { name: true, sellingPrice: true } } } },
        delivery: { select: { customerPhone: true } },
        customer: { select: { name: true } },
      },
    })

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    if (order.customerId !== session.user.id && !ALLOWED_ROLES.includes(session.user.role as string)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    return res.status(200).json(order)
  } catch (error) {
    console.error('Fetch order error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
