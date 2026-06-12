import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth/[...nextauth]'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'BUSINESS_PARTNER')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST'])
      return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    const { image, fileName, productId } = req.body
    if (!image) return res.status(400).json({ error: 'No image data' })

    if (productId) {
      await prisma.product.update({
        where: { id: productId },
        data: { imageData: image, imageUrl: '' },
      })
      return res.status(200).json({ url: `/api/images/${productId}` })
    }

    const url = image.startsWith('data:') ? '' : image
    return res.status(200).json({ url })
  } catch (error) {
    console.error('Upload error:', error)
    return res.status(500).json({ error: 'Upload failed' })
  }
}
