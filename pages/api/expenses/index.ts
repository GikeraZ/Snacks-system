import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { requireAuth, validateAmount, sanitize, auditLog } from '@/lib/security'

const ADMIN_ROLES = ['SUPER_ADMIN', 'BUSINESS_PARTNER'] as const

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await requireAuth(req, res)
    if (!session) return

    if (req.method === 'GET') {
      if (!ADMIN_ROLES.includes(session.user.role as typeof ADMIN_ROLES[number]) && session.user.role !== 'CASHIER') {
        return res.status(403).json({ error: 'Forbidden: insufficient permissions' })
      }
      const expenses = await prisma.expense.findMany({
        include: { user: { select: { name: true } } },
        orderBy: { date: 'desc' },
      })
      return res.status(200).json(JSON.parse(JSON.stringify(expenses)))
    }

    if (req.method === 'POST') {
      if (!ADMIN_ROLES.includes(session.user.role as typeof ADMIN_ROLES[number])) {
        return res.status(403).json({ error: 'Forbidden: insufficient permissions' })
      }
      const { category, amount, description, date } = req.body
      if (!category || amount === undefined) {
        return res.status(400).json({ error: 'Category and amount are required' })
      }
      if (!validateAmount(Number(amount))) {
        return res.status(400).json({ error: 'Amount must be a positive number' })
      }
      if (category.length > 100) {
        return res.status(400).json({ error: 'Category is too long' })
      }

      const expenseData: Record<string, unknown> = {
        userId: session.user.id,
        category: sanitize(category),
        amount: Number(amount),
        description: description ? sanitize(description) : null,
      }

      if (date) {
        const parsedDate = new Date(date)
        if (isNaN(parsedDate.getTime())) {
          return res.status(400).json({ error: 'Invalid date' })
        }
        expenseData.date = parsedDate
      }

      const expense = await prisma.expense.create({ data: expenseData as any })

      await auditLog({
        userId: session.user.id,
        action: 'EXPENSE_CREATED',
        description: `Expense: ${category}, amount: ${amount}`,
        req,
      })

      return res.status(201).json(expense)
    }

    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error) {
    console.error('Expenses API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
