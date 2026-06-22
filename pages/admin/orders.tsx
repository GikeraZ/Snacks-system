import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '../../lib/prisma'
import { useState } from 'react'
import Head from 'next/head'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag, Clock, MapPin, Phone, User, Package,
  X, CheckCircle, XCircle, ChevronDown, ChevronUp,
  CreditCard, FileText
} from 'lucide-react'

interface OrderItemData {
  id: string
  quantity: number
  unitPrice: number
  totalPrice: number
  product: { name: string }
}

interface DeliveryData {
  locationType: string
  locationDetails: string
  customerName: string
  customerPhone: string
  notes?: string
}

interface OrderData {
  id: string
  orderNumber: string
  status: string
  paymentMethod: string
  paymentStatus: string
  totalAmount: number
  deliveryFee: number
  notes?: string
  deliveryNotes?: string
  createdAt: string
  customer: { name?: string; phone?: string }
  customerId: string
  orderItems: OrderItemData[]
  delivery: DeliveryData | null
}

interface OrdersPageProps {
  orders: OrderData[]
  role: string
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-500', icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-500', icon: CheckCircle },
  PREPARING: { label: 'Preparing', color: 'bg-orange-500', icon: Package },
  READY: { label: 'Ready', color: 'bg-purple-500', icon: Package },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'bg-indigo-500', icon: Package },
  DELIVERED: { label: 'Delivered', color: 'bg-green-500', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-500', icon: XCircle },
  REFUNDED: { label: 'Refunded', color: 'bg-gray-500', icon: XCircle },
}

const locationLabels: Record<string, string> = {
  HOSTEL: 'Hostel',
  CLASSROOM: 'Classroom',
  LIBRARY: 'Library',
  OFFICE: 'Office',
  ROOM: 'Room',
  GATE: 'Main Gate',
}

