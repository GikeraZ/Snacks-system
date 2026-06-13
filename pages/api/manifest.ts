import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const setting = await prisma.receiptSetting.findFirst()
    const name = setting?.businessName || 'Danoscar Bite'

    const icon192 = setting?.logoUrl ? '/api/logo/logo' : '/icons/icon-192.png'
    const icon512 = setting?.logoUrl ? '/api/logo/logo' : '/icons/icon-512.png'

    const manifest = {
      name,
      short_name: name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) || 'Snacks',
      description: `${name} - Order online, get free delivery!`,
      start_url: '/',
      display: 'standalone' as const,
      display_override: ['window-controls-overlay', 'standalone'],
      orientation: 'portrait-primary' as const,
      background_color: '#ffffff',
      theme_color: '#F97316',
      icons: [
        { src: icon192, sizes: '192x192', type: 'image/png' },
        { src: icon512, sizes: '512x512', type: 'image/png' },
      ],
    }

    res.setHeader('Content-Type', 'application/manifest+json')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    return res.status(200).json(manifest)
  } catch {
    const fallback = {
      name: 'Danoscar Bite',
      short_name: 'DanoscarBite',
      description: 'Danoscar Bite - Order online, get free delivery!',
      start_url: '/',
      display: 'standalone' as const,
      display_override: ['window-controls-overlay', 'standalone'],
      orientation: 'portrait-primary' as const,
      background_color: '#ffffff',
      theme_color: '#F97316',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    }
    res.setHeader('Content-Type', 'application/manifest+json')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    return res.status(200).json(fallback)
  }
}
