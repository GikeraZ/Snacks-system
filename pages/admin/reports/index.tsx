import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'

import { BarChart3, TrendingUp, TrendingDown, Download, Calendar, ChevronDown, Loader2 } from 'lucide-react'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

interface Props { role: string }

type Period = 'today' | 'week' | 'month'
type Tab = 'overview' | 'sales' | 'expenses' | 'products'

export default function ReportsPage({ role }: Props) {
  const [period, setPeriod] = useState<Period>('week')
  const [tab, setTab] = useState<Tab>('overview')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const salesChartRef = useRef<HTMLCanvasElement>(null)
  const expenseChartRef = useRef<HTMLCanvasElement>(null)
  const productsChartRef = useRef<HTMLCanvasElement>(null)
  const salesChart = useRef<Chart | null>(null)
  const expenseChart = useRef<Chart | null>(null)
  const productsChart = useRef<Chart | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reports?period=${period}&type=all`)
      if (res.ok) setData(await res.json())
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [period])

  useEffect(() => {
    if (!data || !salesChartRef.current) return
    if (salesChart.current) salesChart.current.destroy()

    if (data.sales?.daily?.length) {
      const ctx = salesChartRef.current.getContext('2d')
      if (ctx) {
        salesChart.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: data.sales.daily.map((d: any) => new Date(d.date).toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric' })),
            datasets: [
              {
                label: 'Sales',
                data: data.sales.daily.map((d: any) => d.sales),
                backgroundColor: '#4444ff',
                borderRadius: 6,
              },
              {
                label: 'Orders',
                data: data.sales.daily.map((d: any) => d.orders),
                backgroundColor: '#22c55e',
                borderRadius: 6,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: { legend: { position: 'top', labels: { usePointStyle: true } } },
            scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } },
          },
        })
      }
    }
  }, [data])

  useEffect(() => {
    if (!data || !expenseChartRef.current) return
    if (expenseChart.current) expenseChart.current.destroy()

    if (data.expenses?.byCategory?.length) {
      const ctx = expenseChartRef.current.getContext('2d')
      if (ctx) {
        const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']
        expenseChart.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: data.expenses.byCategory.map((e: any) => e.category),
            datasets: [{
              data: data.expenses.byCategory.map((e: any) => e.amount),
              backgroundColor: colors.slice(0, data.expenses.byCategory.length),
              borderWidth: 0,
            }],
          },
          options: {
            responsive: true,
            plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } } },
          },
        })
      }
    }
  }, [data])

  useEffect(() => {
    if (!data || !productsChartRef.current) return
    if (productsChart.current) productsChart.current.destroy()

    if (data.topProducts?.length) {
      const ctx = productsChartRef.current.getContext('2d')
      if (ctx) {
        productsChart.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: data.topProducts.map((p: any) => p.name),
            datasets: [{
              label: 'Quantity Sold',
              data: data.topProducts.map((p: any) => p.quantity),
              backgroundColor: ['#4444ff', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff', '#f0f0ff'],
              borderRadius: 6,
            }],
          },
          options: {
            responsive: true,
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: { y: { grid: { display: false } }, x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } } },
          },
        })
      }
    }
  }, [data])

  const periodLabels: Record<Period, string> = { today: 'Today', week: 'This Week', month: 'This Month' }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'sales', label: 'Sales' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'products', label: 'Products' },
  ] as const

  return (
    <>
      <Head><title>Reports - Hot Take</title></Head>
      <div>
        <div className="p-4 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Track your business performance</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
                {(['today', 'week', 'month'] as Period[]).map(p => (
                  <button key={p} onClick={() => setPeriod(p)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      period === p ? 'bg-primary-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}>
                    {periodLabels[p]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-600 pb-2 overflow-x-auto">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                  tab === t.id ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600 dark:text-primary-400" />
            </div>
          ) : !data ? (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">Failed to load data</div>
          ) : (
            <>
              {tab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-xl"><TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" /></div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Total Sales</span>
                      </div>
                      <p className="text-2xl font-bold dark:text-white">KES {(data.sales?.total || 0).toLocaleString()}</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{data.sales?.count || 0} orders</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl"><TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" /></div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</span>
                      </div>
                      <p className="text-2xl font-bold dark:text-white">KES {(data.expenses?.total || 0).toLocaleString()}</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{data.expenses?.count || 0} entries</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl"><BarChart3 className="h-5 w-5 text-primary-600 dark:text-primary-400" /></div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Net Profit</span>
                      </div>
                      <p className="text-2xl font-bold dark:text-white">KES {((data.sales?.total || 0) - (data.expenses?.total || 0)).toLocaleString()}</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{data.sales?.average ? `Avg order: KES ${data.sales.average.toFixed(0)}` : ''}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                      <h2 className="text-lg font-semibold dark:text-white mb-4">Sales Trend</h2>
                      {data.sales?.daily?.length > 0 ? <canvas ref={salesChartRef} height={200} /> : <p className="text-gray-400 dark:text-gray-500 text-center py-8">No data</p>}
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                      <h2 className="text-lg font-semibold dark:text-white mb-4">Expenses Breakdown</h2>
                      {data.expenses?.byCategory?.length > 0 ? <canvas ref={expenseChartRef} height={200} /> : <p className="text-gray-400 dark:text-gray-500 text-center py-8">No expenses</p>}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'sales' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                  <h2 className="text-lg font-semibold dark:text-white mb-4">Sales Details</h2>
                  {data.sales?.daily?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 dark:border-gray-700">
                            <th className="text-left py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
                            <th className="text-right py-3 font-medium text-gray-500 dark:text-gray-400">Orders</th>
                            <th className="text-right py-3 font-medium text-gray-500 dark:text-gray-400">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.sales.daily.map((d: any) => (
                            <tr key={d.date} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="py-3 dark:text-white">{new Date(d.date).toLocaleDateString('en-KE', { weekday: 'long', month: 'short', day: 'numeric' })}</td>
                              <td className="text-right py-3 dark:text-white">{d.orders}</td>
                              <td className="text-right py-3 font-medium dark:text-white">KES {d.sales.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="font-bold dark:text-white">
                            <td className="py-3">Total</td>
                            <td className="text-right py-3">{data.sales.count}</td>
                            <td className="text-right py-3">KES {data.sales.total.toLocaleString()}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-400 dark:text-gray-500 text-center py-8">No sales data for this period</p>
                  )}
                </div>
              )}

              {tab === 'expenses' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold dark:text-white mb-4">Expenses by Category</h2>
                    {data.expenses?.byCategory?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <canvas ref={expenseChartRef} height={250} />
                        <div className="space-y-3">
                          {data.expenses.byCategory.map((e: any) => (
                            <div key={e.category} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                              <span className="font-medium dark:text-white capitalize">{e.category}</span>
                              <span className="font-semibold dark:text-white">KES {e.amount.toLocaleString()}</span>
                            </div>
                          ))}
                          <div className="flex items-center justify-between p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl font-bold dark:text-white">
                            <span>Total</span>
                            <span>KES {data.expenses.total.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500 text-center py-8">No expenses recorded</p>
                    )}
                  </div>
                </div>
              )}

              {tab === 'products' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                  <h2 className="text-lg font-semibold dark:text-white mb-4">Top Selling Products</h2>
                  {data.topProducts?.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <canvas ref={productsChartRef} height={300} />
                      <div className="space-y-3">
                        {data.topProducts.map((p: any, i: number) => (
                          <div key={p.productId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-gray-400 dark:text-gray-500 w-6">#{i + 1}</span>
                              <span className="font-medium dark:text-white">{p.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-semibold dark:text-white">{p.quantity} sold</span>
                              <p className="text-xs text-gray-400 dark:text-gray-500">KES {p.revenue.toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400 dark:text-gray-500 text-center py-8">No product sales data</p>
                  )}
                </div>
              )}
            </>
          )}
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
  return { props: { role: session.user.role } }
}
