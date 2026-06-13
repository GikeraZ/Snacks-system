import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'BUSINESS_PARTNER')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET'])
      return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    const { period = 'today', type = 'sales' } = req.query

    const now = new Date()
    let startDate: Date

    if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else if (period === 'week') {
      const day = now.getDay()
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day)
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
    }

    const results: Record<string, unknown> = { period, startDate: startDate.toISOString() }

    if (type === 'sales' || type === 'all') {
      const orders = await prisma.order.findMany({
        where: { createdAt: { gte: startDate }, status: { not: 'CANCELLED' } },
        orderBy: { createdAt: 'asc' },
      })

      const dailyMap = new Map<string, { sales: number; orders: number; items: number }>()
      for (const order of orders) {
        const day = order.createdAt.toISOString().slice(0, 10)
        const existing = dailyMap.get(day) || { sales: 0, orders: 0, items: 0 }
        existing.sales += Number(order.totalAmount)
        existing.orders += 1
        dailyMap.set(day, existing)
      }

      const daily = Array.from(dailyMap.entries()).map(([date, data]) => ({ date, ...data }))

      // Get order items count
      const orderIds = orders.map(o => o.id)
      const items = orderIds.length > 0
        ? await prisma.orderItem.groupBy({ by: ['orderId'], _sum: { quantity: true }, where: { orderId: { in: orderIds } } })
        : []

      const itemsByOrder = new Map(items.map(i => [i.orderId, i._sum.quantity || 0]))
      const orderDates = new Map(orders.map(o => [o.id, o.createdAt.toISOString().slice(0, 10)]))
      const itemsByDate = new Map<string, number>()
      for (const [orderId, qty] of itemsByOrder) {
        const date = orderDates.get(orderId)
        if (date) itemsByDate.set(date, (itemsByDate.get(date) || 0) + qty)
      }

      results.sales = {
        total: orders.reduce((s, o) => s + Number(o.totalAmount), 0),
        count: orders.length,
        average: orders.length > 0 ? orders.reduce((s, o) => s + Number(o.totalAmount), 0) / orders.length : 0,
        daily: daily.map(d => ({ ...d, items: itemsByDate.get(d.date) || 0 })),
      }
    }

    if (type === 'expenses' || type === 'all') {
      const expenses = await prisma.expense.findMany({
        where: { date: { gte: startDate } },
        orderBy: { date: 'asc' },
      })

      const dailyMap = new Map<string, number>()
      const categoryMap = new Map<string, number>()
      for (const exp of expenses) {
        const day = exp.date.toISOString().slice(0, 10)
        dailyMap.set(day, (dailyMap.get(day) || 0) + Number(exp.amount))
        categoryMap.set(exp.category, (categoryMap.get(exp.category) || 0) + Number(exp.amount))
      }

      results.expenses = {
        total: expenses.reduce((s, e) => s + Number(e.amount), 0),
        count: expenses.length,
        daily: Array.from(dailyMap.entries()).map(([date, amount]) => ({ date, amount })),
        byCategory: Array.from(categoryMap.entries()).map(([category, amount]) => ({ category, amount })),
      }
    }

    if (type === 'products' || type === 'all') {
      const orders = await prisma.order.findMany({
        where: { createdAt: { gte: startDate }, status: { not: 'CANCELLED' } },
        select: { id: true },
      })
      const orderIds = orders.map(o => o.id)

      if (orderIds.length > 0) {
        const topProducts = await prisma.orderItem.groupBy({
          by: ['productId'],
          _sum: { quantity: true, totalPrice: true },
          where: { orderId: { in: orderIds } },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 10,
        })

        const productIds = topProducts.map(p => p.productId)
        const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } })
        const productNames = new Map(products.map(p => [p.id, p.name]))

        results.topProducts = topProducts.map(p => ({
          productId: p.productId,
          name: productNames.get(p.productId) || 'Unknown',
          quantity: p._sum.quantity || 0,
          revenue: p._sum.totalPrice || 0,
        }))
      } else {
        results.topProducts = []
      }
    }

    return res.status(200).json(results)
  } catch (error) {
    console.error('Reports API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
