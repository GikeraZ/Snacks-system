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

    if (req.method === 'GET') {
      const notifications = await prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      return res.status(200).json(JSON.parse(JSON.stringify(notifications)))
    }

    if (req.method === 'PUT') {
      const { ids, readAll } = req.body
      if (readAll) {
        await prisma.notification.updateMany({
          where: { userId: session.user.id, read: false },
          data: { read: true },
        })
      } else if (Array.isArray(ids) && ids.length > 0) {
        await prisma.notification.updateMany({
          where: { id: { in: ids }, userId: session.user.id },
          data: { read: true },
        })
      }
      return res.status(200).json({ success: true })
    }

    res.setHeader('Allow', ['GET', 'PUT'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error) {
    console.error('Notifications API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
