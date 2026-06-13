import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { createOrderNotification } from '../../../lib/notifications'

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
        const itemTotal = Number(product.sellingPrice) * item.quantity
        totalAmount += itemTotal
        orderItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.sellingPrice,
          totalPrice: itemTotal,
        })
      }

      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

      const order = await prisma.order.create({
        data: {
          orderNumber,
          customerId: session.user.id,
          paymentMethod,
          totalAmount,
          deliveryFee: 0,
          notes: deliveryNotes,
          orderItems: { create: orderItemsData },
          delivery: {
            create: {
              locationType: deliveryLocation.type,
              locationDetails: deliveryLocation.details,
              customerName: session.user?.name || 'Customer',
              customerPhone: session.user?.phone || '',
            },
          },
        },
      })

      return res.status(201).json(JSON.parse(JSON.stringify(order)))
    }

    if (req.method === 'PUT') {
      const { id, status } = req.body
      if (!id || !status) {
        return res.status(400).json({ error: 'ID and status are required' })
      }
      const order = await prisma.order.update({
        where: { id },
        data: { status },
      })

      await createOrderNotification(id, status)

      return res.status(200).json(JSON.parse(JSON.stringify(order)))
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error) {
    console.error('Orders API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
