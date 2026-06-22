import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import bcrypt from 'bcryptjs'
import { sanitize, validatePhone, checkRateLimit, getRateLimitKey, auditLog } from '@/lib/security'

const VALID_ROLES = ['SUPER_ADMIN', 'CASHIER', 'KITCHEN_STAFF', 'DELIVERY', 'BUSINESS_PARTNER']

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
      if (!checkRateLimit(`employee-create:${getRateLimitKey(req)}`, 10, 60000)) {
        return res.status(429).json({ error: 'Too many requests. Try again later.' })
      }

      const { name, email, phone, password, role } = req.body
      if (!name || !phone || !password || !role) {
        return res.status(400).json({ error: 'Name, phone, password, and role are required' })
      }
      if (!validatePhone(phone)) {
        return res.status(400).json({ error: 'Invalid phone number' })
      }
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' })
      }
      if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` })
      }

      const existing = await prisma.user.findUnique({ where: { phone } })
      if (existing) {
        return res.status(409).json({ error: 'Phone number already registered' })
      }

      if (email) {
        const existingEmail = await prisma.user.findUnique({ where: { email } })
        if (existingEmail) {
          return res.status(409).json({ error: 'Email already registered' })
        }
      }

      const hashedPassword = await bcrypt.hash(password, 12)
      const user = await prisma.user.create({
        data: {
          name: sanitize(name),
          email: email || undefined,
          phone,
          password: hashedPassword,
          role,
          referralCode: `EMP-${Date.now().toString(36).toUpperCase()}`,
        },
        select: { id: true, name: true, email: true, phone: true, role: true, isActive: true },
      })

      await auditLog({
        userId: session.user.id,
        action: 'EMPLOYEE_CREATED',
        description: `Employee created: ${name}, role: ${role}`,
        req,
      })

      return res.status(201).json(user)
    }

    if (req.method === 'PUT') {
      const { id, name, email, phone, role, isActive, password } = req.body
      if (!id) return res.status(400).json({ error: 'ID is required' })

      const data: Record<string, unknown> = {}
      if (name) data.name = sanitize(name)
      if (email !== undefined) data.email = email || null
      if (phone) data.phone = phone
      if (role) {
        if (!VALID_ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role' })
        data.role = role
      }
      if (isActive !== undefined) data.isActive = isActive
      if (password) {
        if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })
        data.password = await bcrypt.hash(password, 12)
      }

      const user = await prisma.user.update({
        where: { id },
        data,
        select: { id: true, name: true, email: true, phone: true, role: true, isActive: true },
      })

      await auditLog({
        userId: session.user.id,
        action: 'EMPLOYEE_UPDATED',
        description: `Employee ${id} updated`,
        req,
      })

      return res.status(200).json(user)
    }

    if (req.method === 'DELETE') {
      const { id } = req.body
      if (!id) return res.status(400).json({ error: 'ID is required' })
      if (id === session.user.id) return res.status(400).json({ error: 'Cannot delete yourself' })

      await prisma.user.update({ where: { id }, data: { isActive: false } })

      await auditLog({
        userId: session.user.id,
        action: 'EMPLOYEE_DEACTIVATED',
        description: `Employee ${id} deactivated`,
        req,
      })

      return res.status(200).json({ message: 'User deactivated' })
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error) {
    console.error('Employees API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
