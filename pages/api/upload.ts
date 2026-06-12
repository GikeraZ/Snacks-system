import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth/[...nextauth]'
import fs from 'fs'
import path from 'path'

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

    const { image, fileName } = req.body
    if (!image) return res.status(400).json({ error: 'No image data' })

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const ext = fileName?.split('.').pop() || 'png'
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const filePath = path.join(uploadDir, name)

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'))

    const url = `/uploads/products/${name}`
    return res.status(200).json({ url })
  } catch (error) {
    console.error('Upload error:', error)
    return res.status(500).json({ error: 'Upload failed' })
  }
}
