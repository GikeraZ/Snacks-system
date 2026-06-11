import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  Menu, X, Home, ShoppingBag, Package, Users, BarChart3,
  Settings, LogOut, Coffee, ChevronLeft, ChefHat, Truck, Store, Gift
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import ThemeToggle from '@/components/ui/ThemeToggle'
import NotificationBell from '@/components/ui/NotificationBell'

interface SidebarProps {
  role: string
}

const navigation: Record<string, { name: string; href: string; icon: any }[]> = {
  SUPER_ADMIN: [
    { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Products', href: '/admin/products', icon: Coffee },
    { name: 'Inventory', href: '/admin/inventory', icon: Package },
    { name: 'Expenses', href: '/admin/expenses', icon: BarChart3 },
    { name: 'Employees', href: '/admin/employees', icon: Users },
    { name: 'Partners', href: '/admin/partners', icon: Store },
    { name: 'Customers', href: '/admin/customers', icon: Users },
    { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ],
  BUSINESS_PARTNER: [
    { name: 'Dashboard', href: '/partner/dashboard', icon: Home },
    { name: 'Sales', href: '/partner/sales', icon: BarChart3 },
    { name: 'Inventory', href: '/partner/inventory', icon: Package },
    { name: 'Reports', href: '/partner/reports', icon: BarChart3 },
  ],
  CASHIER: [
    { name: 'Dashboard', href: '/cashier/dashboard', icon: Home },
    { name: 'Process Sale', href: '/cashier/pos', icon: ShoppingBag },
    { name: 'Orders', href: '/cashier/orders', icon: ShoppingBag },
    { name: 'Receipts', href: '/cashier/receipts', icon: Coffee },
    { name: 'Summary', href: '/cashier/summary', icon: BarChart3 },
  ],
  KITCHEN_STAFF: [
    { name: 'Orders', href: '/kitchen/orders', icon: ShoppingBag },
    { name: 'Ready Orders', href: '/kitchen/ready', icon: ChefHat },
  ],
  DELIVERY: [
    { name: 'Deliveries', href: '/delivery/orders', icon: Truck },
  ],
}

const roleBadge: Record<string, { label: string; color: string }> = {
  SUPER_ADMIN: { label: 'Admin', color: 'bg-gradient-to-r from-[#F97316] to-[#EA580C]' },
  BUSINESS_PARTNER: { label: 'Partner', color: 'bg-gradient-to-r from-[#6366F1] to-[#818CF8]' },
  CASHIER: { label: 'Cashier', color: 'bg-gradient-to-r from-[#10B981] to-[#34D399]' },
  KITCHEN_STAFF: { label: 'Kitchen', color: 'bg-gradient-to-r from-[#F97316] to-[#FB923C]' },
  DELIVERY: { label: 'Delivery', color: 'bg-gradient-to-r from-[#3B82F6] to-[#60A5FA]' },
}

export default function Sidebar({ role }: SidebarProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const items = navigation[role] || []
  const badge = roleBadge[role] || { label: role, color: 'bg-gray-500' }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl glass shadow-lg"
      >
        {isOpen ? <X size={20} className="text-gray-700 dark:text-gray-200" /> : <Menu size={20} className="text-gray-700 dark:text-gray-200" />}
      </button>

      <aside className={`
        fixed inset-y-0 left-0 z-40 flex flex-col glass-nav
        transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${collapsed ? 'w-20' : 'w-64'}
        lg:translate-x-0
      `}>
        <div className={`flex items-center h-16 px-4 border-b border-white/5 ${collapsed ? 'justify-center' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/20">
              <Coffee size={18} className="text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-white font-heading truncate">Prince Snack</h1>
                <p className="text-[10px] text-gray-400 font-medium tracking-wide">Management System</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide py-4">
          {items.map((item) => {
            const isActive = router.pathname === item.href || router.pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`glass-nav-item flex items-center gap-3 ${
                  collapsed ? 'justify-center' : ''
                } ${isActive ? 'active' : ''}`}
              >
                <div className={`p-1.5 rounded-lg flex-shrink-0 nav-icon transition-colors ${
                  isActive ? 'text-primary-400' : 'text-gray-500'
                }`}>
                  <Icon size={collapsed ? 22 : 20} />
                </div>
                {!collapsed && (
                  <span className={`text-sm font-medium nav-label transition-colors ${
                    isActive ? 'text-white' : 'text-gray-400'
                  }`}>
                    {item.name}
                  </span>
                )}
                {!collapsed && isActive && (
                  <span className="ml-auto w-1.5 h-6 rounded-full bg-gradient-to-b from-primary-400 to-primary-600 shadow-sm shadow-primary-500/30" />
                )}
              </Link>
            )
          })}
        </div>

        <div className={`border-t border-white/5 p-4 ${collapsed ? 'flex flex-col items-center gap-3' : ''}`}>
          {!collapsed && (
            <div className="flex items-center gap-3 px-2 mb-3">
              <div className={`px-2.5 py-1 rounded-full ${badge.color} text-[10px] font-semibold text-white shadow-sm`}>
                {badge.label}
              </div>
              <NotificationBell />
              <ThemeToggle />
            </div>
          )}
          {collapsed && (
            <div className="flex flex-col items-center gap-3 mb-3">
              <NotificationBell />
              <ThemeToggle />
            </div>
          )}
          <button
            onClick={() => signOut()}
            className={`flex items-center gap-3 text-gray-400 hover:text-white transition-colors group ${
              collapsed ? 'justify-center w-full p-2 rounded-xl hover:bg-white/5' : 'px-2 py-2 rounded-xl hover:bg-white/5 w-full'
            }`}
          >
            <LogOut size={18} className="group-hover:scale-110 transition-transform" />
            {!collapsed && <span className="text-sm">Sign Out</span>}
          </button>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#1e293b] border border-white/10 items-center justify-center text-gray-400 hover:text-white transition-colors hover:scale-110"
        >
          <ChevronLeft size={14} className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>
    </>
  )
}
