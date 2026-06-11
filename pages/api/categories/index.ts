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
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
      })
      return res.status(200).json(categories)
    }

    if (req.method === 'POST') {
      const { name, description } = req.body
      if (!name) {
        return res.status(400).json({ error: 'Name is required' })
      }
      const category = await prisma.category.create({
        data: {
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-'),
          description,
        },
      })
      return res.status(201).json(category)
    }

    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error) {
    console.error('Categories API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
