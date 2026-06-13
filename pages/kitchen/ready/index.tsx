import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '@/lib/prisma'
import { useState } from 'react'
import Head from 'next/head'
import { CheckCircle, Clock, Coffee, Package } from 'lucide-react'

interface ReadyOrder {
  id: string
  orderNumber: string
  status: string
  createdAt: string
  customer: { name: string | null }
  orderItems: Array<{ quantity: number; product: { name: string } }>
}

interface Props {
  orders: ReadyOrder[]
  role: string
}

export default function KitchenReady({ orders: initialOrders, role }: Props) {
  const [orders, setOrders] = useState(initialOrders)
  const [collecting, setCollecting] = useState<string | null>(null)

  const markCollected = async (orderId: string) => {
    setCollecting(orderId)
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: 'DELIVERED' }),
      })
      if (res.ok) {
        setOrders(prev => prev.filter(o => o.id !== orderId))
      }
    } catch (e) {
      console.error('Failed to update order:', e)
    }
    setCollecting(null)
  }

  return (
    <>
      <Head><title>Ready Orders - Danoscar Bite</title></Head>
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold dark:text-white">Ready for Pickup</h1>
          <span className="text-sm text-gray-400">{orders.length} ready</span>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle size={48} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">No ready orders</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">Ready orders will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-green-200 dark:border-green-800/40 shadow-sm p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="font-bold text-lg dark:text-white">{order.orderNumber}</span>
                    <span className="ml-2 px-2 py-0.5 text-[10px] rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">
                      READY
                    </span>
                  </div>
                  <Package className="h-5 w-5 text-green-500" />
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{order.customer?.name || 'Customer'}</p>

                <div className="space-y-1.5 mb-4">
                  {order.orderItems.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="dark:text-gray-300">{item.quantity}x {item.product.name}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <Clock className="h-4 w-4 mr-2" />
                  {new Date(order.createdAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </div>

                <button
                  onClick={() => markCollected(order.id)}
                  disabled={collecting === order.id}
                  className="w-full py-3 px-4 bg-gradient-to-br from-green-500 to-green-600 text-white text-sm font-bold rounded-2xl shadow-lg shadow-green-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {collecting === order.id ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><CheckCircle size={16} /> Mark as Collected</>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)
  if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'KITCHEN_STAFF')) {
    return { redirect: { destination: '/auth/login', permanent: false } }
  }

  const orders = await prisma.order.findMany({
    where: { status: 'READY' },
    include: {
      customer: { select: { name: true } },
      orderItems: { include: { product: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return {
    props: {
      orders: JSON.parse(JSON.stringify(orders)),
      role: session.user.role,
    },
  }
}
