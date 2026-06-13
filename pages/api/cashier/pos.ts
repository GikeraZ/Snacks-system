import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session || (session.user.role !== 'CASHIER' && session.user.role !== 'SUPER_ADMIN')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (req.method === 'POST') {
      const { items, paymentMethod, customerPhone, amountPaid, change } = req.body

      if (!items?.length) {
        return res.status(400).json({ error: 'At least one item is required' })
      }

      if (!customerPhone) {
        return res.status(400).json({ error: 'Customer phone number is required' })
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
        const itemTotal = Number(product.sellingPrice) * item.quantity
        totalAmount += itemTotal
        orderItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.sellingPrice,
          totalPrice: itemTotal,
        })
      }

      const orderNumber = `POS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

      const order = await prisma.order.create({
        data: {
          orderNumber,
          customerId: session.user.id,
          paymentMethod,
          paymentStatus: paymentMethod === 'MPESA' ? 'PENDING' : 'COMPLETED',
          totalAmount,
          deliveryFee: 0,
          notes: `POS sale | Cashier: ${session.user.name || session.user.id}`,
          orderItems: { create: orderItemsData },
          delivery: {
            create: {
              locationType: 'POS',
              locationDetails: 'Counter sale',
              customerName: 'Walk-in Customer',
              customerPhone,
            },
          },
        },
        include: {
          orderItems: { include: { product: true } },
        },
      })

      if (paymentMethod !== 'MPESA') {
        for (const item of items) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { decrement: item.quantity } },
          })
        }
      }

      return res.status(201).json({
        id: order.id,
        orderNumber,
        totalAmount,
        paymentMethod,
        paymentStatus: order.paymentStatus,
        items: order.orderItems.map(i => ({
          name: i.product.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
        })),
        cashier: session.user.name || 'Cashier',
        customerPhone,
        amountPaid: amountPaid || totalAmount,
        change: change || 0,
        createdAt: order.createdAt.toISOString(),
      })
    }

    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error) {
    console.error('Cashier POS API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
