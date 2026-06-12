import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { type } = req.query
    const setting = await prisma.receiptSetting.findFirst()
    if (!setting) return res.status(404).json({ error: 'No settings found' })

    const fieldMap: Record<string, string | null> = {
      logo: setting.logoUrl,
      favicon: setting.faviconUrl,
      receiptLogo: setting.receiptLogoUrl,
    }

    const data = fieldMap[type as string]
    if (!data) return res.status(404).json({ error: 'No logo found' })

    if (data.startsWith('data:')) {
      const matches = data.match(/^data:(image\/\w+);base64,(.+)$/)
      if (matches) {
        res.setHeader('Content-Type', matches[1])
        res.setHeader('Cache-Control', 'public, max-age=86400')
        return res.send(Buffer.from(matches[2], 'base64'))
      }
    }

    return res.redirect(data)
  } catch {
    return res.status(500).json({ error: 'Failed to serve logo' })
  }
}
