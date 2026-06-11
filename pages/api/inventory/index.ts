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
      const ingredients = await prisma.ingredient.findMany({
        orderBy: { name: 'asc' },
      })
      return res.status(200).json(JSON.parse(JSON.stringify(ingredients)))
    }

    if (req.method === 'POST') {
      const { name, unit, costPerUnit, stockQuantity, lowStockAlert } = req.body
      if (!name || !unit) {
        return res.status(400).json({ error: 'Name and unit are required' })
      }
      const ingredient = await prisma.ingredient.create({
        data: {
          name,
          unit,
          costPerUnit: Number(costPerUnit) || 0,
          stockQuantity: Number(stockQuantity) || 0,
          lowStockAlert: Number(lowStockAlert) || 10,
        },
      })
      return res.status(201).json(ingredient)
    }

    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error) {
    console.error('Inventory API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
