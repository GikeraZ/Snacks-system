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

    if (req.method === 'POST') {
      const {
        items,
        paymentMethod,
        deliveryLocation,
        deliveryNotes,
        phone,
      } = req.body

      if (!items?.length || !deliveryLocation?.details || !phone) {
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
          unitPrice: Number(product.sellingPrice),
          totalPrice: itemTotal,
        })
      }

      const deliveryFee = totalAmount > 1000 ? 0 : 50
      totalAmount += deliveryFee

      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

      const matchedUser = await prisma.user.findFirst({
        where: { phone },
        select: { id: true },
      })

      const customer = matchedUser
        ? await prisma.customer.findUnique({ where: { userId: matchedUser.id } })
        : null

      const order = await prisma.order.create({
        data: {
          orderNumber,
          customerId: customer?.userId || session.user.id,
          paymentMethod,
          totalAmount,
          deliveryFee,
          notes: deliveryNotes,
          orderItems: { create: orderItemsData },
          delivery: {
            create: {
              locationType: deliveryLocation.type,
              locationDetails: deliveryLocation.details,
              customerName: session.user?.name || 'Customer',
              customerPhone: phone,
            },
          },
        },
        include: { orderItems: true },
      })

      return res.status(201).json({
        id: order.id,
        orderNumber,
        totalAmount,
        paymentMethod,
        deliveryFee,
        createdAt: order.createdAt.toISOString(),
      })
    }

    if (req.method === 'GET') {
      const orders = await prisma.order.findMany({
        where: { customerId: session.user.id },
        include: {
          orderItems: { include: { product: true } },
          delivery: true,
        },
        orderBy: { createdAt: 'desc' },
      })
      return res.status(200).json(JSON.parse(JSON.stringify(orders)))
    }

    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error) {
    console.error('Customer orders API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
