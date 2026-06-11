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

    if (req.method === 'GET') {
      const expenses = await prisma.expense.findMany({
        include: { user: { select: { name: true } } },
        orderBy: { date: 'desc' },
      })
      return res.status(200).json(JSON.parse(JSON.stringify(expenses)))
    }

    if (req.method === 'POST') {
      const { category, amount, description, date } = req.body
      if (!category || amount === undefined) {
        return res.status(400).json({ error: 'Category and amount are required' })
      }
      const expense = await prisma.expense.create({
        data: {
          userId: session.user.id,
          category,
          amount: Number(amount),
          description: description || null,
          date: date ? new Date(date) : new Date(),
        },
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
