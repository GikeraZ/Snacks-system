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

    const { period = 'today', type = 'sales' } = req.query

    if (req.method === 'GET') {
      const now = new Date()
      let startDate: Date

      if (period === 'today') {
        startDate = new Date(now.setHours(0, 0, 0, 0))
      } else if (period === 'week') {
        startDate = new Date(now.setDate(now.getDate() - 7))
      } else if (period === 'month') {
        startDate = new Date(now.setMonth(now.getMonth() - 1))
      } else {
        startDate = new Date(new Date().setHours(0, 0, 0, 0))
      }

      if (type === 'sales') {
        const orders = await prisma.order.findMany({
          where: { createdAt: { gte: startDate } },
          include: { orderItems: true },
        })

        const salesData = orders.reduce((acc: Record<string, number>, order) => {
          const date = order.createdAt.toISOString().split('T')[0]
          acc[date] = (acc[date] || 0) + Number(order.totalAmount)
          return acc
        }, {})

        return res.status(200).json({
          period,
          type,
          data: salesData,
          totalSales: orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
          totalOrders: orders.length,
        })
      }

      if (type === 'expenses') {
        const expenses = await prisma.expense.findMany({
          where: { date: { gte: startDate } },
        })

        const expenseData = expenses.reduce((acc: Record<string, number>, exp) => {
          const date = exp.date.toISOString().split('T')[0]
          acc[date] = (acc[date] || 0) + Number(exp.amount)
          return acc
        }, {})

        return res.status(200).json({
          period,
          type,
          data: expenseData,
          totalExpenses: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
        })
      }

      if (type === 'products') {
        const products = await prisma.orderItem.groupBy({
          by: ['productId'],
          where: { order: { createdAt: { gte: startDate } } },
          _sum: { quantity: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 10,
        })

        return res.status(200).json({
          period,
          type,
          data: products,
        })
      }

      return res.status(400).json({ error: 'Invalid report type' })
    }

    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error) {
    console.error('Reports API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
