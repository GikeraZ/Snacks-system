import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '../../lib/prisma'
import Head from 'next/head'
import { BarChart3, Package, TrendingUp, Users } from 'lucide-react'


interface PartnerDashboardProps {
  role: string
  weeklyRevenue: number
  monthlyRevenue: number
  totalCustomers: number
  avgOrderValue: number
  weeklyTrend: number
  monthlyTrend: number
}

export default function PartnerDashboard({
  role, weeklyRevenue, monthlyRevenue, totalCustomers, avgOrderValue, weeklyTrend, monthlyTrend
}: PartnerDashboardProps) {
  const quickActions = [
    { name: 'Sales Reports', href: '/partner/reports', icon: BarChart3, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
    { name: 'Inventory', href: '/partner/inventory', icon: Package, color: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' },
    { name: 'Performance', href: '/partner/performance', icon: TrendingUp, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' },
    { name: 'Customers', href: '/partner/customers', icon: Users, color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400' },
  ]

  const stats = [
    { name: 'Weekly Revenue', value: `KES ${weeklyRevenue.toLocaleString()}`, trend: `${weeklyTrend >= 0 ? '+' : ''}${weeklyTrend}%`, positive: weeklyTrend >= 0 },
    { name: 'Monthly Revenue', value: `KES ${monthlyRevenue.toLocaleString()}`, trend: `${monthlyTrend >= 0 ? '+' : ''}${monthlyTrend}%`, positive: monthlyTrend >= 0 },
    { name: 'Total Customers', value: totalCustomers.toLocaleString(), trend: 'Active users', positive: true },
    { name: 'Avg Order Value', value: `KES ${avgOrderValue.toLocaleString()}`, trend: 'Last 30 days', positive: true },
  ]

  return (
    <>
      
      <Head>
        <title>Partner Dashboard - Danoscar Bite</title>
      </Head>

      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Business Partner Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{stat.name}</p>
              <p className="text-2xl font-bold dark:text-white">{stat.value}</p>
              <p className={`text-sm mt-2 ${stat.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {stat.trend}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 mb-8">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <a
                key={action.name}
                href={action.href}
                className="p-6 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 text-center"
              >
                <div className={`inline-flex p-3 rounded-full ${action.color} mb-3`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium dark:text-white">{action.name}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Revenue Overview</h2>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg">
            <BarChart3 className="h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p className="ml-4 text-gray-500 dark:text-gray-400">Revenue chart will appear here</p>
          </div>
        </div>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)

  if (!session || !session.user || session.user.role !== 'BUSINESS_PARTNER') {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    }
  }

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [weeklyOrders, prevWeekOrders, monthlyOrders, customerCount] = await Promise.all([
    prisma.order.findMany({ where: { createdAt: { gte: weekAgo } } }),
    prisma.order.findMany({ where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
    prisma.order.findMany({ where: { createdAt: { gte: monthAgo } } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
  ])

  const weeklyRevenue = weeklyOrders.reduce((s, o) => s + Number(o.totalAmount), 0)
  const prevWeekRevenue = prevWeekOrders.reduce((s, o) => s + Number(o.totalAmount), 0)
  const monthlyRevenue = monthlyOrders.reduce((s, o) => s + Number(o.totalAmount), 0)

  const weeklyTrend = prevWeekRevenue > 0 ? Math.round(((weeklyRevenue - prevWeekRevenue) / prevWeekRevenue) * 100) : 0
  const monthlyTrend = 8
  const avgOrderValue = monthlyOrders.length > 0 ? Math.round(monthlyRevenue / monthlyOrders.length) : 0

  return {
    props: {
      role: session.user.role,
      weeklyRevenue,
      monthlyRevenue,
      totalCustomers: customerCount,
      avgOrderValue,
      weeklyTrend,
      monthlyTrend,
    },
  }
}
