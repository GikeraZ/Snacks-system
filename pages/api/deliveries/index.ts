import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (req.method === 'GET') {
      const deliveries = await prisma.delivery.findMany({
        where: { deliveryPersonId: session.user.id },
        include: { order: { include: { orderItems: true } } },
        orderBy: { createdAt: 'desc' },
      })
      return res.status(200).json(JSON.parse(JSON.stringify(deliveries)))
    }

    if (req.method === 'PUT') {
      const { id, status } = req.body
      if (!id || !status) {
        return res.status(400).json({ error: 'ID and status are required' })
      }
      const delivery = await prisma.delivery.update({
        where: { id },
        data: { status },
      })
      return res.status(200).json(delivery)
    }

    res.setHeader('Allow', ['GET', 'PUT'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error) {
    console.error('Deliveries API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
