import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { isConfigured } from '@/lib/mpesa'
import { auditLog } from '@/lib/security'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return res.status(401).json({ error: 'Unauthorized - SUPER_ADMIN only' })
  }

  await auditLog({
    userId: session.user.id,
    action: 'MPESA_TEST',
    description: 'M-Pesa test endpoint accessed',
    req,
  })

  const results: Record<string, unknown> = {}

  const config: Record<string, unknown> = {
    hasConsumerKey: !!process.env.MPESA_CONSUMER_KEY,
    hasConsumerSecret: !!process.env.MPESA_CONSUMER_SECRET,
    hasPasskey: !!process.env.MPESA_PASSKEY,
    hasShortcode: !!process.env.MPESA_SHORTCODE,
    hasCallbackUrl: !!process.env.MPESA_CALLBACK_URL,
    shortcode: (process.env.MPESA_SHORTCODE || '').slice(0, 6),
    isConfigured: isConfigured(),
    passkeyLength: (process.env.MPESA_PASSKEY || '').length,
  }
  results.config = config
  results.status = isConfigured() ? 'CONFIGURED' : 'NOT_CONFIGURED'

  return res.status(200).json(results)
}