export default function OrdersPage({ orders, role }: OrdersPageProps) {
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [orderList, setOrderList] = useState(orders)

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id)
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        setOrderList(prev => prev.map(o => o.id === id ? { ...o, status } : o))
        if (selectedOrder?.id === id) setSelectedOrder(prev => prev ? { ...prev, status } : null)
      }
    } catch {}
    setUpdating(null)
  }

  const formatDate = (d: string) => {
    const date = new Date(d)
    return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' · ' + date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  return (
    <>
      <Head><title>Orders - Hot Take</title></Head>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold dark:text-white font-heading">Orders</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            <span>{orderList.filter(o => o.status === 'PENDING').length} pending</span>
          </div>
        </div>

        <div className="space-y-3">
          {orderList.map((order) => {
            const cfg = statusConfig[order.status] || { label: order.status, color: 'bg-gray-400', icon: Clock }
            const Icon = cfg.icon
            const isPending = order.status === 'PENDING'

            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-card-hover transition-all cursor-pointer ${
                  isPending ? 'ring-2 ring-yellow-400/30 dark:ring-yellow-500/20' : ''
                }`}
                onClick={() => setSelectedOrder(order)}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-900 dark:text-white font-mono tracking-wide">
                          {order.orderNumber}
                        </span>
                        {isPending && (
                          <span className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 rounded-full animate-pulse">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {order.customer?.name || 'Customer'} · {order.customer?.phone || 'No phone'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white ${cfg.color} shadow-sm`}>
                        <Icon size={12} />
                        {cfg.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(order.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package size={12} />
                      {order.orderItems?.length || 0} items
                    </span>
                    <span className="flex items-center gap-1">
                      <CreditCard size={12} />
                      {order.paymentMethod.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-gray-700/50">
                    <div className="flex items-center gap-2">
                      <ChevronDown size={14} className="text-gray-300 dark:text-gray-600" />
                      <span className="text-xs text-gray-400 dark:text-gray-500">View Details</span>
                    </div>
                    <p className="text-lg font-bold text-primary-500">KES {order.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}

          {orderList.length === 0 && (
            <div className="text-center py-16">
              <ShoppingBag size={48} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No orders yet</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 lg:pt-24 overflow-y-auto"
            onClick={() => setSelectedOrder(null)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 dark:border-gray-700"
            >
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white font-heading">{selectedOrder.orderNumber}</h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X size={18} className="text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {selectedOrder.status === 'PENDING' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => updateStatus(selectedOrder.id, 'CONFIRMED')}
                      disabled={updating === selectedOrder.id}
                      className="flex-1 py-3 bg-gradient-to-br from-success-500 to-success-600 text-white font-bold rounded-2xl shadow-lg shadow-success-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {updating === selectedOrder.id ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <><CheckCircle size={16} /> Accept Order</>
                      )}
                    </button>
                    <button
                      onClick={() => updateStatus(selectedOrder.id, 'CANCELLED')}
                      disabled={updating === selectedOrder.id}
                      className="flex-1 py-3 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/10 text-red-600 dark:text-red-400 font-bold rounded-2xl border border-red-200 dark:border-red-800/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <XCircle size={16} /> Cancel Order
                    </button>
                  </div>
                )}

                {selectedOrder.status !== 'PENDING' && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                    <div className={`w-3 h-3 rounded-full ${statusConfig[selectedOrder.status]?.color || 'bg-gray-400'}`} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Order {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {selectedOrder.status === 'CANCELLED' ? 'This order has been cancelled.' : 'No action needed.'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="glass-card !p-4 space-y-3">
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <User size={14} className="text-primary-500" />
                      Customer
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User size={14} className="text-gray-400 shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{selectedOrder.customer?.name || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={14} className="text-gray-400 shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{selectedOrder.customer?.phone || '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card !p-4 space-y-3">
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <MapPin size={14} className="text-primary-500" />
                      Delivery
                    </h3>
                    {selectedOrder.delivery ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin size={14} className="text-gray-400 shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">
                            {locationLabels[selectedOrder.delivery.locationType] || selectedOrder.delivery.locationType}
                          </span>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <FileText size={14} className="text-gray-400 shrink-0 mt-0.5" />
                          <span className="text-gray-700 dark:text-gray-300">{selectedOrder.delivery.locationDetails}</span>
                        </div>
                        {selectedOrder.delivery.notes && (
                          <div className="flex items-start gap-2 text-sm">
                            <FileText size={14} className="text-gray-400 shrink-0 mt-0.5" />
                            <span className="text-gray-500 dark:text-gray-400 italic">"{selectedOrder.delivery.notes}"</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">No delivery details</p>
                    )}
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div className="glass-card !p-4">
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                      <FileText size={14} className="text-primary-500" />
                      Order Notes
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{selectedOrder.notes}</p>
                  </div>
                )}

                <div className="glass-card !p-4">
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ShoppingBag size={14} className="text-primary-500" />
                    Items ({selectedOrder.orderItems?.length || 0})
                  </h3>
                  <div className="space-y-2">
                    {selectedOrder.orderItems?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700/30 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-bold">
                            {item.quantity}
                          </span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{item.product.name}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">KES {item.totalPrice.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/30 space-y-1">
                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>Delivery Fee</span>
                      <span>{selectedOrder.deliveryFee > 0 ? `KES ${selectedOrder.deliveryFee}` : 'Free'}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white">
                      <span>Total</span>
                      <span className="text-primary-500">KES {selectedOrder.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                  <span className="flex items-center gap-1">
                    <CreditCard size={12} />
                    {selectedOrder.paymentMethod.replace('_', ' ')}
                  </span>
                  <span>Payment: {selectedOrder.paymentStatus}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)
  if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'BUSINESS_PARTNER')) {
    return { redirect: { destination: '/auth/login', permanent: false } }
  }

  const orders = await prisma.order.findMany({
    include: {
      customer: { select: { name: true, phone: true } },
      orderItems: { include: { product: { select: { name: true } } } },
      delivery: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return {
    props: {
      orders: JSON.parse(JSON.stringify(orders)),
      role: session.user.role,
    },
  }
}
