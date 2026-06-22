import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '../../lib/prisma'
import { useState } from 'react'
import Head from 'next/head'
import { AlertTriangle, Package, Plus, X, Loader2, Search } from 'lucide-react'


interface InventoryPageProps {
  ingredients: Array<{
    id: string
    name: string
    unit: string
    costPerUnit: number
    stockQuantity: number
    lowStockAlert: number
  }>
  totalValue: number
  lowStockCount: number
  role: string
}

export default function InventoryPage({ ingredients, totalValue, lowStockCount, role }: InventoryPageProps) {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', unit: 'kg', costPerUnit: '', stockQuantity: '', lowStockAlert: '10' })

  const filtered = ingredients.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = async () => {
    if (!form.name || !form.costPerUnit) { setError('Name and cost are required'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          costPerUnit: parseFloat(form.costPerUnit),
          stockQuantity: parseFloat(form.stockQuantity) || 0,
          lowStockAlert: parseFloat(form.lowStockAlert) || 10,
        }),
      })
      if (res.ok) window.location.reload()
      else { const d = await res.json(); setError(d.error || 'Failed') }
    } catch { setError('Network error') }
    setSaving(false)
  }

  return (
    <>
      <Head><title>Inventory - Hot Take</title></Head>
      <div>
        <div className="p-4 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Inventory</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your ingredients and stock levels</p>
            </div>
            <button onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-sm font-medium">
              <Plus className="h-5 w-5" /> Add Ingredient
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Items</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{ingredients.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Value</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">KES {totalValue.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Low Stock Items</p>
              <p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {lowStockCount} {lowStockCount > 0 ? <AlertTriangle className="h-5 w-5 inline" /> : null}
              </p>
            </div>
          </div>

          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input type="text" placeholder="Search ingredients..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">No ingredients found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(ingredient => {
                const isLowStock = Number(ingredient.stockQuantity) <= Number(ingredient.lowStockAlert)
                return (
                  <div key={ingredient.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-2.5 rounded-xl ${isLowStock ? 'bg-red-50 dark:bg-red-900/20' : 'bg-primary-50 dark:bg-primary-900/20'}`}>
                        <Package className={`h-5 w-5 ${isLowStock ? 'text-red-500 dark:text-red-400' : 'text-primary-600 dark:text-primary-400'}`} />
                      </div>
                      {isLowStock && <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{ingredient.name}</h3>
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className={`text-2xl font-bold ${isLowStock ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{ingredient.stockQuantity}</span>
                      <span className="text-sm text-gray-400 dark:text-gray-500">{ingredient.unit}</span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-700">
                      <span className="text-sm text-gray-500 dark:text-gray-400">KES {ingredient.costPerUnit}/{ingredient.unit}</span>
                      {isLowStock && <span className="text-xs text-red-500 dark:text-red-400 font-medium">Low stock</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold dark:text-white">Add Ingredient</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit</label>
                  <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                    <option value="pcs">pieces</option>
                    <option value="pkt">packets</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cost per Unit (KES) *</label>
                  <input type="number" step="0.01" value={form.costPerUnit} onChange={e => setForm({ ...form, costPerUnit: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock Quantity</label>
                  <input type="number" step="0.01" value={form.stockQuantity} onChange={e => setForm({ ...form, stockQuantity: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Low Stock Alert</label>
                  <input type="number" step="0.01" value={form.lowStockAlert} onChange={e => setForm({ ...form, lowStockAlert: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50">Cancel</button>
              <button onClick={handleAdd} disabled={saving}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 font-medium">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin inline mr-1" /> Adding...</> : 'Add Ingredient'}
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

  const ingredients = await prisma.ingredient.findMany({ orderBy: { name: 'asc' } })
  const totalValue = ingredients.reduce((s, i) => s + Number(i.costPerUnit) * Number(i.stockQuantity), 0)
  const lowStockCount = ingredients.filter(i => Number(i.stockQuantity) <= Number(i.lowStockAlert)).length

  return {
    props: {
      ingredients: JSON.parse(JSON.stringify(ingredients)),
      totalValue,
      lowStockCount,
      role: session.user.role,
    },
  }
}
