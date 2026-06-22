import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../pages/api/auth/[...nextauth]'
import { prisma } from './prisma'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'BUSINESS_PARTNER', 'CASHIER', 'KITCHEN_STAFF', 'DELIVERY', 'CUSTOMER'] as const
export type Role = typeof ALLOWED_ROLES[number]

export function sanitize(str: string | undefined | null): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') result[key] = sanitize(value)
    else if (Array.isArray(value)) result[key] = value.map(v => typeof v === 'string' ? sanitize(v) : v)
    else result[key] = value
  }
  return result as T
}

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '')
  return cleaned.length >= 10 && /^\d+$/.test(cleaned)
}

export function validateAmount(amount: unknown): amount is number {
  return typeof amount === 'number' && amount > 0 && Number.isFinite(amount)
}

export function validateDateString(date: string): boolean {
  const d = new Date(date)
  return d instanceof Date && !isNaN(d.getTime())
}

export function isAllowedRole(role: string): role is Role {
  return ALLOWED_ROLES.includes(role as Role)
}

export function generateSecureToken(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length]
  }
  return result
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = generateSecureToken(4).toUpperCase()
  return `ORD-${timestamp}-${random}`
}

const RATE_LIMIT_WINDOW = 60 * 1000
const RATE_LIMIT_MAX = 20
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(key: string, maxRequests = RATE_LIMIT_MAX, windowMs = RATE_LIMIT_WINDOW): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= maxRequests) return false
  entry.count++
  return true
}

export function getRateLimitKey(req: NextApiRequest): string {
  const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown'
  return `${ip}:${req.url}`
}

export async function requireAuth(req: NextApiRequest, res: NextApiResponse, allowedRoles?: Role[]) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || !session.user.id) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }
  if (allowedRoles && !allowedRoles.includes(session.user.role as Role)) {
    res.status(403).json({ error: 'Forbidden: insufficient permissions' })
    return null
  }
  return session
}

export async function auditLog(params: {
  userId?: string
  action: string
  description: string
  req?: NextApiRequest
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        description: params.description,
        ipAddress: params.req
          ? (params.req.headers['x-forwarded-for'] as string || params.req.socket.remoteAddress || 'unknown')
          : null,
        userAgent: params.req
          ? (params.req.headers['user-agent'] as string || null)
          : null,
      },
    })
  } catch {
    // Silently fail - audit logging should never break the app
  }
}

export function withErrorHandler(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res)
    } catch (error) {
      console.error('API error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}
