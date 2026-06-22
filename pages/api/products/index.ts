import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { sanitize, sanitizeObject, auditLog } from '@/lib/security'

const ADMIN_ROLES = ['SUPER_ADMIN', 'BUSINESS_PARTNER']

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)

    if (req.method === 'GET') {
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      const products = await prisma.product.findMany({
        include: { category: true },
        orderBy: { name: 'asc' },
      })
      return res.status(200).json(JSON.parse(JSON.stringify(products)))
    }

    if (req.method === 'POST') {
      if (!session || !ADMIN_ROLES.includes(session.user.role as string)) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      const { name, categoryId, costPrice, sellingPrice, stockQuantity, lowStockAlert, imageUrl, imageData, description } = req.body
      if (!name || !categoryId) {
        return res.status(400).json({ error: 'Name and category are required' })
      }

      const product = await prisma.product.create({
        data: {
          name: sanitize(name),
          slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          categoryId,
          costPrice: Math.max(0, Number(costPrice) || 0),
          sellingPrice: Math.max(0, Number(sellingPrice) || 0),
          stockQuantity: Math.max(0, Number(stockQuantity) || 0),
          lowStockAlert: Math.max(0, Number(lowStockAlert) || 10),
          imageUrl: imageUrl || (imageData ? '' : imageUrl),
          imageData: imageData || undefined,
          ...(description && { description: sanitize(description) }),
        },
      })

      if (imageData) {
        await prisma.product.update({
          where: { id: product.id },
          data: { imageUrl: `/api/images/${product.id}` },
        })
        product.imageUrl = `/api/images/${product.id}`
      }

      await auditLog({
        userId: session.user.id,
        action: 'PRODUCT_CREATED',
        description: `Product created: ${name}`,
        req,
      })

      return res.status(201).json(product)
    }

    if (req.method === 'PUT') {
      if (!session || !ADMIN_ROLES.includes(session.user.role as string)) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      const { id, name, categoryId, costPrice, sellingPrice, stockQuantity, lowStockAlert, description, imageUrl, imageData, isActive } = req.body
      if (!id) return res.status(400).json({ error: 'ID is required' })

      const data: Record<string, unknown> = {}
      if (name) {
        data.name = sanitize(name)
        data.slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      }
      if (categoryId) data.categoryId = categoryId
      if (costPrice !== undefined) data.costPrice = Math.max(0, Number(costPrice))
      if (sellingPrice !== undefined) data.sellingPrice = Math.max(0, Number(sellingPrice))
      if (stockQuantity !== undefined) data.stockQuantity = Math.max(0, Number(stockQuantity))
      if (lowStockAlert !== undefined) data.lowStockAlert = Math.max(0, Number(lowStockAlert))
      if (description !== undefined) data.description = sanitize(description || '')
      if (imageData !== undefined) data.imageData = imageData
      if (imageUrl !== undefined) data.imageUrl = imageUrl
      if (isActive !== undefined) data.isActive = isActive

      const product = await prisma.product.update({ where: { id }, data })

      await auditLog({
        userId: session.user.id,
        action: 'PRODUCT_UPDATED',
        description: `Product updated: ${name || id}`,
        req,
      })

      return res.status(200).json(product)
    }

    if (req.method === 'DELETE') {
      if (!session || session.user.role !== 'SUPER_ADMIN') {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      const { id } = req.body
      if (!id) return res.status(400).json({ error: 'ID is required' })
      await prisma.product.update({ where: { id }, data: { isActive: false } })

      await auditLog({
        userId: session.user.id,
        action: 'PRODUCT_DEACTIVATED',
        description: `Product deactivated: ${id}`,
        req,
      })

      return res.status(200).json({ message: 'Product deactivated' })
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error) {
    console.error('Products API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
