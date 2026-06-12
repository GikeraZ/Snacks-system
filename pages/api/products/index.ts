import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'

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
      if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'BUSINESS_PARTNER')) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      const { name, categoryId, costPrice, sellingPrice, stockQuantity, lowStockAlert, imageUrl, imageData, description } = req.body
      if (!name || !categoryId) {
        return res.status(400).json({ error: 'Name and category are required' })
      }

      const product = await prisma.product.create({
        data: {
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          categoryId,
          costPrice: Number(costPrice) || 0,
          sellingPrice: Number(sellingPrice) || 0,
          stockQuantity: Number(stockQuantity) || 0,
          lowStockAlert: Number(lowStockAlert) || 10,
          imageUrl: imageUrl || (imageData ? '' : imageUrl),
          imageData: imageData || undefined,
          ...(description && { description }),
        },
      })

      if (imageData) {
        await prisma.product.update({
          where: { id: product.id },
          data: { imageUrl: `/api/images/${product.id}` },
        })
        product.imageUrl = `/api/images/${product.id}`
      }
      return res.status(201).json(product)
    }

    if (req.method === 'PUT') {
      if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'BUSINESS_PARTNER')) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      const { id, name, categoryId, costPrice, sellingPrice, stockQuantity, lowStockAlert, description, imageUrl, imageData, isActive } = req.body
      if (!id) return res.status(400).json({ error: 'ID is required' })

      const data: Record<string, unknown> = {}
      if (name) data.name = name
      if (name) data.slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      if (categoryId) data.categoryId = categoryId
      if (costPrice !== undefined) data.costPrice = Number(costPrice)
      if (sellingPrice !== undefined) data.sellingPrice = Number(sellingPrice)
      if (stockQuantity !== undefined) data.stockQuantity = Number(stockQuantity)
      if (lowStockAlert !== undefined) data.lowStockAlert = Number(lowStockAlert)
      if (description !== undefined) data.description = description
      if (imageData !== undefined) data.imageData = imageData
      if (imageUrl !== undefined) data.imageUrl = imageUrl
      if (isActive !== undefined) data.isActive = isActive

      const product = await prisma.product.update({ where: { id }, data })
      return res.status(200).json(product)
    }

    if (req.method === 'DELETE') {
      if (!session || session.user.role !== 'SUPER_ADMIN') {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      const { id } = req.body
      if (!id) return res.status(400).json({ error: 'ID is required' })
      await prisma.product.update({ where: { id }, data: { isActive: false } })
      return res.status(200).json({ message: 'Product deactivated' })
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error) {
    console.error('Products API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
