import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '../../lib/prisma'
import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import { Plus, DollarSign, X, Loader2, TrendingDown, Search } from 'lucide-react'

import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const EXPENSE_CATEGORIES = ['RENT', 'ELECTRICITY', 'WATER', 'SALARIES', 'INTERNET', 'MARKETING', 'TRANSPORT', 'PURCHASES', 'MAINTENANCE', 'MISCELLANEOUS']

const CATEGORY_COLORS: Record<string, string> = {
  RENT: '#ef4444', ELECTRICITY: '#f97316', WATER: '#3b82f6', SALARIES: '#8b5cf6',
  INTERNET: '#06b6d4', MARKETING: '#ec4899', TRANSPORT: '#eab308', PURCHASES: '#22c55e',
  MAINTENANCE: '#6366f1', MISCELLANEOUS: '#6b7280',
}

interface ExpenseItem {
  id: string; category: string; amount: number; description?: string; date: string; user?: { name: string | null }
}

interface ExpensesPageProps { expenses: ExpenseItem[]; monthlyTotal: number; categoryTotals: { category: string; amount: number }[]; role: string }

export default function ExpensesPage({ expenses, monthlyTotal, categoryTotals, role }: ExpensesPageProps) {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ category: 'MISCELLANEOUS', amount: '', description: '', date: new Date().toISOString().slice(0, 10) })
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!chartRef.current || categoryTotals.length === 0) return
    if (chartInstance.current) chartInstance.current.destroy()

    const ctx = chartRef.current.getContext('2d')
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: categoryTotals.map(c => c.category),
          datasets: [{
            data: categoryTotals.map(c => c.amount),
            backgroundColor: categoryTotals.map(c => CATEGORY_COLORS[c.category] || '#6b7280'),
            borderWidth: 0,
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true } } },
        },
      })
    }
    return () => { if (chartInstance.current) chartInstance.current.destroy() }
  }, [categoryTotals])

  const filtered = expenses.filter(e =>
    !search || e.category.toLowerCase().includes(search.toLowerCase()) || e.description?.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) { setError('Enter a valid amount'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      })
      if (res.ok) { window.location.reload() }
      else { const d = await res.json(); setError(d.error || 'Failed') }
    } catch { setError('Network error') }
    setSaving(false)
  }

  return (
    <>
      <Head><title>Expenses - Danoscar Bite</title></Head>
      <div>
        <div className="p-4 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Expenses</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Track and manage your business expenses</p>
            </div>
            <button onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-sm font-medium">
              <Plus className="h-5 w-5" /> Add Expense
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl"><TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" /></div>
                <span className="text-sm text-gray-500 dark:text-gray-400">This Month</span>
              </div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">KES {monthlyTotal.toLocaleString()}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{expenses.length} entries</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm md:col-span-2">
              {categoryTotals.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {categoryTotals.slice(0, 5).map(ct => (
                    <div key={ct.category} className="text-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{ct.category.toLowerCase()}</p>
                      <p className="text-sm font-bold dark:text-white">KES {ct.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-400 dark:text-gray-500 text-center py-4">No expenses this month</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
              <h2 className="text-sm font-semibold dark:text-white mb-3">Expense Breakdown</h2>
              {categoryTotals.length > 0 ? <canvas ref={chartRef} height={250} /> : <p className="text-gray-400 dark:text-gray-500 text-center py-8 text-sm">No data</p>}
            </div>
            <div className="lg:col-span-2">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input type="text" placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Category</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Amount</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Description</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-8 text-gray-400 dark:text-gray-500">No expenses found</td></tr>
                      ) : filtered.map(expense => (
                        <tr key={expense.id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap dark:text-white">{new Date(expense.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2.5 py-1 text-xs font-medium rounded-full" style={{
                              backgroundColor: `${CATEGORY_COLORS[expense.category] || '#6b7280'}20`,
                              color: CATEGORY_COLORS[expense.category] || '#6b7280',
                            }}>
                              {expense.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right font-semibold dark:text-white">KES {expense.amount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell max-w-[200px] truncate">{expense.description || '-'}</td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">{expense.user?.name || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold dark:text-white">Add Expense</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (KES)</label>
                <input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50">Cancel</button>
              <button onClick={handleAdd} disabled={saving}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 font-medium">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin inline mr-1" /> Saving...</> : 'Add Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)
  if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'BUSINESS_PARTNER')) {
    return { redirect: { destination: '/auth/login', permanent: false } }
  }

  const expenses = await prisma.expense.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { date: 'desc' },
  })

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const monthExpenses = expenses.filter(e => new Date(e.date) >= monthStart)
  const monthlyTotal = monthExpenses.reduce((s, e) => s + Number(e.amount), 0)

  const categoryMap = new Map<string, number>()
  for (const e of monthExpenses) {
    categoryMap.set(e.category, (categoryMap.get(e.category) || 0) + Number(e.amount))
  }
  const categoryTotals = Array.from(categoryMap.entries()).map(([category, amount]) => ({ category, amount }))

  return {
    props: {
      expenses: JSON.parse(JSON.stringify(expenses)),
      monthlyTotal,
      categoryTotals,
      role: session.user.role,
    },
  }
}
