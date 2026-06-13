import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '@/lib/prisma'
import { useState } from 'react'
import Head from 'next/head'
import { ShoppingBag, Clock, CreditCard, CheckCircle, XCircle, Search } from 'lucide-react'

interface OrderItemData {
  id: string
  quantity: number
  unitPrice: number
  totalPrice: number
  product: { name: string }
}

interface OrderData {
  id: string
  orderNumber: string
  status: string
  paymentMethod: string
  paymentStatus: string
  totalAmount: number
  createdAt: string
  orderItems: OrderItemData[]
}

interface Props {
  orders: OrderData[]
  role: string
}

export default function CashierOrders({ orders: initialOrders, role }: Props) {
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null)

  const filtered = search
    ? initialOrders.filter(o =>
        o.orderNumber.toLowerCase().includes(search.toLowerCase())
      )
    : initialOrders

  const formatDate = (d: string) => {
    const date = new Date(d)
    return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) +
      ' · ' + date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  return (
    <>
      <Head><title>Orders - Danoscar Bite</title></Head>
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold dark:text-white">Today's Orders</h1>
          <span className="text-sm text-gray-400">{initialOrders.length} orders</span>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by order number..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag size={48} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No orders found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 cursor-pointer hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">{order.orderNumber}</span>
                    <span className={`ml-2 px-2 py-0.5 text-[10px] rounded-full font-medium ${
                      order.paymentStatus === 'COMPLETED'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : order.paymentStatus === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-primary-500">KES {order.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1"><Clock size={12} />{formatDate(order.createdAt)}</span>
                  <span className="flex items-center gap-1"><ShoppingBag size={12} />{order.orderItems.length} items</span>
                  <span className="flex items-center gap-1"><CreditCard size={12} />{order.paymentMethod}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 lg:pt-24 overflow-y-auto" onClick={() => setSelectedOrder(null)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
              onClick={e => e.stopPropagation()}
              className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700"
            >
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">{selectedOrder.orderNumber}</h2>
                  <p className="text-xs text-gray-400">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700">
                  <XCircle size={18} className="text-gray-400" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedOrder.paymentStatus === 'COMPLETED'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    <CheckCircle size={12} className="inline mr-1" />
                    {selectedOrder.paymentStatus}
                  </span>
                  <span className="text-xs text-gray-400">{selectedOrder.paymentMethod}</span>
                </div>

                <div className="space-y-2">
                  {selectedOrder.orderItems.map(item => (
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

                <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                  <div className="flex justify-between text-base font-bold">
                    <span className="text-gray-700 dark:text-gray-300">Total</span>
                    <span className="text-primary-500">KES {selectedOrder.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)
  if (!session || !session.user || (session.user.role !== 'CASHIER' && session.user.role !== 'SUPER_ADMIN')) {
    return { redirect: { destination: '/auth/login', permanent: false } }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: today },
      delivery: { locationType: 'POS' },
    },
    include: {
      orderItems: { include: { product: { select: { name: true } } } },
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
