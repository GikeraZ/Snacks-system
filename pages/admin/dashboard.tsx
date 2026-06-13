import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '../../lib/prisma'
import { BarChart3, ShoppingBag, Truck, Package, DollarSign, Coffee, TrendingUp, TrendingDown, Users, Calendar, Phone, Mail, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Head from 'next/head'

import { useEffect, useRef, useState } from 'react'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

interface CustomerInfo {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  createdAt: string
  totalOrders: number
  totalSpent: number
}

interface DashboardProps {
  stats: {
    todaySales: number
    totalOrders: number
    pendingOrders: number
    activeDeliveries: number
    inventoryValue: number
    profitToday: number
    expensesToday: number
    weekSales: { date: string; amount: number }[]
    topProducts: { name: string; quantity: number; revenue: number }[]
    expensesByCategory: { category: string; amount: number }[]
  }
  recentCustomers: CustomerInfo[]
  role: string
}

export default function AdminDashboard({ stats, recentCustomers, role }: DashboardProps) {
  const salesChartRef = useRef<HTMLCanvasElement>(null)
  const productsChartRef = useRef<HTMLCanvasElement>(null)
  const expenseChartRef = useRef<HTMLCanvasElement>(null)
  const [salesChart, setSalesChart] = useState<Chart | null>(null)
  const [productsChart, setProductsChart] = useState<Chart | null>(null)
  const [expenseChart, setExpenseChart] = useState<Chart | null>(null)

  useEffect(() => {
    if (salesChartRef.current && !salesChart) {
      const ctx = salesChartRef.current.getContext('2d')
      if (ctx) {
        const chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: stats.weekSales.map(s => new Date(s.date).toLocaleDateString('en-KE', { weekday: 'short' })),
            datasets: [{
              label: 'Sales',
              data: stats.weekSales.map(s => s.amount),
              borderColor: '#4444ff',
              backgroundColor: 'rgba(68, 68, 255, 0.1)',
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#4444ff',
              pointRadius: 4,
            }],
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } },
          },
        })
        setSalesChart(chart)
      }
    }
    return () => { salesChart?.destroy() }
  }, [salesChartRef, stats.weekSales])

  useEffect(() => {
    if (productsChartRef.current && stats.topProducts.length > 0 && !productsChart) {
      const ctx = productsChartRef.current.getContext('2d')
      if (ctx) {
        const chart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: stats.topProducts.map(p => p.name),
            datasets: [{
              label: 'Qty Sold',
              data: stats.topProducts.map(p => p.quantity),
              backgroundColor: ['#4444ff', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'],
              borderRadius: 6,
            }],
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } },
          },
        })
        setProductsChart(chart)
      }
    }
    return () => { productsChart?.destroy() }
  }, [productsChartRef, stats.topProducts])

  useEffect(() => {
    if (expenseChartRef.current && stats.expensesByCategory.length > 0 && !expenseChart) {
      const ctx = expenseChartRef.current.getContext('2d')
      if (ctx) {
        const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']
        const chart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: stats.expensesByCategory.map(e => e.category),
            datasets: [{
              data: stats.expensesByCategory.map(e => e.amount),
              backgroundColor: colors.slice(0, stats.expensesByCategory.length),
              borderWidth: 0,
            }],
          },
          options: {
            responsive: true,
            plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } } },
          },
        })
        setExpenseChart(chart)
      }
    }
    return () => { expenseChart?.destroy() }
  }, [expenseChartRef, stats.expensesByCategory])

  const statCards = [
    { name: "Today's Sales", value: `KES ${stats.todaySales.toLocaleString()}`, icon: DollarSign, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
    { name: 'Total Orders', value: stats.totalOrders.toString(), icon: ShoppingBag, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { name: 'Pending Orders', value: stats.pendingOrders.toString(), icon: Coffee, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { name: 'Active Deliveries', value: stats.activeDeliveries.toString(), icon: Truck, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { name: 'Inventory Value', value: `KES ${stats.inventoryValue.toLocaleString()}`, icon: Package, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { name: "Today's Profit", value: `KES ${stats.profitToday.toLocaleString()}`, icon: TrendingUp, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/20' },
  ]

  return (
    <>
      <Head><title>Dashboard - Danoscar Bite</title></Head>
      <div>
        <div className="p-4 md:p-8">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            {statCards.map((card) => (
              <div key={card.name} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl ${card.bg}`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <span className={`text-xs font-medium ${card.name.includes('Profit') ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                    {card.name.includes('Profit') ? <><TrendingUp className="h-3 w-3 inline mr-1" />+{Math.round((stats.profitToday / (stats.todaySales || 1)) * 100)}%</> : null}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{card.name}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
              <h2 className="text-lg font-semibold dark:text-white mb-4">Weekly Sales Trend</h2>
              {stats.weekSales.length > 0 ? (
                <canvas ref={salesChartRef} height={200} />
              ) : (
                <p className="text-gray-400 dark:text-gray-500 text-center py-8">No sales data this week</p>
              )}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
              <h2 className="text-lg font-semibold dark:text-white mb-4">Top Products</h2>
              {stats.topProducts.length > 0 ? (
                stats.topProducts.slice(0, 5).map((p, i) => (
                  <div key={p.name} className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-gray-700 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-400 dark:text-gray-500 w-6">#{i + 1}</span>
                      <span className="text-sm font-medium dark:text-white">{p.name}</span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{p.quantity} sold</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 dark:text-gray-500 text-center py-8">No product sales yet</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
              <h2 className="text-lg font-semibold dark:text-white mb-4">Expenses by Category</h2>
              {stats.expensesByCategory.length > 0 ? (
                <canvas ref={expenseChartRef} height={220} />
              ) : (
                <p className="text-gray-400 dark:text-gray-500 text-center py-8">No expenses recorded</p>
              )}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
              <h2 className="text-lg font-semibold dark:text-white mb-4">Quick Summary</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Today's Revenue</p>
                    <p className="text-xl font-bold text-green-700 dark:text-green-400">KES {stats.todaySales.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg"><TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" /></div>
                </div>
                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Today's Expenses</p>
                    <p className="text-xl font-bold text-red-700 dark:text-red-400">KES {stats.expensesToday.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg"><TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" /></div>
                </div>
                <div className="flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Net Profit</p>
                    <p className="text-xl font-bold text-primary-700 dark:text-primary-400">KES {stats.profitToday.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg"><BarChart3 className="h-5 w-5 text-primary-600 dark:text-primary-400" /></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold dark:text-white">Registered Customers ({recentCustomers.length})</h2>
              <Link href="/admin/customers" className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            {recentCustomers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Phone</th>
                      <th className="pb-3 font-medium hidden md:table-cell">Email</th>
                      <th className="pb-3 font-medium hidden sm:table-cell">Orders</th>
                      <th className="pb-3 font-medium hidden sm:table-cell">Total Spent</th>
                      <th className="pb-3 font-medium hidden lg:table-cell">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCustomers.map((c) => (
                      <tr key={c.id} className="border-b border-gray-50 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                              <Users className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">{c.name || 'Unnamed'}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">{c.phone || '-'}</td>
                        <td className="py-3 pr-4 text-gray-500 dark:text-gray-400 hidden md:table-cell">{c.email || '-'}</td>
                        <td className="py-3 pr-4 text-gray-600 dark:text-gray-300 hidden sm:table-cell">{c.totalOrders}</td>
                        <td className="py-3 pr-4 text-gray-600 dark:text-gray-300 hidden sm:table-cell">KES {c.totalSpent.toLocaleString()}</td>
                        <td className="py-3 text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                          {new Date(c.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400 dark:text-gray-500 text-center py-8">No registered customers yet</p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-lg font-semibold dark:text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: 'View Orders', href: '/admin/orders', icon: ShoppingBag },
                { name: 'Manage Menu', href: '/admin/products', icon: Coffee },
                { name: 'Inventory', href: '/admin/inventory', icon: Package },
                { name: 'Expenses', href: '/admin/expenses', icon: DollarSign },
              ].map(action => (
                <a key={action.name} href={action.href}
                  className="flex flex-col items-center p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-200 dark:hover:border-primary-700 transition-all group">
                  <action.icon className="h-8 w-8 text-primary-600 dark:text-primary-400 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-700 dark:group-hover:text-primary-400">{action.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)
  if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'BUSINESS_PARTNER')) {
    return { redirect: { destination: '/auth/login', permanent: false } }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [todayOrders, weekOrders, todayExpenses, ingredients] = await Promise.all([
    prisma.order.findMany({ where: { createdAt: { gte: today } } }),
    prisma.order.findMany({ where: { createdAt: { gte: weekAgo } }, orderBy: { createdAt: 'asc' as const } }),
    prisma.expense.findMany({ where: { date: { gte: today } } }),
    prisma.ingredient.findMany(),
  ])

  const todaySales = todayOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0)
  const expensesTodayTotal = todayExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
  const inventoryValue = ingredients.reduce((sum, ing) => sum + Number(ing.costPerUnit) * Number(ing.stockQuantity), 0)
  const estimatedCostRatio = 0.4
  const profitToday = todaySales - expensesTodayTotal - (todaySales * estimatedCostRatio)

  // Weekly sales trend
  const weekSalesMap = new Map<string, number>()
  for (const order of weekOrders) {
    const day = order.createdAt.toISOString().slice(0, 10)
    weekSalesMap.set(day, (weekSalesMap.get(day) || 0) + Number(order.totalAmount))
  }

  // Top products this week
  const weekOrderIds = weekOrders.map(o => o.id)
  const topProductData = weekOrderIds.length > 0
    ? await prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        where: { orderId: { in: weekOrderIds } },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      })
    : []
  const productIds = topProductData.map(p => p.productId)
  const products = productIds.length > 0
    ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } })
    : []
  const productNames = new Map(products.map(p => [p.id, p.name]))

  const topProducts = topProductData.map(p => ({
    name: productNames.get(p.productId) || 'Unknown',
    quantity: p._sum.quantity || 0,
    revenue: 0,
  }))

  // Expenses by category this month
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthExpenses = await prisma.expense.findMany({ where: { date: { gte: monthStart } } })
  const expenseCategoryMap = new Map<string, number>()
  for (const exp of monthExpenses) {
    expenseCategoryMap.set(exp.category, (expenseCategoryMap.get(exp.category) || 0) + Number(exp.amount))
  }

  // Registered customers
  const customers = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      orders: {
        select: { totalAmount: true },
      },
    },
  })

  const recentCustomers = customers.map((u) => ({
    id: u.id,
    name: u.name,
    phone: u.phone,
    email: u.email,
    createdAt: u.createdAt.toISOString(),
    totalOrders: u.orders.length,
    totalSpent: u.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
  }))

  return {
    props: {
      stats: {
        todaySales,
        totalOrders: todayOrders.length,
        pendingOrders: todayOrders.filter(o => ['PENDING', 'CONFIRMED', 'PREPARING'].includes(o.status)).length,
        activeDeliveries: todayOrders.filter(o => o.status === 'OUT_FOR_DELIVERY').length,
        inventoryValue,
        profitToday,
        expensesToday: expensesTodayTotal,
        weekSales: Array.from(weekSalesMap.entries()).map(([date, amount]) => ({ date, amount })),
        topProducts,
        expensesByCategory: Array.from(expenseCategoryMap.entries()).map(([category, amount]) => ({ category, amount })),
      },
      recentCustomers,
      role: session.user.role,
    },
  }
}
