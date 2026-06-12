import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  Home, ShoppingBag, Package, BarChart3, User, Heart,
  ShoppingCart, Menu, X, LogOut, Settings
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: typeof Home
}

const navItems: Record<string, NavItem[]> = {
  SUPER_ADMIN: [
    { label: 'Home', href: '/admin/dashboard', icon: Home },
    { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { label: 'Products', href: '/admin/products', icon: Package },
    { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { label: 'Profile', href: '/admin/settings', icon: User },
  ],
  BUSINESS_PARTNER: [
    { label: 'Home', href: '/partner/dashboard', icon: Home },
    { label: 'Sales', href: '/partner/sales', icon: BarChart3 },
    { label: 'Inventory', href: '/partner/inventory', icon: Package },
    { label: 'Reports', href: '/partner/reports', icon: BarChart3 },
    { label: 'Profile', href: '#', icon: User },
  ],
  CASHIER: [
    { label: 'Home', href: '/cashier/dashboard', icon: Home },
    { label: 'POS', href: '/cashier/pos', icon: ShoppingBag },
    { label: 'Orders', href: '/cashier/orders', icon: ShoppingBag },
    { label: 'Receipts', href: '/cashier/receipts', icon: BarChart3 },
    { label: 'Profile', href: '#', icon: User },
  ],
  KITCHEN_STAFF: [
    { label: 'Orders', href: '/kitchen/orders', icon: ShoppingBag },
    { label: 'Ready', href: '/kitchen/ready', icon: Package },
    { label: 'Home', href: '/kitchen/orders', icon: Home },
    { label: 'Stats', href: '#', icon: BarChart3 },
    { label: 'Profile', href: '#', icon: User },
  ],
  DELIVERY: [
    { label: 'Home', href: '/delivery/orders', icon: Home },
    { label: 'Deliveries', href: '/delivery/orders', icon: ShoppingBag },
    { label: 'Map', href: '#', icon: Package },
    { label: 'Earnings', href: '#', icon: BarChart3 },
    { label: 'Profile', href: '#', icon: User },
  ],
  CUSTOMER: [
    { label: 'Menu', href: '/customer', icon: Home },
    { label: 'Orders', href: '/customer/orders', icon: ShoppingBag },
    { label: 'Cart', href: '/customer/checkout', icon: ShoppingCart },
    { label: 'Favorites', href: '/customer/favorites', icon: Heart },
    { label: 'Profile', href: '/customer/profile', icon: User },
  ],
}

interface BottomNavProps {
  role: string
}

export default function BottomNav({ role }: BottomNavProps) {
  const router = useRouter()
  const [showDrawer, setShowDrawer] = useState(false)
  const items = navItems[role] || navItems.SUPER_ADMIN

  const moreOptions: { label: string; href?: string; icon: any; onClick?: () => void; danger?: boolean }[] = [
    ...(role === 'CUSTOMER'
      ? [
          { label: 'Profile', href: '/customer/profile', icon: User },
          { label: 'Settings', href: '#', icon: Settings },
        ]
      : []),
    {
      label: 'Sign Out',
      icon: LogOut,
      danger: true,
      onClick: () => {
        sessionStorage.clear()
        router.push('/auth/logout')
      },
    },
  ]

  return (
    <>
      <nav className="lg:hidden fixed top-0 left-0 right-0 z-50 safe-area-top">
        <div className="relative">
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800" />
          <div className="relative flex items-center justify-around h-16 px-2">
            {items.slice(0, 4).map((item) => {
              const isActive = router.pathname === item.href || router.pathname.startsWith(item.href.replace(/\/[^/]+$/, ''))
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex flex-col items-center justify-center min-w-[56px] py-1 relative ${
                    isActive ? 'text-primary-500' : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {isActive && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full shadow-sm shadow-primary-500/30" />
                  )}
                  <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 scale-110'
                      : ''
                  }`}>
                    <Icon size={20} />
                  </div>
                  <span className={`text-[10px] font-semibold mt-0.5 tracking-wide transition-colors ${
                    isActive ? 'text-primary-500' : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
            <button
              onClick={() => setShowDrawer(true)}
              className={`flex flex-col items-center justify-center min-w-[56px] py-1 relative ${
                showDrawer ? 'text-primary-500' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                showDrawer
                  ? 'bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 scale-110'
                  : ''
              }`}>
                <Menu size={20} />
              </div>
              <span className="text-[10px] font-semibold mt-0.5 tracking-wide">More</span>
            </button>
          </div>
        </div>
      </nav>

      {showDrawer && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDrawer(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white font-heading">More</h2>
              <button
                onClick={() => setShowDrawer(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <div className="p-3 space-y-1 max-h-[60vh] overflow-y-auto">
              {moreOptions.map((option) => {
                const Icon = option.icon
                if (option.href) {
                  return (
                    <Link
                      key={option.label}
                      href={option.href}
                      onClick={() => setShowDrawer(false)}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all active:scale-[0.98]"
                    >
                      <div className="p-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500">
                        <Icon size={18} />
                      </div>
                      {option.label}
                    </Link>
                  )
                }
                return (
                  <button
                    key={option.label}
                    onClick={() => {
                      setShowDrawer(false)
                      option.onClick?.()
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all active:scale-[0.98] ${
                      option.danger
                        ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <div className={`p-1.5 rounded-xl ${
                      option.danger
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-500'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                    }`}>
                      <Icon size={18} />
                    </div>
                    {option.label}
                  </button>
                )
              })}
            </div>
            <div className="h-4 safe-area-bottom" />
          </div>
        </div>
      )}
    </>
  )
}
