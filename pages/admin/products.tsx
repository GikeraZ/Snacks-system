import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '../../lib/prisma'
import { useState, useRef } from 'react'
import Head from 'next/head'

import { Plus, Edit2, Trash2, Package, X, ImageUp, Loader2, Search } from 'lucide-react'

interface ProductsPageProps {
  categories: Array<{ id: string; name: string }>
  initialProducts: Array<{
    id: string
    name: string
    slug: string
    imageUrl: string | null
    description: string | null
    category: { id: string; name: string }
    sellingPrice: number
    costPrice: number
    stockQuantity: number
    isActive: boolean
  }>
  role: string
}

export default function ProductsPage({ categories, initialProducts, role }: ProductsPageProps) {
  const [products, setProducts] = useState(initialProducts)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', description: '', categoryId: categories[0]?.id || '', sellingPrice: '', costPrice: '', stockQuantity: '0', imageUrl: '', imageData: '' })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category?.name.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', description: '', categoryId: categories[0]?.id || '', sellingPrice: '', costPrice: '', stockQuantity: '0', imageUrl: '', imageData: '' })
    setImagePreview(null)
    setShowModal('add')
    setError('')
  }

  const openEdit = (product: any) => {
    setEditing(product)
    setForm({
      name: product.name,
      description: product.description || '',
      categoryId: product.category.id,
      sellingPrice: product.sellingPrice.toString(),
      costPrice: product.costPrice.toString(),
      stockQuantity: product.stockQuantity.toString(),
      imageUrl: product.imageUrl || '',
      imageData: '',
    })
    setImagePreview(product.imageUrl || null)
    setShowModal('edit')
    setError('')
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 4 * 1024 * 1024) {
      setError('Image too large. Maximum 4MB.')
      return
    }

    setUploading(true)
    try {
      const imageData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
      })

      setImagePreview(imageData)

      if (editing?.id) {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: imageData, fileName: file.name, productId: editing.id }),
        })
        const data = await res.json()
        if (res.ok) setForm(prev => ({ ...prev, imageUrl: data.url }))
        else setError(data.error || 'Upload failed')
      } else {
        setForm(prev => ({ ...prev, imageData }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
    setUploading(false)
  }

  const handleSave = async () => {
    setError('')
    if (!form.name || !form.categoryId || !form.sellingPrice) {
      setError('Name, category, and selling price are required')
      return
    }

    setSaving(true)
    try {
      const url = '/api/products'
      const method = showModal === 'add' ? 'POST' : 'PUT'
      const body: any = {
        ...form,
        sellingPrice: parseFloat(form.sellingPrice),
        costPrice: parseFloat(form.costPrice) || 0,
        stockQuantity: parseInt(form.stockQuantity) || 0,
      }
      if (showModal === 'edit') body.id = editing.id

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (res.ok) {
        setShowModal(null)
        window.location.reload()
      } else {
        setError(data.error || 'Failed to save product')
      }
    } catch { setError('Network error') }
    setSaving(false)
  }

  const toggleActive = async (product: any) => {
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, isActive: !product.isActive }),
      })
      if (res.ok) window.location.reload()
    } catch { /* ignore */ }
  }

  return (
    <>
      <Head><title>Products - Danoscar Bite</title></Head>
      <div>
        <div className="p-4 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Products</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your menu items</p>
            </div>
            <button onClick={openAdd} className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-sm font-medium">
              <Plus className="h-5 w-5" /> Add Product
            </button>
          </div>

          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">{search ? 'No products match your search' : 'No products yet'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(product => (
                <div key={product.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all group">
                  <div className="h-40 bg-gray-50 dark:bg-gray-800/50 relative overflow-hidden">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button onClick={() => openEdit(product)} className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors">
                        <Edit2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      </button>
                    </div>
                    <div className={`absolute top-2 left-2 px-2 py-1 text-xs font-medium rounded-full ${
                      product.isActive ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{product.name}</h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{product.category.name}</p>
                      </div>
                    </div>
                    {product.description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{product.description}</p>}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-700">
                      <div>
                        <p className="text-lg font-bold text-primary-600 dark:text-primary-400">KES {product.sellingPrice}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Cost: KES {product.costPrice}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          product.stockQuantity > 10 ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : product.stockQuantity > 0 ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                        }`}>
                          {product.stockQuantity} in stock
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold dark:text-white">{showModal === 'add' ? 'Add Product' : 'Edit Product'}</h2>
              <button onClick={() => setShowModal(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="h-5 w-5" /></button>
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl">{error}</div>}

            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 p-4 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl">
                {imagePreview ? (
                  <div className="relative w-full max-h-48 overflow-hidden rounded-lg">
                    <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                    <button onClick={() => { setImagePreview(null); setForm(prev => ({ ...prev, imageUrl: '' })) }}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <ImageUp className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Upload product image</p>
                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      Choose Image
                    </button>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                {uploading && <p className="text-sm text-primary-600 dark:text-primary-400"><Loader2 className="h-4 w-4 inline animate-spin mr-1" />Uploading...</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                  <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Selling Price *</label>
                  <input type="number" step="0.01" value={form.sellingPrice} onChange={e => setForm({ ...form, sellingPrice: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cost Price</label>
                  <input type="number" step="0.01" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock Quantity</label>
                  <input type="number" value={form.stockQuantity} onChange={e => setForm({ ...form, stockQuantity: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(null)} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving || uploading}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium">
                {saving ? 'Saving...' : showModal === 'add' ? 'Add Product' : 'Save Changes'}
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

  const [categories, initialProducts] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.product.findMany({
      select: {
        id: true, name: true, slug: true, imageUrl: true, description: true,
        sellingPrice: true, costPrice: true, stockQuantity: true, isActive: true,
        category: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    }),
  ])

  return {
    props: {
      categories,
      initialProducts: JSON.parse(JSON.stringify(initialProducts)),
      role: session.user.role,
    },
  }
}
