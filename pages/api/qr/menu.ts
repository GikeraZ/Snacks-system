import type { NextApiRequest, NextApiResponse } from 'next'
import QRCode from 'qrcode'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Generate QR code for menu URL
      const menuUrl = `${process.env.NEXT_PUBLIC_APP_URL}/customer`
      const qrCodeDataUrl = await QRCode.toDataURL(menuUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })

      return res.status(200).json({ qrCode: qrCodeDataUrl, url: menuUrl })
    } catch (error) {
      return res.status(500).json({ error: 'Failed to generate QR code' })
    }
  }

  res.setHeader('Allow', ['GET'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}

