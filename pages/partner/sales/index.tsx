import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '@/lib/prisma'
import { useState } from 'react'
import Head from 'next/head'
import { DollarSign, TrendingUp, ShoppingBag, Calendar, ChevronDown } from 'lucide-react'

interface SalesData {
  period: string
  totalSales: number
  orderCount: number
  avgOrder: number
  dailyData: { date: string; amount: number; count: number }[]
  topProducts: { name: string; quantity: number; revenue: number }[]
  paymentBreakdown: { method: string; total: number; count: number }[]
}

interface Props {
  weekly: SalesData
  monthly: SalesData
  role: string
}

export default function PartnerSales({ weekly, monthly, role }: Props) {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly')
  const data = period === 'weekly' ? weekly : monthly

  return (
    <>
      <Head><title>Sales - Hot Take</title></Head>
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold dark:text-white">Sales</h1>
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-0.5">
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${period === 'weekly' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
            >
              Weekly
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${period === 'monthly' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
            >
              Monthly
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-900/20">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-2xl font-bold dark:text-white">KES {data.totalSales.toLocaleString()}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Sales</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold dark:text-white">{data.orderCount}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Orders</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-2xl font-bold dark:text-white">KES {data.avgOrder.toLocaleString()}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Order Value</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Daily Trend</h2>
            {data.dailyData.length > 0 ? (
              <div className="space-y-2">
                {data.dailyData.map(d => (
                  <div key={d.date} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700/30 last:border-0">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {new Date(d.date).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium dark:text-white">KES {d.amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">{d.count} orders</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 dark:text-gray-500 text-center py-6">No sales data</p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Payment Methods</h2>
            {data.paymentBreakdown.length > 0 ? (
              <div className="space-y-3">
                {data.paymentBreakdown.map(p => (
                  <div key={p.method} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700/30 last:border-0">
                    <span className="text-sm font-medium dark:text-white">{p.method}</span>
                    <div className="text-right">
                      <p className="text-sm font-medium dark:text-white">KES {p.total.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">{p.count} transactions</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 dark:text-gray-500 text-center py-6">No payment data</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Top Products</h2>
          {data.topProducts.length > 0 ? (
            <div className="space-y-3">
              {data.topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700/30 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400 w-6">#{i + 1}</span>
                    <span className="text-sm font-medium dark:text-white">{p.name}</span>
                    <span className="text-xs text-gray-400">x{p.quantity}</span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">KES {p.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-center py-6">No products sold</p>
          )}
        </div>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)
  if (!session || !session.user || session.user.role !== 'BUSINESS_PARTNER') {
    return { redirect: { destination: '/auth/login', permanent: false } }
  }

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const buildSalesData = async (start: Date): Promise<SalesData> => {
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: start } },
      include: { orderItems: { include: { product: { select: { name: true } } } } },
      orderBy: { createdAt: 'asc' },
    })

    const totalSales = orders.reduce((s, o) => s + Number(o.totalAmount), 0)
    const orderCount = orders.length
    const avgOrder = orderCount > 0 ? Math.round(totalSales / orderCount) : 0

    const dayMap = new Map<string, { amount: number; count: number }>()
    for (const o of orders) {
      const day = o.createdAt.toISOString().slice(0, 10)
      const entry = dayMap.get(day) || { amount: 0, count: 0 }
      entry.amount += Number(o.totalAmount)
      entry.count++
      dayMap.set(day, entry)
    }

    const paymentMap = new Map<string, { total: number; count: number }>()
    for (const o of orders) {
      const entry = paymentMap.get(o.paymentMethod) || { total: 0, count: 0 }
      entry.total += Number(o.totalAmount)
      entry.count++
      paymentMap.set(o.paymentMethod, entry)
    }

    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>()
    for (const o of orders) {
      for (const item of o.orderItems) {
        const existing = productMap.get(item.product.name)
        if (existing) {
          existing.quantity += item.quantity
          existing.revenue += Number(item.totalPrice)
        } else {
          productMap.set(item.product.name, {
            name: item.product.name,
            quantity: item.quantity,
            revenue: Number(item.totalPrice),
          })
        }
      }
    }

    return {
      period: start === weekAgo ? 'weekly' : 'monthly',
      totalSales,
      orderCount,
      avgOrder,
      dailyData: Array.from(dayMap.entries()).map(([date, d]) => ({ date, ...d })),
      topProducts: Array.from(productMap.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 10),
      paymentBreakdown: Array.from(paymentMap.entries()).map(([method, d]) => ({ method, ...d })),
    }
  }

  const [weekly, monthly] = await Promise.all([
    buildSalesData(weekAgo),
    buildSalesData(monthAgo),
  ])

  return {
    props: {
      weekly: JSON.parse(JSON.stringify(weekly)),
      monthly: JSON.parse(JSON.stringify(monthly)),
      role: session.user.role,
    },
  }
}
