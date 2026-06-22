import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { createOrderNotification } from '../../../lib/notifications'
import { generateOrderNumber, sanitize, auditLog } from '@/lib/security'

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']
const ADMIN_ROLES = ['SUPER_ADMIN', 'BUSINESS_PARTNER', 'CASHIER']

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (req.method === 'GET') {
      const where: Record<string, string> = {}
      if (session.user.role === 'CUSTOMER') {
        where.customerId = session.user.id
      }
      const orders = await prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      })
      return res.status(200).json(JSON.parse(JSON.stringify(orders)))
    }

    if (req.method === 'POST') {
      const {
        items,
        paymentMethod,
        deliveryLocation,
        deliveryNotes,
      } = req.body

      if (!items?.length || !deliveryLocation?.details) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      let totalAmount = 0
      const orderItemsData: Array<{ productId: string; quantity: number; unitPrice: number; totalPrice: number }> = []

      for (const item of items) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } })
        if (!product) {
          return res.status(400).json({ error: `Product ${item.productId} not found` })
        }
        if (!product.isActive) {
          return res.status(400).json({ error: `${product.name} is not available` })
        }
        if (product.stockQuantity < item.quantity) {
          return res.status(400).json({ error: `Insufficient stock for ${product.name}` })
        }
        if (item.quantity < 1) {
          return res.status(400).json({ error: 'Invalid quantity' })
        }
        const itemTotal = Number(product.sellingPrice) * item.quantity
        totalAmount += itemTotal
        orderItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: Number(product.sellingPrice),
          totalPrice: itemTotal,
        })
      }

      const orderNumber = generateOrderNumber()

      const order = await prisma.order.create({
        data: {
          orderNumber,
          customerId: session.user.id,
          paymentMethod,
          totalAmount,
          deliveryFee: 0,
          notes: sanitize(deliveryNotes),
          orderItems: { create: orderItemsData },
          delivery: {
            create: {
              locationType: deliveryLocation.type,
              locationDetails: sanitize(deliveryLocation.details),
              customerName: session.user?.name || 'Customer',
              customerPhone: session.user?.phone || '',
            },
          },
        },
      })

      await auditLog({
        userId: session.user.id,
        action: 'ORDER_CREATED',
        description: `Order ${orderNumber} created with ${items.length} items, total: ${totalAmount}`,
        req,
      })

      return res.status(201).json(JSON.parse(JSON.stringify(order)))
    }

    if (req.method === 'PUT') {
      const { id, status } = req.body
      if (!id || !status) {
        return res.status(400).json({ error: 'ID and status are required' })
      }

      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` })
      }

      const existing = await prisma.order.findUnique({
        where: { id },
        select: { customerId: true },
      })

      if (!existing) {
        return res.status(404).json({ error: 'Order not found' })
      }

      if (!ADMIN_ROLES.includes(session.user.role as string)) {
        return res.status(403).json({ error: 'Only staff can update order status' })
      }

      const order = await prisma.order.update({
        where: { id },
        data: { status },
      })

      await createOrderNotification(id, status)

      await auditLog({
        userId: session.user.id,
        action: `ORDER_${status}`,
        description: `Order ${id} status updated to ${status}`,
        req,
      })

      return res.status(200).json(JSON.parse(JSON.stringify(order)))
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error) {
    console.error('Orders API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
