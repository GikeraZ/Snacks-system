import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)

    if (req.method === 'GET') {
      const now = new Date()
      const promotions = await prisma.promotion.findMany({
        where: {
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
        },
        include: { products: true },
      })
      return res.status(200).json(JSON.parse(JSON.stringify(promotions)))
    }

    if (req.method === 'POST') {
      if (!session || session.user.role !== 'SUPER_ADMIN') {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { title, description, type, discountType, discountValue, minOrderAmount, startDate, endDate, productIds } = req.body

      if (!title || !discountType || discountValue === undefined) {
        return res.status(400).json({ error: 'Title, discount type, and discount value are required' })
      }

      const promotion = await prisma.promotion.create({
        data: {
          title,
          description,
          type: type || 'GENERAL',
          discountType,
          discountValue: Number(discountValue),
          minOrderAmount: minOrderAmount ? Number(minOrderAmount) : null,
          startDate: new Date(startDate || Date.now()),
          endDate: new Date(endDate || Date.now()),
          products: {
            create: (productIds || []).map((id: string) => ({ productId: id })),
          },
        },
      })

      return res.status(201).json(promotion)
    }

    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error) {
    console.error('Promotions API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
