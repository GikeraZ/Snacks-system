import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import bcrypt from 'bcryptjs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    const { name, phone, email, password } = req.body

    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'Name, phone, and password are required' })
    }

    if (phone.length < 10) {
      return res.status(400).json({ error: 'Invalid phone number' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    const existing = await prisma.user.findUnique({ where: { phone } })
    if (existing) {
      return res.status(409).json({ error: 'Phone number already registered' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const referralCode = `REF${Date.now().toString(36).toUpperCase()}`

    const user = await prisma.user.create({
      data: {
        name,
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

    return res.status(201).json({ message: 'User created successfully', userId: user.id })
  } catch (error) {
    console.error('Registration error:', error)
    const message = error instanceof Error && 'code' in error && (error as any).code === 'P2002'
      ? 'Phone number or email already registered'
      : 'Failed to create user'
    return res.status(500).json({ error: message })
  }
}
