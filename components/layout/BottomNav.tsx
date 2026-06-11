import Link from 'next/link'
import { useRouter } from 'next/router'
import { Home, ShoppingBag, Package, BarChart3, User, Heart, ShoppingCart } from 'lucide-react'

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
  const items = navItems[role] || navItems.SUPER_ADMIN

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="relative">
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800" />
        <div className="relative flex items-center justify-around h-16 px-2">
          {items.map((item) => {
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
                  <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full shadow-sm shadow-primary-500/30" />
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
        </div>
      </div>
    </nav>
  )
}
