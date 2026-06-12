import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag, Clock, ChevronLeft, Package, CheckCircle,
  XCircle, Truck, ChefHat, Loader2, RefreshCw, ArrowRight
} from 'lucide-react'
import BottomNav from '../../components/layout/BottomNav'
import NotificationBell from '../../components/ui/NotificationBell'

interface OrderItem {
  id: string
  productId: string
  product: { id: string; name: string; sellingPrice: number }
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface DeliveryInfo {
  id: string
  status: string
  locationType: string
  locationDetails: string
}

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentMethod: string
  paymentStatus: string
  totalAmount: number
  deliveryFee: number
  createdAt: string
  orderItems: OrderItem[]
  delivery: DeliveryInfo | null
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-500', icon: Clock },
  CONFIRMED: { label: 'Accepted', color: 'bg-blue-500', icon: Package },
  PREPARING: { label: 'Preparing', color: 'bg-primary-500', icon: ChefHat },
  READY: { label: 'Ready', color: 'bg-purple-500', icon: Package },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'bg-indigo-500', icon: Truck },
  DELIVERED: { label: 'Delivered', color: 'bg-success-500', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-500', icon: XCircle },
  REFUNDED: { label: 'Refunded', color: 'bg-gray-500', icon: XCircle },
}

function getStatusBadge(status: string) {
  const config = statusConfig[status] || { label: status, color: 'bg-gray-400', icon: Clock }
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white ${config.color} shadow-sm`}>
      <Icon size={12} />
      {config.label}
    </span>
  )
}

function getPaymentStatusBadge(status: string) {
  const styles: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    COMPLETED: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
    FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    REFUNDED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  }
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${styles[status] || styles.PENDING}`}>
      {status}
    </span>
  )
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
}

export default function CustomerOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [role, setRole] = useState('CUSTOMER')
  const [justAccepted, setJustAccepted] = useState<string | null>(null)
  const prevStatusRef = useRef<Record<string, string>>({})
  const router = useRouter()

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/customers/orders')
      if (!res.ok) throw new Error('Failed to fetch orders')
      const data = await res.json()
      const orderList = Array.isArray(data) ? data : data.orders || []
      const prevStatuses = prevStatusRef.current

      for (const order of orderList) {
        const prev = prevStatuses[order.id]
        if (prev && prev === 'PENDING' && order.status === 'CONFIRMED') {
          setJustAccepted(order.id)
          setTimeout(() => setJustAccepted(null), 5000)
        }
        prevStatusRef.current[order.id] = order.status
      }

      setOrders(orderList)
    } catch {
      if (!silent) setError('Could not load orders. Please try again.')
    }
    if (!silent) setLoading(false)
  }

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(() => fetchOrders(true), 15000)
    return () => clearInterval(interval)
  }, [])

  const handleReorder = (items: OrderItem[]) => {
    const cart: Record<string, number> = {}
    items.forEach(item => { cart[item.productId] = item.quantity })
    sessionStorage.setItem('cart', JSON.stringify(cart))
    router.push('/customer/checkout')
  }

  return (
    <>
      <Head><title>My Orders - Danoscar Bite</title></Head>

      <div className="page-container min-h-screen">
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50">
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white font-heading ml-2">My Orders</h1>
            </div>
            <div className="flex items-center gap-1">
              <NotificationBell compact />
              <button
                onClick={() => fetchOrders()}
                disabled={loading}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400 disabled:opacity-50"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 max-w-2xl mx-auto pb-24">
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-card !p-5 animate-pulse">
                  <div className="flex justify-between mb-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-3" />
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card !p-5 text-center"
            >
              <p className="text-red-500 dark:text-red-400 text-sm mb-3">{error}</p>
              <button onClick={() => fetchOrders()} className="btn-primary !py-2 !px-4 !text-sm !rounded-xl">
                Try Again
              </button>
            </motion.div>
          )}

          {!loading && !error && orders.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card !p-10 text-center"
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-10 w-10 text-gray-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white font-heading mb-2">No orders yet</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Your order history will appear here once you place your first order.</p>
              <Link href="/customer" className="btn-primary inline-flex items-center gap-2 !rounded-2xl">
                Browse Menu
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          )}

          {!loading && !error && orders.length > 0 && (
            <div className="space-y-3">
              {orders.map((order, idx) => {
                const isNewlyAccepted = justAccepted === order.id
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className={`glass-card !p-5 space-y-3 hover:shadow-card-hover transition-shadow relative ${isNewlyAccepted ? 'ring-2 ring-success-500 ring-offset-2 dark:ring-offset-gray-900' : ''}`}
                  >
                    {isNewlyAccepted && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -top-3 left-1/2 -translate-x-1/2 bg-success-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg flex items-center gap-1.5"
                      >
                        <CheckCircle size={12} />
                        Order Accepted!
                      </motion.div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">Order</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white font-mono tracking-wide">{order.orderNumber}</p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                      <Clock size={12} />
                      <span>{formatDate(order.createdAt)}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                      <span>{order.paymentMethod}</span>
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </div>

                    {order.status === 'CONFIRMED' && (
                      <div className="bg-success-50 dark:bg-success-900/10 border border-success-200 dark:border-success-800/30 rounded-2xl p-3 flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-success-100 dark:bg-success-900/20 text-success-600 dark:text-success-400">
                          <CheckCircle size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-success-700 dark:text-success-300">Order Accepted</p>
                          <p className="text-xs text-success-600 dark:text-success-400">Your order has been accepted and is being prepared.</p>
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-50 dark:bg-gray-800/30 rounded-2xl p-3 space-y-1.5">
                      {order.orderItems?.slice(0, 3).map(item => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            <span className="text-gray-400 dark:text-gray-500 mr-1">x{item.quantity}</span>
                            {item.product?.name || 'Unknown Item'}
                          </span>
                          <span className="text-gray-900 dark:text-white font-medium">KES {item.totalPrice.toFixed(2)}</span>
                        </div>
                      ))}
                      {order.orderItems?.length > 3 && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 text-center pt-1">
                          +{order.orderItems.length - 3} more items
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        {order.delivery && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            📍 {order.delivery.locationDetails}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 dark:text-gray-500">Total</p>
                        <p className="text-lg font-bold text-primary-500">KES {order.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleReorder(order.orderItems)}
                      className="w-full py-3 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/10 text-primary-600 dark:text-primary-400 font-bold text-sm rounded-2xl border border-primary-200 dark:border-primary-800/30 hover:from-primary-100 hover:to-primary-200 dark:hover:from-primary-900/30 dark:hover:to-primary-800/20 transition-all active:scale-[0.98]"
                    >
                      Re-order All
                    </button>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <BottomNav role={role} />
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)
  if (!session || session.user.role !== 'CUSTOMER') {
    return { redirect: { destination: '/auth/login', permanent: false } }
  }
  return { props: {} }
}
