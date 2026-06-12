import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid id' })
    }

    const product = await prisma.product.findUnique({
      where: { id },
      select: { imageData: true, imageUrl: true },
    })

    if (product?.imageData) {
      const matches = product.imageData.match(/^data:(image\/\w+);base64,(.+)$/)
      if (matches) {
        res.setHeader('Content-Type', matches[1])
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        return res.send(Buffer.from(matches[2], 'base64'))
      }
    }

    if (product?.imageUrl && !product.imageUrl.startsWith('data:')) {
      return res.redirect(product.imageUrl)
    }

    return res.status(404).json({ error: 'Image not found' })
  } catch {
    return res.status(500).json({ error: 'Failed to serve image' })
  }
}
