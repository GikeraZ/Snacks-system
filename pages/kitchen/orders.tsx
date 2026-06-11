import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '../../lib/prisma'
import Head from 'next/head'
import { Clock, Coffee } from 'lucide-react'
import { useState } from 'react'


interface KitchenOrdersProps {
  orders: Array<{
    id: string
    orderNumber: string
    status: string
    createdAt: string
    customer: { name: string | null }
    orderItems: Array<{ quantity: number; product: { name: string } }>
  }>
  role: string
}

export default function KitchenOrders({ orders: initialOrders, role }: KitchenOrdersProps) {
  const [orders, setOrders] = useState(initialOrders)

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      })
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      }
    } catch (e) {
      console.error('Failed to update order:', e)
    }
  }

  return (
    <>
      <Head>
        <title>Kitchen Orders - Danoscar Bite</title>
      </Head>
      <div>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6 dark:text-white">Kitchen Orders</h1>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Coffee className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">No pending orders</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">New orders will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders.map((order) => (
                <div key={order.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-4">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-bold text-lg dark:text-white">{order.orderNumber}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      order.status === 'PREPARING' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{order.customer?.name || 'Customer'}</p>

                  <div className="space-y-2 mb-4">
                    {order.orderItems.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="dark:text-gray-300">{item.quantity}x {item.product.name}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-4">
                    <Clock className="h-4 w-4 mr-2" />
                    {new Date(order.createdAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(order.id, 'PREPARING')}
                      disabled={order.status === 'PREPARING' || order.status === 'READY'}
                      className="flex-1 py-2 px-3 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Preparing
                    </button>
                    <button
                      onClick={() => updateStatus(order.id, 'READY')}
                      disabled={order.status === 'READY'}
                      className="flex-1 py-2 px-3 border border-primary-600 dark:border-primary-500 text-primary-600 dark:text-primary-400 text-sm rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Ready
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)

  if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'KITCHEN_STAFF')) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    }
  }

  const orders = await prisma.order.findMany({
    where: {
      status: { in: ['CONFIRMED', 'PREPARING'] },
    },
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
