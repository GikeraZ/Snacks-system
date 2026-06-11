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
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { loyaltyPoints: true },
      })

      const rules = await prisma.loyaltyRule.findMany({
        where: { isActive: true },
      })

      return res.status(200).json({
        points: user?.loyaltyPoints || 0,
        rules,
      })
    }

    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error) {
    console.error('Loyalty API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
