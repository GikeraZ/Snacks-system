import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '@/lib/prisma'
import Head from 'next/head'
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users } from 'lucide-react'

interface MetricCard {
  name: string
  value: string
  change: number
  positive: boolean
}

interface Props {
  metrics: MetricCard[]
  currentWeekSales: number
  previousWeekSales: number
  currentMonthSales: number
  previousMonthSales: number
  conversionRate: number
  repeatCustomerRate: number
  role: string
}

export default function PartnerPerformance({
  metrics, currentWeekSales, previousWeekSales,
  currentMonthSales, previousMonthSales, conversionRate, repeatCustomerRate, role
}: Props) {
  return (
    <>
      <Head><title>Performance - Hot Take</title></Head>
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Performance</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {metrics.map(m => (
            <div key={m.name} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">{m.name}</p>
                <span className={`flex items-center gap-1 text-xs font-medium ${m.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {m.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {m.change >= 0 ? '+' : ''}{m.change}%
                </span>
              </div>
              <p className="text-2xl font-bold dark:text-white">{m.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Weekly Comparison</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">This Week</p>
                <p className="text-xl font-bold text-green-700 dark:text-green-400">KES {currentWeekSales.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last Week</p>
                <p className="text-xl font-bold text-gray-700 dark:text-gray-300">KES {previousWeekSales.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Change</span>
                <span className={`text-sm font-bold ${currentWeekSales >= previousWeekSales ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {previousWeekSales > 0 ? `${((currentWeekSales - previousWeekSales) / previousWeekSales * 100).toFixed(1)}%` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Monthly Comparison</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">This Month</p>
                <p className="text-xl font-bold text-green-700 dark:text-green-400">KES {currentMonthSales.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last Month</p>
                <p className="text-xl font-bold text-gray-700 dark:text-gray-300">KES {previousMonthSales.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Change</span>
                <span className={`text-sm font-bold ${currentMonthSales >= previousMonthSales ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {previousMonthSales > 0 ? `${((currentMonthSales - previousMonthSales) / previousMonthSales * 100).toFixed(1)}%` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Customer Insights</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Repeat Customers</p>
                    <p className="text-xs text-gray-400">Ordered more than once</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-purple-700 dark:text-purple-400">{repeatCustomerRate}%</p>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Conversion Rate</p>
                    <p className="text-xs text-gray-400">Orders to completed</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{conversionRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Key Metrics</h2>
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Performance indicators for your business partnership.</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl text-center">
                  <DollarSign className="h-5 w-5 text-primary-500 mx-auto mb-1" />
                  <p className="text-lg font-bold dark:text-white">KES {(currentMonthSales * 0.15).toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400">Est. Commission (15%)</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl text-center">
                  <TrendingUp className="h-5 w-5 text-primary-500 mx-auto mb-1" />
                  <p className="text-lg font-bold dark:text-white">Highest</p>
                  <p className="text-[10px] text-gray-400">Peak Performance</p>
                </div>
              </div>
            </div>
          </div>
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
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  const [
    currentWeek, previousWeek, currentMonth, previousMonth, allTime
  ] = await Promise.all([
    prisma.order.findMany({ where: { createdAt: { gte: weekAgo } } }),
    prisma.order.findMany({ where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
    prisma.order.findMany({ where: { createdAt: { gte: monthAgo } } }),
    prisma.order.findMany({ where: { createdAt: { gte: twoMonthsAgo, lt: monthAgo } } }),
    prisma.order.findMany({ include: { customer: { select: { id: true } } } }),
  ])

  const currentWeekSales = currentWeek.reduce((s, o) => s + Number(o.totalAmount), 0)
  const previousWeekSales = previousWeek.reduce((s, o) => s + Number(o.totalAmount), 0)
  const currentMonthSales = currentMonth.reduce((s, o) => s + Number(o.totalAmount), 0)
  const previousMonthSales = previousMonth.reduce((s, o) => s + Number(o.totalAmount), 0)

  const totalCompleted = allTime.filter(o => o.status === 'DELIVERED' || o.paymentStatus === 'COMPLETED').length
  const conversionRate = allTime.length > 0 ? Math.round((totalCompleted / allTime.length) * 100) : 0

  const customerOrderCounts = new Map<string, number>()
  for (const o of allTime) {
    customerOrderCounts.set(o.customerId, (customerOrderCounts.get(o.customerId) || 0) + 1)
  }
  const repeatCustomers = Array.from(customerOrderCounts.values()).filter(c => c > 1).length
  const repeatCustomerRate = customerOrderCounts.size > 0 ? Math.round((repeatCustomers / customerOrderCounts.size) * 100) : 0

  const weekTrend = previousWeekSales > 0 ? Math.round(((currentWeekSales - previousWeekSales) / previousWeekSales) * 100) : 0
  const monthTrend = previousMonthSales > 0 ? Math.round(((currentMonthSales - previousMonthSales) / previousMonthSales) * 100) : 0

  const metrics: MetricCard[] = [
    { name: 'This Week', value: `KES ${currentWeekSales.toLocaleString()}`, change: weekTrend, positive: weekTrend >= 0 },
    { name: 'This Month', value: `KES ${currentMonthSales.toLocaleString()}`, change: monthTrend, positive: monthTrend >= 0 },
    { name: 'Conversion', value: `${conversionRate}%`, change: 0, positive: conversionRate >= 50 },
    { name: 'Repeat Rate', value: `${repeatCustomerRate}%`, change: 0, positive: repeatCustomerRate >= 20 },
  ]

  return {
    props: {
      metrics,
      currentWeekSales,
      previousWeekSales,
      currentMonthSales,
      previousMonthSales,
      conversionRate,
      repeatCustomerRate,
      role: session.user.role,
    },
  }
}
