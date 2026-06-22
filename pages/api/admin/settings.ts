import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { sanitize, sanitizeObject, auditLog } from '@/lib/security'

const ALLOWED_SETTING_KEYS = [
  'businessName', 'businessAddress', 'businessPhone', 'businessEmail',
  'deliveryFee', 'freeDeliveryThreshold', 'taxRate', 'currency',
  'openingTime', 'closingTime', 'maxOrderItems',
]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (req.method === 'GET') {
      const [receipt, settings] = await Promise.all([
        prisma.receiptSetting.findFirst(),
        prisma.setting.findMany(),
      ])
      return res.status(200).json({ receipt, settings })
    }

    if (req.method === 'PUT') {
      const { receipt, settings } = req.body

      if (receipt) {
        const sanitizedReceipt = sanitizeObject(receipt as Record<string, unknown>)
        const allowedReceiptFields = [
          'businessName', 'logoUrl', 'faviconUrl', 'receiptLogoUrl',
          'address', 'phone', 'email', 'website', 'footerText',
        ]
        const filteredReceipt: Record<string, unknown> = {}
        for (const key of allowedReceiptFields) {
          if (sanitizedReceipt[key] !== undefined) filteredReceipt[key] = sanitizedReceipt[key]
        }

        if (filteredReceipt.businessName && (filteredReceipt.businessName as string).trim().length < 2) {
          return res.status(400).json({ error: 'Business name must be at least 2 characters' })
        }

        const existing = await prisma.receiptSetting.findFirst()
        if (existing) {
          await prisma.receiptSetting.update({ where: { id: existing.id }, data: filteredReceipt })
        } else {
          await prisma.receiptSetting.create({
            data: { businessName: 'Danoscar Bite', ...filteredReceipt } as any,
          })
        }
      }

      if (settings && Array.isArray(settings)) {
        for (const s of settings) {
          if (!s.key || !ALLOWED_SETTING_KEYS.includes(s.key)) continue
          const sanitizedValue = typeof s.value === 'string' ? sanitize(s.value) : String(s.value)
          await prisma.setting.upsert({
            where: { key: s.key },
            update: { value: sanitizedValue },
            create: { key: s.key, value: sanitizedValue },
          })
        }
      }

      await auditLog({
        userId: session.user.id,
        action: 'SETTINGS_UPDATED',
        description: 'System settings updated',
        req,
      })

      return res.status(200).json({ message: 'Settings updated' })
    }

    res.setHeader('Allow', ['GET', 'PUT'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error) {
    console.error('Settings API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
