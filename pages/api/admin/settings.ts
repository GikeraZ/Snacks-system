import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'

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
        const existing = await prisma.receiptSetting.findFirst()
        if (existing) {
          await prisma.receiptSetting.update({ where: { id: existing.id }, data: receipt })
        } else {
          await prisma.receiptSetting.create({ data: receipt })
        }
      }

      if (settings && Array.isArray(settings)) {
        for (const s of settings) {
          await prisma.setting.upsert({
            where: { key: s.key },
            update: { value: s.value },
            create: { key: s.key, value: s.value },
          })
        }
      }

      return res.status(200).json({ message: 'Settings updated' })
    }

    res.setHeader('Allow', ['GET', 'PUT'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (error) {
    console.error('Settings API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
