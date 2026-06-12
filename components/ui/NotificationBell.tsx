import { useState, useRef, useEffect, useCallback } from 'react'
import { Bell, X, ShoppingBag, CheckCircle, AlertTriangle, Info, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: string
  link?: string
  read: boolean
  createdAt: string
}

const iconMap: Record<string, typeof ShoppingBag> = {
  order: ShoppingBag,
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
}

const colorMap: Record<string, string> = {
  order: 'text-primary-500 bg-primary-50 dark:bg-primary-900/20',
  success: 'text-success-500 bg-success-50 dark:bg-success-900/20',
  warning: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
  info: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
}

function timeAgo(dateStr: string) {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface NotificationBellProps {
  compact?: boolean
}

export default function NotificationBell({ compact }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(Array.isArray(data) ? data : [])
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readAll: true }),
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch {}
  }

  const markOneRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch {}
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchNotifications() }}
        className="relative p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
      >
        <Bell size={compact ? 18 : 20} />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-80 sm:w-96 glass rounded-2xl shadow-elevated border border-gray-100 dark:border-gray-700/50 overflow-hidden z-50 animate-scale-in origin-top-right ${compact ? 'origin-top-right' : ''}`}>
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700/50">
            <h3 className="font-heading font-semibold text-gray-900 dark:text-white text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs font-medium text-primary-500 hover:text-primary-600 transition-colors">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto scrollbar-hide">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 dark:text-gray-500">
                <Bell size={32} className="mx-auto mb-2 opacity-50 animate-pulse" />
                <p className="text-sm">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 dark:text-gray-500">
                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const Icon = iconMap[notif.type] || Info
                const content = (
                  <div
                    onClick={() => { if (!notif.read) markOneRead(notif.id) }}
                    className={`flex items-start gap-3 p-4 border-b border-gray-50 dark:border-gray-700/30 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/20 cursor-pointer ${!notif.read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
                  >
                    <div className={`p-2 rounded-xl ${colorMap[notif.type] || colorMap.info}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{notif.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{timeAgo(notif.createdAt)}</p>
                    </div>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                    )}
                  </div>
                )
                return notif.link ? (
                  <Link key={notif.id} href={notif.link} onClick={() => { if (!notif.read) markOneRead(notif.id) }}>
                    {content}
                  </Link>
                ) : (
                  <div key={notif.id}>{content}</div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
