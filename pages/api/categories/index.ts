import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { sanitize, auditLog } from '@/lib/security'

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
      if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'BUSINESS_PARTNER') {
        return res.status(403).json({ error: 'Forbidden: insufficient permissions' })
      }
      const { name, description } = req.body
      if (!name || name.trim().length < 2) {
        return res.status(400).json({ error: 'Name is required (min 2 characters)' })
      }
      if (name.length > 100) {
        return res.status(400).json({ error: 'Name is too long' })
      }

      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      const existing = await prisma.category.findUnique({ where: { slug } })
      if (existing) {
        return res.status(409).json({ error: 'Category with this name already exists' })
      }

      const category = await prisma.category.create({
        data: {
          name: sanitize(name),
          slug,
          description: description ? sanitize(description) : undefined,
        },
      })

      await auditLog({
        userId: session.user.id,
        action: 'CATEGORY_CREATED',
        description: `Category created: ${name}`,
        req,
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
