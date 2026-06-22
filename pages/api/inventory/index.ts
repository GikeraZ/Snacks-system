import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { requireAuth, sanitize, auditLog } from '@/lib/security'

const ADMIN_ROLES = ['SUPER_ADMIN', 'BUSINESS_PARTNER'] as const

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await requireAuth(req, res)
    if (!session) return

    if (req.method === 'GET') {
      if (!ADMIN_ROLES.includes(session.user.role as typeof ADMIN_ROLES[number]) && session.user.role !== 'KITCHEN_STAFF') {
        return res.status(403).json({ error: 'Forbidden: insufficient permissions' })
      }
      const ingredients = await prisma.ingredient.findMany({
        orderBy: { name: 'asc' },
      })
      return res.status(200).json(JSON.parse(JSON.stringify(ingredients)))
    }

    if (req.method === 'POST') {
      if (!ADMIN_ROLES.includes(session.user.role as typeof ADMIN_ROLES[number])) {
        return res.status(403).json({ error: 'Forbidden: insufficient permissions' })
      }
      const { name, unit, costPerUnit, stockQuantity, lowStockAlert } = req.body
      if (!name || !unit) {
        return res.status(400).json({ error: 'Name and unit are required' })
      }
      if (Number(costPerUnit) < 0 || Number(stockQuantity) < 0) {
        return res.status(400).json({ error: 'Numeric values cannot be negative' })
      }

      const ingredient = await prisma.ingredient.create({
        data: {
          name: sanitize(name),
          unit: sanitize(unit),
          costPerUnit: Math.max(0, Number(costPerUnit) || 0),
          stockQuantity: Math.max(0, Number(stockQuantity) || 0),
          lowStockAlert: Math.max(0, Number(lowStockAlert) || 10),
        },
      })

      await auditLog({
        userId: session.user.id,
        action: 'INGREDIENT_CREATED',
        description: `Ingredient added: ${name}, unit: ${unit}`,
        req,
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
