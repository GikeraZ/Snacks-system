import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '../../lib/prisma'
import Head from 'next/head'
import { Truck, MapPin, CheckCircle } from 'lucide-react'
import { useState } from 'react'


interface DeliveryOrdersProps {
  orders: Array<{
    id: string
    orderNumber: string
    status: string
    totalAmount: number
    createdAt: string
    delivery: {
      locationType: string
      locationDetails: string
    }
    customer: { name: string | null; phone: string | null }
  }>
  role: string
}

export default function DeliveryOrders({ orders: initialOrders, role }: DeliveryOrdersProps) {
  const [orders, setOrders] = useState(initialOrders)

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/deliveries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      })
      if (res.ok) {
        setOrders(prev => prev.filter(o => o.id !== orderId))
      }
    } catch (e) {
      console.error('Failed to update delivery:', e)
    }
  }

  return (
    <>
      <Head>
        <title>Deliveries - Danoscar Bite</title>
      </Head>
      <div>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6 dark:text-white">My Deliveries</h1>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">No deliveries assigned</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">New deliveries will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg dark:text-white">{order.orderNumber}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{order.customer?.name || 'Customer'}</p>
                    </div>
                    <span className="font-medium dark:text-white">KES {order.totalAmount.toLocaleString()}</span>
                  </div>

                  <div className="flex items-start mb-4">
                    <MapPin className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2 mt-1" />
                    <div>
                      <p className="font-medium capitalize dark:text-white">{order.delivery.locationType.toLowerCase().replace('_', ' ')}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{order.delivery.locationDetails}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{order.customer?.phone || ''}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {new Date(order.createdAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(order.id, 'OUT_FOR_DELIVERY')}
                        className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
                      >
                        Pick Up
                      </button>
                      <button
                        onClick={() => updateStatus(order.id, 'DELIVERED')}
                        className="px-4 py-2 border border-green-600 dark:border-green-500 text-green-600 dark:text-green-400 text-sm rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
                      >
                        Delivered
                      </button>
                    </div>
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

  if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'DELIVERY')) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    }
  }

  const orders = await prisma.order.findMany({
    where: {
      deliveryPersonId: session.user.id,
      status: { in: ['READY', 'OUT_FOR_DELIVERY'] },
    },
    include: {
      delivery: { select: { locationType: true, locationDetails: true } },
      customer: { select: { name: true, phone: true } },
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
