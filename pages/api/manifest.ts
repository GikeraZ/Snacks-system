import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const setting = await prisma.receiptSetting.findFirst()
    const name = setting?.businessName || 'Hot Take'

    const icon192 = setting?.logoUrl ? '/api/logo/logo' : '/icons/icon-192.png'
    const icon512 = setting?.logoUrl ? '/api/logo/logo' : '/icons/icon-512.png'

    const manifest = {
      name,
      short_name: name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) || 'HotTake',
      description: `${name} - Order food, delivered fast!`,
      start_url: '/',
      scope: '/',
      display: 'standalone' as const,
      display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
      orientation: 'portrait-primary' as const,
      background_color: '#fef9ef',
      theme_color: '#F97316',
      categories: ['food', 'business', 'lifestyle'],
      lang: 'en-KE',
      dir: 'ltr' as const,
      iarc_rating_id: '',
      prefer_related_applications: false,
      shortcuts: [
        {
          name: 'Browse Menu',
          short_name: 'Menu',
          description: 'Browse our full menu and order',
          url: '/customer',
          icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
        },
        {
          name: 'My Orders',
          short_name: 'Orders',
          description: 'View your order history',
          url: '/customer/orders',
          icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
        },
      ],
      screenshots: [
        {
          src: '/icons/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Hot Take Menu',
        },
      ],
      icons: [
        { src: icon192, sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: icon192, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
        { src: icon512, sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: icon512, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      ],
    }

    res.setHeader('Content-Type', 'application/manifest+json')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.setHeader('Access-Control-Allow-Origin', '*')
    return res.status(200).json(manifest)
  } catch {
    const fallback = {
      name: 'Hot Take',
      short_name: 'HotTake',
      description: 'Hot Take - Order food, delivered fast!',
      start_url: '/',
      scope: '/',
      display: 'standalone' as const,
      display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
      orientation: 'portrait-primary' as const,
      background_color: '#fef9ef',
      theme_color: '#F97316',
      categories: ['food', 'business'],
      lang: 'en-KE',
      shortcuts: [
        { name: 'Browse Menu', short_name: 'Menu', url: '/customer', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
        { name: 'My Orders', short_name: 'Orders', url: '/customer/orders', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      ],
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      ],
    }
    res.setHeader('Content-Type', 'application/manifest+json')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    return res.status(200).json(fallback)
  }
}
