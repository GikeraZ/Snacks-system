import { useState, useRef, useEffect } from 'react'
import { Bell, X, ShoppingBag, CheckCircle, AlertTriangle, Info } from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  type: 'order' | 'success' | 'warning' | 'info'
  time: string
  read: boolean
}

const defaultNotifications: Notification[] = [
  { id: '1', title: 'New Order #1245', message: 'Beef Burger x2, Chips x1', type: 'order', time: '2 min ago', read: false },
  { id: '2', title: 'Order Ready', message: 'Order #1240 is ready for pickup', type: 'success', time: '5 min ago', read: false },
  { id: '3', title: 'Low Stock Alert', message: 'Cooking oil running low (2 units left)', type: 'warning', time: '15 min ago', read: false },
  { id: '4', title: 'Payment Received', message: 'KES 450 via M-Pesa', type: 'info', time: '1 hour ago', read: true },
]

const iconMap = {
  order: ShoppingBag,
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
}

const colorMap = {
  order: 'text-primary-500 bg-primary-50 dark:bg-primary-900/20',
  success: 'text-success-500 bg-success-50 dark:bg-success-900/20',
  warning: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
  info: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState(defaultNotifications)
  const ref = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 glass rounded-2xl shadow-elevated border border-gray-100 dark:border-gray-700/50 overflow-hidden z-50 animate-scale-in origin-top-right">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700/50">
            <h3 className="font-heading font-semibold text-gray-900 dark:text-white text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs font-medium text-primary-500 hover:text-primary-600 transition-colors">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto scrollbar-hide">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 dark:text-gray-500">
                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const Icon = iconMap[notif.type]
                return (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 p-4 border-b border-gray-50 dark:border-gray-700/30 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/20 ${!notif.read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
                  >
                    <div className={`p-2 rounded-xl ${colorMap[notif.type]}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{notif.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{notif.time}</p>
                    </div>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
