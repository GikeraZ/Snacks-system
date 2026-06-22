import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '../../lib/prisma'
import Head from 'next/head'
import { CreditCard, Receipt, ShoppingBag, TrendingUp } from 'lucide-react'


interface CashierDashboardProps {
  role: string
  todaySales: number
  transactionCount: number
  avgOrderValue: number
}

export default function CashierDashboard({ role, todaySales, transactionCount, avgOrderValue }: CashierDashboardProps) {
  const quickActions = [
    { name: 'New Sale', href: '/cashier/pos', icon: ShoppingBag, color: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' },
    { name: 'View Receipts', href: '/cashier/receipts', icon: Receipt, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
    { name: 'Sales Summary', href: '/cashier/summary', icon: TrendingUp, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' },
  ]

  return (
    <>
      
      <Head>
        <title>Cashier Dashboard - Hot Take</title>
      </Head>

      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Cashier Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                <ShoppingBag className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">Today&apos;s Sales</p>
                <p className="text-2xl font-bold dark:text-white">KES {todaySales.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <Receipt className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">Transactions</p>
                <p className="text-2xl font-bold dark:text-white">{transactionCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">Avg. Order</p>
                <p className="text-2xl font-bold dark:text-white">KES {avgOrderValue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)

  if (!session || !session.user || (session.user.role !== 'CASHIER' && session.user.role !== 'SUPER_ADMIN')) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: today } },
  })

  const todaySales = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0)
  const transactionCount = orders.length
  const avgOrderValue = transactionCount > 0 ? Math.round(todaySales / transactionCount) : 0

  return {
    props: {
      role: session.user.role,
      todaySales,
      transactionCount,
      avgOrderValue,
    },
  }
}
