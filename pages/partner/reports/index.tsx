import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '@/lib/prisma'
import { useState } from 'react'
import Head from 'next/head'
import { BarChart3, Download, FileText, Calendar } from 'lucide-react'

interface ReportRow {
  date: string
  orderNumber: string
  customer: string | null
  items: number
  paymentMethod: string
  totalAmount: number
  status: string
}

interface Props {
  reports: ReportRow[]
  role: string
}

export default function PartnerReports({ reports, role }: Props) {
  const [dateFilter, setDateFilter] = useState('all')

  const filtered = dateFilter === 'all'
    ? reports
    : reports.filter(r => {
        const days = Number(dateFilter)
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        return new Date(r.date) >= cutoff
      })

  const totalRevenue = filtered.reduce((s, r) => s + r.totalAmount, 0)
  const totalOrders = filtered.length
  const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

  return (
    <>
      <Head><title>Reports - Danoscar Bite</title></Head>
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold dark:text-white">Reports</h1>
          <div className="flex items-center gap-2">
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Time</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold dark:text-white">KES {totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Orders</p>
            <p className="text-2xl font-bold dark:text-white">{totalOrders}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg Order Value</p>
            <p className="text-2xl font-bold dark:text-white">KES {avgOrder.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold dark:text-white">Order History</h2>
            <span className="text-xs text-gray-400">{filtered.length} entries</span>
          </div>
          {filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium">Order</th>
                    <th className="p-3 font-medium hidden sm:table-cell">Customer</th>
                    <th className="p-3 font-medium hidden md:table-cell">Items</th>
                    <th className="p-3 font-medium">Payment</th>
                    <th className="p-3 font-medium text-right">Amount</th>
                    <th className="p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr key={i} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="p-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {new Date(row.date).toLocaleDateString('en-KE', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="p-3 font-mono text-xs text-gray-900 dark:text-white">{row.orderNumber}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-300 hidden sm:table-cell">{row.customer || '-'}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-300 hidden md:table-cell">{row.items}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">{row.paymentMethod}</td>
                      <td className="p-3 text-right font-medium text-gray-900 dark:text-white">KES {row.totalAmount.toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${
                          row.status === 'DELIVERED' || row.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : row.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 size={40} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No orders found</p>
            </div>
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

  const orders = await prisma.order.findMany({
    include: {
      customer: { select: { name: true } },
      orderItems: { select: { quantity: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  })

  const reports = orders.map(o => ({
    date: o.createdAt.toISOString(),
    orderNumber: o.orderNumber,
    customer: o.customer.name,
    items: o.orderItems.reduce((s, i) => s + i.quantity, 0),
    paymentMethod: o.paymentMethod,
    totalAmount: Number(o.totalAmount),
    status: o.paymentStatus === 'COMPLETED' ? 'COMPLETED' : o.status,
  }))

  return {
    props: {
      reports: JSON.parse(JSON.stringify(reports)),
      role: session.user.role,
    },
  }
}
