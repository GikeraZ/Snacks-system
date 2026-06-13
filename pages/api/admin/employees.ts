import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import bcrypt from 'bcryptjs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (req.method === 'GET') {
      const users = await prisma.user.findMany({
        where: { role: { not: 'CUSTOMER' } },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })
      return res.status(200).json(JSON.parse(JSON.stringify(users)))
    }

    if (req.method === 'POST') {
      const { name, email, phone, password, role } = req.body
      if (!name || !phone || !password || !role) {
        return res.status(400).json({ error: 'Name, phone, password, and role are required' })
      }
      if (phone.length < 10) {
        return res.status(400).json({ error: 'Phone must be at least 10 characters' })
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' })
      }
      const validRoles = ['SUPER_ADMIN', 'CASHIER', 'KITCHEN_STAFF', 'DELIVERY', 'BUSINESS_PARTNER']
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' })
      }

      const existing = await prisma.user.findUnique({ where: { phone } })
      if (existing) {
        return res.status(409).json({ error: 'Phone number already registered' })
      }

      const hashedPassword = await bcrypt.hash(password, 10)
      const user = await prisma.user.create({
        data: {
          name,
          email: email || undefined,
          phone,
          password: hashedPassword,
          role,
          referralCode: `EMP-${Date.now().toString(36).toUpperCase()}`,
        },
        select: { id: true, name: true, email: true, phone: true, role: true, isActive: true },
      })
      return res.status(201).json(user)
    }

    if (req.method === 'PUT') {
      const { id, name, email, phone, role, isActive, password } = req.body
      if (!id) return res.status(400).json({ error: 'ID is required' })

      const data: Record<string, unknown> = {}
      if (name) data.name = name
      if (email !== undefined) data.email = email
      if (phone) data.phone = phone
      if (role) {
        const validRoles = ['SUPER_ADMIN', 'CASHIER', 'KITCHEN_STAFF', 'DELIVERY', 'BUSINESS_PARTNER']
        if (!validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' })
        data.role = role
      }
      if (isActive !== undefined) data.isActive = isActive
      if (password) data.password = await bcrypt.hash(password, 10)

      const user = await prisma.user.update({
        where: { id },
        data,
        select: { id: true, name: true, email: true, phone: true, role: true, isActive: true },
      })
      return res.status(200).json(user)
    }

    if (req.method === 'DELETE') {
      const { id } = req.body
      if (!id) return res.status(400).json({ error: 'ID is required' })
      if (id === session.user.id) return res.status(400).json({ error: 'Cannot delete yourself' })

      await prisma.user.update({ where: { id }, data: { isActive: false } })
      return res.status(200).json({ message: 'User deactivated' })
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error) {
    console.error('Employees API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
