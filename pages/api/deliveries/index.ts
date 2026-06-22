import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { auditLog } from '@/lib/security'

const VALID_STATUSES = ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED']

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (req.method === 'GET') {
      const where: Record<string, string> = {}
      if (session.user.role === 'DELIVERY') {
        where.deliveryPersonId = session.user.id
      }
      const deliveries = await prisma.delivery.findMany({
        where,
        include: { order: { include: { orderItems: true } } },
        orderBy: { createdAt: 'desc' },
      })
      return res.status(200).json(JSON.parse(JSON.stringify(deliveries)))
    }

    if (req.method === 'PUT') {
      const { id, status, action } = req.body
      if (!id || (!status && !action)) {
        return res.status(400).json({ error: 'ID and status or action are required' })
      }

      const existing = await prisma.delivery.findUnique({
        where: { id },
        select: { id: true, deliveryPersonId: true, status: true },
      })

      if (!existing) {
        return res.status(404).json({ error: 'Delivery not found' })
      }

      if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'BUSINESS_PARTNER') {
        if (existing.deliveryPersonId && existing.deliveryPersonId !== session.user.id) {
          return res.status(403).json({ error: 'This delivery is not assigned to you' })
        }
      }

      if (status && !VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` })
      }

      const updateData: Record<string, unknown> = {}
      if (status) updateData.status = status
      if (action === 'assign') updateData.deliveryPersonId = session.user.id
      if (action === 'pickup') updateData.pickedAt = new Date()
      if (action === 'deliver') updateData.deliveredAt = new Date()

      const delivery = await prisma.delivery.update({
        where: { id },
        data: updateData,
      })

      await auditLog({
        userId: session.user.id,
        action: `DELIVERY_${status || action || 'UPDATE'}`,
        description: `Delivery ${id} updated to status: ${status || action}`,
        req,
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
