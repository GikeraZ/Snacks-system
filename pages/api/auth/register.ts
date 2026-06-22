import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import bcrypt from 'bcryptjs'
import { sanitize, validatePhone, checkRateLimit, getRateLimitKey, auditLog, generateSecureToken } from '@/lib/security'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  if (!checkRateLimit(`register:${getRateLimitKey(req)}`, 5, 60000)) {
    return res.status(429).json({ error: 'Too many registration attempts. Try again later.' })
  }

  try {
    const { name, phone, email, password } = req.body

    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'Name, phone, and password are required' })
    }

    if (!validatePhone(phone)) {
      return res.status(400).json({ error: 'Invalid phone number' })
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({ error: 'Name must be between 2 and 100 characters' })
    }

    if (email && email.length > 254) {
      return res.status(400).json({ error: 'Email is too long' })
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
    const referralCode = `REF${generateSecureToken(8).toUpperCase()}`

    const user = await prisma.user.create({
      data: {
        name: sanitize(name),
        phone,
        email: email || null,
        password: hashedPassword,
        role: 'CUSTOMER',
        referralCode,
      },
    })

    await prisma.customer.create({
      data: {
        userId: user.id,
        loyaltyPoints: 0,
        totalSpent: 0,
        referralPoints: 0,
      },
    })

    await auditLog({
      action: 'USER_REGISTERED',
      description: `New user registered: ${phone}`,
      req,
    })

    return res.status(201).json({ message: 'User created successfully', userId: user.id })
  } catch (error) {
    console.error('Registration error:', error)
    const message = error instanceof Error && 'code' in error && (error as any).code === 'P2002'
      ? 'Phone number or email already registered'
      : 'Failed to create user'
    return res.status(500).json({ error: message })
  }
}
