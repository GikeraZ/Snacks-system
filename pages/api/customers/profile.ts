import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import bcrypt from 'bcryptjs'
import { sanitize, validatePhone, auditLog } from '@/lib/security'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session || !session.user.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (req.method === 'GET') {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          loyaltyPoints: true,
        },
      })
      const customer = await prisma.customer.findUnique({
        where: { userId: session.user.id },
        select: { address: true, studentId: true },
      })
      return res.status(200).json({ user, customer })
    }

    if (req.method === 'PUT') {
      const { name, email, phone, currentPassword, newPassword, address } = req.body

      if (name && (name.length < 2 || name.length > 100)) {
        return res.status(400).json({ error: 'Name must be between 2 and 100 characters' })
      }

      if (email) {
        const existing = await prisma.user.findFirst({
          where: { email, NOT: { id: session.user.id } },
        })
        if (existing) return res.status(409).json({ error: 'Email already in use' })
      }

      if (phone) {
        if (!validatePhone(phone)) {
          return res.status(400).json({ error: 'Invalid phone number' })
        }
        const existing = await prisma.user.findFirst({
          where: { phone, NOT: { id: session.user.id } },
        })
        if (existing) return res.status(409).json({ error: 'Phone number already in use' })
      }

      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Current password is required to set a new password' })
        }
        const user = await prisma.user.findUnique({ where: { id: session.user.id } })
        if (!user?.password) {
          return res.status(400).json({ error: 'No password set on this account' })
        }
        const valid = await bcrypt.compare(currentPassword, user.password)
        if (!valid) {
          return res.status(400).json({ error: 'Current password is incorrect' })
        }
        if (newPassword.length < 8) {
          return res.status(400).json({ error: 'New password must be at least 8 characters' })
        }
      }

      const updateData: Record<string, unknown> = {}
      if (name) updateData.name = sanitize(name)
      if (email) updateData.email = email
      if (phone) updateData.phone = phone
      if (newPassword) updateData.password = await bcrypt.hash(newPassword, 12)

      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: updateData,
        })
      }

      if (address !== undefined) {
        await prisma.customer.upsert({
          where: { userId: session.user.id },
          update: { address: sanitize(address) || '' },
          create: { userId: session.user.id, address: sanitize(address) || '' },
        })
      }

      await auditLog({
        userId: session.user.id,
        action: 'PROFILE_UPDATED',
        description: 'Customer profile updated',
        req,
      })

      return res.status(200).json({ message: 'Profile updated successfully' })
    }

    res.setHeader('Allow', ['GET', 'PUT'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error) {
    console.error('Customer profile API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
