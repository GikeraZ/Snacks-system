import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const setting = await prisma.receiptSetting.findFirst()
  const name = setting?.businessName || 'Danoscar Bite'

  const icon192 = setting?.logoUrl ? '/api/logo/logo' : '/icons/icon-192.png'
  const icon512 = setting?.logoUrl ? '/api/logo/logo' : '/icons/icon-512.png'

  const manifest = {
    name,
    short_name: name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) || 'Snacks',
    description: `${name} - Order online, get free delivery!`,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#F97316',
    icons: [
      { src: icon192, sizes: '192x192', type: 'image/png' },
      { src: icon512, sizes: '512x512', type: 'image/png' },
    ],
  }

  res.setHeader('Content-Type', 'application/manifest+json')
  res.setHeader('Cache-Control', 'public, max-age=3600')
  res.status(200).json(manifest)
}
