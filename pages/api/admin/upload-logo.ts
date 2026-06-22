import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'
import { auditLog } from '@/lib/security'

export const config = {
  api: {
    bodyParser: { sizeLimit: '5mb' },
  },
}

const VALID_TYPES = ['logo', 'favicon', 'receiptLogo'] as const
const MAX_IMAGE_SIZE = 4 * 1024 * 1024
const VALID_MIME_PREFIXES = ['data:image/png', 'data:image/jpeg', 'data:image/gif', 'data:image/webp', 'data:image/svg+xml']

function validateImageData(image: string): boolean {
  if (!image.startsWith('data:')) return false
  const commaIndex = image.indexOf(',')
  if (commaIndex === -1) return false
  const header = image.substring(0, commaIndex)
  if (!VALID_MIME_PREFIXES.some(prefix => header.startsWith(prefix))) return false

  const base64Data = image.substring(commaIndex + 1)
  const sizeInBytes = Math.ceil((base64Data.length * 3) / 4)
  if (sizeInBytes > MAX_IMAGE_SIZE) return false

  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
  return base64Regex.test(base64Data)
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

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Use: logo, favicon, or receiptLogo' })
    }

    if (!validateImageData(image)) {
      return res.status(400).json({ error: 'Invalid image format or size exceeds 4MB. Allowed: PNG, JPEG, GIF, WebP, SVG' })
    }

    const existing = await prisma.receiptSetting.findFirst()
    const updateData: Record<string, string> = {}
    if (type === 'logo') updateData.logoUrl = image
    if (type === 'favicon') updateData.faviconUrl = image
    if (type === 'receiptLogo') updateData.receiptLogoUrl = image

    if (existing) {
      await prisma.receiptSetting.update({ where: { id: existing.id }, data: updateData })
    } else {
      await prisma.receiptSetting.create({
        data: { businessName: 'Hot Take', ...updateData } as any,
      })
    }

    await auditLog({
      userId: session.user.id,
      action: 'LOGO_UPLOADED',
      description: `${type} image uploaded`,
      req,
    })

    return res.status(200).json({ url: image, message: `${type} updated successfully` })
  } catch (error) {
    console.error('Logo upload error:', error)
    return res.status(500).json({ error: 'Upload failed' })
  }
}
