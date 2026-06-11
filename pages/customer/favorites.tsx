import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, ChevronLeft, ShoppingBag, Plus, Minus, ArrowRight, Trash2, Clock } from 'lucide-react'
import BottomNav from '../../components/layout/BottomNav'

interface Product {
  id: string
  name: string
  description?: string
  sellingPrice: number
  imageUrl?: string
  stockQuantity: number
  preparationTime?: number
}

export default function CustomerFavorites() {
  const [favorites, setFavorites] = useState<string[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<Record<string, number>>({})
  const [hydrated, setHydrated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    try {
      const stored = localStorage.getItem('favorites')
      if (stored) setFavorites(JSON.parse(stored))
    } catch {}
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (favorites.length === 0) {
      setLoading(false)
      return
    }
    fetch('/api/products')
      .then(res => res.json())
      .then((all: Product[]) => {
        const filtered = all.filter(p => favorites.includes(p.id))
        setProducts(filtered)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [hydrated, favorites])

  const removeFavorite = (productId: string) => {
    const next = favorites.filter(id => id !== productId)
    setFavorites(next)
    try { localStorage.setItem('favorites', JSON.stringify(next)) } catch {}
  }

  const addToCart = (productId: string) => {
    setCart(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }))
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const next = { ...prev }
      if (next[productId] <= 1) delete next[productId]
      else next[productId]--
      return next
    })
  }

  const checkout = () => {
    sessionStorage.setItem('cart', JSON.stringify(cart))
    router.push('/customer/checkout')
  }

  return (
    <>
      <Head><title>My Favorites - Danoscar Bite</title></Head>

      <div className="page-container min-h-screen">
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50">
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white font-heading ml-2">My Favorites</h1>
            </div>
            {Object.keys(cart).length > 0 && (
              <button
                onClick={checkout}
                className="btn-primary !py-2 !px-4 !text-sm !rounded-xl"
              >
                Cart ({Object.values(cart).reduce((a, b) => a + b, 0)})
              </button>
            )}
          </div>
        </header>

        <div className="p-4 max-w-2xl mx-auto pb-24">
          {loading && (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="glass-card !p-0 animate-pulse overflow-hidden">
                  <div className="h-36 bg-gray-200 dark:bg-gray-700" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && favorites.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card !p-10 text-center"
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/10 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-10 w-10 text-red-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white font-heading mb-2">No favorites yet</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                Tap the heart icon on any product to save it here for quick access.
              </p>
              <Link href="/customer" className="btn-primary inline-flex items-center gap-2 !rounded-2xl">
                Browse Menu
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          )}

          {!loading && products.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {products.map((product, idx) => {
                const qty = cart[product.id] || 0
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="glass-card !p-0 overflow-hidden group hover:shadow-card-hover transition-all"
                  >
                    <div className="relative h-36 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
                      {product.imageUrl && (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      <button
                        onClick={() => removeFavorite(product.id)}
                        className="absolute top-2 right-2 p-2 rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-900 transition-all shadow-sm"
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                      {product.preparationTime && (
                        <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium flex items-center gap-1">
                          <Clock size={10} />
                          {product.preparationTime} min
                        </div>
                      )}
                    </div>
                    <div className="p-3 space-y-2">
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white leading-tight line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 line-clamp-1">
                        {product.description || 'Danoscar Bite'}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <p className="font-bold text-primary-500 text-sm">
                          KES {product.sellingPrice.toFixed(2)}
                        </p>
                        {product.stockQuantity > 0 ? (
                          qty > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => removeFromCart(product.id)}
                                className="w-7 h-7 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                              >
                                <Minus size={12} className="text-gray-600 dark:text-gray-300" />
                              </button>
                              <span className="text-xs font-bold text-gray-900 dark:text-white w-4 text-center">{qty}</span>
                              <button
                                onClick={() => addToCart(product.id)}
                                className="w-7 h-7 rounded-xl bg-primary-500 flex items-center justify-center hover:bg-primary-600 transition-colors"
                              >
                                <Plus size={12} className="text-white" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(product.id)}
                              className="w-7 h-7 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-500 flex items-center justify-center hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-all"
                            >
                              <Plus size={14} />
                            </button>
                          )
                        ) : (
                          <span className="text-[10px] font-medium text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                            Sold Out
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <BottomNav role="CUSTOMER" />
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)
  if (!session || session.user.role !== 'CUSTOMER') {
    return { redirect: { destination: '/auth/login', permanent: false } }
  }
  return { props: {} }
}
