import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'
import fs from 'fs'
import path from 'path'

export const config = {
  api: {
    bodyParser: { sizeLimit: '5mb' },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST'])
      return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    const { image, type } = req.body
    if (!image) return res.status(400).json({ error: 'No image data' })
    if (!['logo', 'favicon', 'receiptLogo'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Use: logo, favicon, or receiptLogo' })
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const ext = 'png'
    const fileName = `${type}-${Date.now()}.${ext}`
    const filePath = path.join(uploadDir, fileName)

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'))

    const url = `/uploads/${fileName}`

    const existing = await prisma.receiptSetting.findFirst()
    const updateData: Record<string, string> = {}
    if (type === 'logo') updateData.logoUrl = url
    if (type === 'favicon') updateData.faviconUrl = url
    if (type === 'receiptLogo') updateData.receiptLogoUrl = url

    if (existing) {
      await prisma.receiptSetting.update({ where: { id: existing.id }, data: updateData })
    } else {
      await prisma.receiptSetting.create({
        data: { businessName: 'Danoscar Bite', ...updateData },
      })
    }

    return res.status(200).json({ url, message: `${type} updated successfully` })
  } catch (error) {
    console.error('Logo upload error:', error)
    return res.status(500).json({ error: 'Upload failed' })
  }
}
