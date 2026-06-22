import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '@/lib/prisma'
import Head from 'next/head'
import { TrendingUp, ShoppingBag, CreditCard, Smartphone, Banknote, DollarSign } from 'lucide-react'

interface Props {
  role: string
  todaySales: number
  transactionCount: number
  avgOrderValue: number
  cashTotal: number
  mpesaTotal: number
  cardTotal: number
  topItems: { name: string; quantity: number; revenue: number }[]
  cashCount: number
  mpesaCount: number
  cardCount: number
}

export default function CashierSummary({
  role, todaySales, transactionCount, avgOrderValue,
  cashTotal, mpesaTotal, cardTotal,
  topItems, cashCount, mpesaCount, cardCount
}: Props) {
  return (
    <>
      <Head><title>Sales Summary - Hot Take</title></Head>
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Sales Summary</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-green-50 dark:bg-green-900/20">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-2xl font-bold dark:text-white">KES {todaySales.toLocaleString()}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Sales Today</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold dark:text-white">{transactionCount}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Transactions</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-2xl font-bold dark:text-white">KES {avgOrderValue.toLocaleString()}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Order Value</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-2xl font-bold dark:text-white">{topItems.reduce((s, i) => s + i.quantity, 0)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Items Sold</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-900/20">
                <Banknote className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Cash</p>
                <p className="text-xs text-gray-400">{cashCount} transactions</p>
              </div>
            </div>
            <p className="text-xl font-bold dark:text-white">KES {cashTotal.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/20">
                <Smartphone className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-600 dark:text-primary-400">M-Pesa</p>
                <p className="text-xs text-gray-400">{mpesaCount} transactions</p>
              </div>
            </div>
            <p className="text-xl font-bold dark:text-white">KES {mpesaTotal.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Card</p>
                <p className="text-xs text-gray-400">{cardCount} transactions</p>
              </div>
            </div>
            <p className="text-xl font-bold dark:text-white">KES {cardTotal.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Top Selling Items</h2>
          {topItems.length > 0 ? (
            <div className="space-y-3">
              {topItems.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700/30 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400 w-6">#{i + 1}</span>
                    <span className="text-sm font-medium dark:text-white">{item.name}</span>
                    <span className="text-xs text-gray-400">x{item.quantity}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">KES {item.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-center py-6">No items sold today</p>
          )}
        </div>
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
  })

  const transactionCount = orders.length
  const todaySales = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0)
  const avgOrderValue = transactionCount > 0 ? Math.round(todaySales / transactionCount) : 0

  const cashOrders = orders.filter(o => o.paymentMethod === 'CASH')
  const mpesaOrders = orders.filter(o => o.paymentMethod === 'MPESA')
  const cardOrders = orders.filter(o => o.paymentMethod === 'CARD')

  const cashTotal = cashOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0)
  const mpesaTotal = mpesaOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0)
  const cardTotal = cardOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0)

  const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>()
  for (const order of orders) {
    for (const item of order.orderItems) {
      const existing = itemMap.get(item.product.name)
      if (existing) {
        existing.quantity += item.quantity
        existing.revenue += Number(item.totalPrice)
      } else {
        itemMap.set(item.product.name, {
          name: item.product.name,
          quantity: item.quantity,
          revenue: Number(item.totalPrice),
        })
      }
    }
  }

  const topItems = Array.from(itemMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)

  return {
    props: {
      role: session.user.role,
      todaySales,
      transactionCount,
      avgOrderValue,
      cashTotal,
      mpesaTotal,
      cardTotal,
      topItems: JSON.parse(JSON.stringify(topItems)),
      cashCount: cashOrders.length,
      mpesaCount: mpesaOrders.length,
      cardCount: cardOrders.length,
    },
  }
}
