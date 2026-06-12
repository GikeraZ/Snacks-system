import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '../../lib/prisma'
import { useState, useMemo, useRef, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Coffee, Search, Plus, Minus, Heart, Clock, MapPin,
  Bike, ShoppingBag, ChefHat, Sparkles, X, Star,
  LogOut, User, ChevronDown
} from 'lucide-react'
import HeroBanner from '../../components/customer/HeroBanner'
import FloatingCart from '../../components/customer/FloatingCart'
import LoyaltyBadge from '../../components/customer/LoyaltyBadge'
import BottomNav from '../../components/layout/BottomNav'
import NotificationBell from '../../components/ui/NotificationBell'

interface CustomerMenuProps {
  role: string
  categories: Array<{
    id: string
    name: string
    products: Array<{
      id: string
      name: string
      description?: string
      sellingPrice: number
      imageUrl?: string
      stockQuantity: number
      preparationTime?: number
      categoryId?: string
    }>
  }>
}

const categoryIcons: Record<string, string> = {
  Burgers: '🍔',
  Chips: '🍟',
  Smokies: '🌭',
  Sausages: '🌭',
  Samosas: '🥟',
  Chapati: '🫓',
  Mandazi: '🥯',
  Tea: '🫖',
  Coffee: '☕',
  Juice: '🧃',
  Soda: '🥤',
  Water: '💧',
  Milkshakes: '🥤',
  'Special Meals': '🍱',
}

export default function CustomerMenu({ role, categories }: CustomerMenuProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [favorites, setFavorites] = useState<string[]>([])
  const [showCartDrawer, setShowCartDrawer] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('favorites')
      if (stored) setFavorites(JSON.parse(stored))
    } catch {}
    setHydrated(true)
  }, [])
  const [searchFocused, setSearchFocused] = useState(false)
  const router = useRouter()
  const searchRef = useRef<HTMLInputElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const allProducts = useMemo(
    () => categories.flatMap(cat => cat.products),
    [categories]
  )

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

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => {
      const next = prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
      try { localStorage.setItem('favorites', JSON.stringify(next)) } catch {}
      return next
    })
  }

  const filteredCategories = useMemo(() =>
    categories
      .map(cat => ({
        ...cat,
        products: selectedCategory
          ? cat.products.filter(p => cat.id === selectedCategory && p.name.toLowerCase().includes(searchTerm.toLowerCase()))
          : cat.products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
      }))
      .filter(cat => selectedCategory ? cat.id === selectedCategory : cat.products.length > 0),
    [categories, selectedCategory, searchTerm]
  )

  const searchSuggestions = useMemo(() => {
    if (searchTerm.length < 1) return []
    return allProducts
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 5)
  }, [searchTerm, allProducts])

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)
  const cartTotal = useMemo(() =>
    Object.entries(cart).reduce((total, [id, qty]) => {
      const p = allProducts.find(pr => pr.id === id)
      return total + (p ? p.sellingPrice * qty : 0)
    }, 0),
    [cart, allProducts]
  )

  const cartItems = useMemo(() =>
    Object.entries(cart)
      .map(([id, qty]) => {
        const p = allProducts.find(pr => pr.id === id)
        return p ? { ...p, quantity: qty } : null
      })
      .filter(Boolean) as (typeof allProducts[0] & { quantity: number })[],
    [cart, allProducts]
  )

  const productGridClass = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4'

  const activeOrder = {
    status: 'PREPARING',
    orderNumber: '#1248',
    estimatedTime: '12 min',
  }

  return (
    <>
      <Head><title>Danoscar Bite — Campus Delivery</title></Head>
      <div className="min-h-screen page-container pt-16 lg:pt-0">
        {/* Header */}
        <header className="sticky top-16 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/20">
                  <Coffee size={22} className="text-white" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-gray-900 dark:text-white font-heading leading-tight">Danoscar Bite</h1>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium flex items-center gap-1">
                    <Bike size={11} className="text-primary-500" />
                    Delivered in under 15 min
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <NotificationBell compact />
                <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-xl border border-amber-200/50 dark:border-amber-700/30">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  120 pts
                </button>
                <div ref={userMenuRef} className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1"
                  >
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      C
                    </div>
                    <ChevronDown size={12} className={`text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                      <Link
                        href="/customer/profile"
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User size={16} className="text-gray-400" />
                        Profile
                      </Link>
                      <button
                        onClick={() => { sessionStorage.clear(); router.push('/auth/logout') }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-50 dark:border-gray-700/50"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="relative mt-3">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchRef}
                type="search"
                placeholder="Search burgers, chips, drinks..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-100 dark:bg-gray-800 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-700 transition-all text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <X size={14} className="text-gray-400" />
                </button>
              )}

              {/* Search Suggestions */}
              <AnimatePresence>
                {searchFocused && searchTerm.length > 0 && searchSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-100 dark:border-gray-700 overflow-hidden z-40"
                  >
                    {searchSuggestions.map(product => (
                      <button
                        key={product.id}
                        onClick={() => { setSearchTerm(product.name); searchRef.current?.blur() }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-xs">
                          {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover rounded-lg" /> : '🍽️'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
                          <p className="text-[11px] text-gray-400">KES {product.sellingPrice}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto pb-32 lg:pb-16">
          {/* Hero Banner */}
          <HeroBanner />

          {/* Loyalty Points (mobile) */}
          <div className="sm:hidden">
            <LoyaltyBadge points={120} />
          </div>

          {/* Active Delivery Tracking */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mt-4 p-4 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/50 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Bike size={16} className="text-primary-500" />
                Active Order
              </h3>
              <span className="text-xs text-gray-400">{activeOrder.orderNumber}</span>
            </div>
            <div className="flex items-center justify-between gap-1">
              {[
                { icon: Clock, label: 'Received', done: true },
                { icon: ChefHat, label: 'Preparing', done: true },
                { icon: Bike, label: 'Delivery', done: false },
                { icon: MapPin, label: 'Delivered', done: false },
              ].map((step, idx) => (
                <div key={step.label} className="flex flex-col items-center gap-1.5 flex-1">
                  <div className={`relative flex items-center justify-center w-full`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step.done
                        ? 'bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-md shadow-primary-500/20'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-500'
                    }`}>
                      <step.icon size={14} />
                    </div>
                    {idx < 3 && (
                      <div className={`absolute left-[calc(50%+16px)] top-1/2 h-0.5 w-[calc(100%-32px)] ${
                        idx < 2 ? 'bg-gradient-to-r from-primary-400 to-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`} />
                    )}
                  </div>
                  <span className={`text-[9px] font-medium ${
                    step.done ? 'text-primary-500' : 'text-gray-400'
                  }`}>{step.label}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-3 text-center">
              Estimated {activeOrder.estimatedTime} remaining
            </p>
          </motion.div>

          {/* Categories */}
          <div className="px-4 mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900 dark:text-white font-heading">Categories</h2>
              <button className="text-xs font-medium text-primary-500 hover:text-primary-600 transition-colors">
                View All
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory('')}
                className={`flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl w-[80px] transition-all ${
                  !selectedCategory
                    ? 'bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-lg shadow-primary-500/20'
                    : 'bg-white dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700/50 shadow-sm hover:border-primary-200'
                }`}
              >
                <span className="text-2xl">🔥</span>
                <span className="text-[10px] font-bold whitespace-nowrap">All</span>
              </motion.button>
              {categories.map(cat => (
                <motion.button
                  key={cat.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(cat.id === selectedCategory ? '' : cat.id)}
                  className={`flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl w-[80px] transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-lg shadow-primary-500/20'
                      : 'bg-white dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700/50 shadow-sm hover:border-primary-200'
                  }`}
                >
                  <span className="text-2xl">{categoryIcons[cat.name] || '🍽️'}</span>
                  <span className="text-[10px] font-bold whitespace-nowrap">{cat.name}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="px-4 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 dark:text-white font-heading">
                {selectedCategory
                  ? categories.find(c => c.id === selectedCategory)?.name || 'Menu'
                  : 'Popular Items'}
              </h2>
              <span className="text-xs text-gray-400">{allProducts.length} items</span>
            </div>

            <div className={productGridClass}>
              <AnimatePresence mode="popLayout">
                {filteredCategories.map(cat =>
                  cat.products.map((product, idx) => {
                    const qty = cart[product.id] || 0
                    const isFav = favorites.includes(product.id)
                    return (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3, delay: (idx % 4) * 0.05 }}
                        className="group bg-white dark:bg-gray-800/90 rounded-3xl overflow-hidden shadow-sm hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-gray-100/50 dark:border-gray-700/30 transition-all duration-300 hover:-translate-y-1"
                      >
                        {/* Image */}
                        <div className="relative h-44 sm:h-48 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Coffee size={40} className="text-gray-300 dark:text-gray-600" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          {/* Favorite Button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id) }}
                            className="absolute top-3 right-3 p-2 rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm hover:scale-110 active:scale-90 transition-all duration-200 z-10"
                          >
                            <Heart
                              size={16}
                              className={`transition-colors ${
                                isFav ? 'fill-red-500 text-red-500' : 'text-gray-400'
                              }`}
                            />
                          </button>

                          {/* Prep Time Badge */}
                          {product.preparationTime && product.preparationTime > 0 && (
                            <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium flex items-center gap-1">
                              <Clock size={10} />
                              {product.preparationTime} min
                            </div>
                          )}

                          {/* Low Stock Badge */}
                          {product.stockQuantity > 0 && product.stockQuantity < 5 && (
                            <div className="absolute bottom-3 left-3 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold rounded-full shadow-lg flex items-center gap-1">
                              <Sparkles size={10} />
                              {product.stockQuantity} left
                            </div>
                          )}

                          {/* Sold Out Overlay */}
                          {product.stockQuantity === 0 && (
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
                              <span className="px-4 py-2 bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white text-sm font-bold rounded-xl">
                                Sold Out
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-4">
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm font-heading line-clamp-1">{product.name}</h3>
                          {product.description && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">{product.description}</p>
                          )}
                          <div className="flex items-center justify-between mt-3">
                            <div>
                              <span className="text-base font-bold text-gray-900 dark:text-white font-heading">
                                KES {product.sellingPrice.toLocaleString()}
                              </span>
                            </div>
                            {product.stockQuantity > 0 && (
                              qty > 0 ? (
                                <div className="flex items-center gap-1 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 rounded-xl p-0.5">
                                  <button
                                    onClick={() => removeFromCart(product.id)}
                                    className="p-1.5 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-lg hover:scale-105 active:scale-95 transition-all shadow-sm shadow-primary-500/20"
                                  >
                                    <Minus size={14} />
                                  </button>
                                  <span className="text-sm font-bold text-primary-700 dark:text-primary-300 min-w-[28px] text-center">{qty}</span>
                                  <button
                                    onClick={() => addToCart(product.id)}
                                    className="p-1.5 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-lg hover:scale-105 active:scale-95 transition-all shadow-sm shadow-primary-500/20"
                                  >
                                    <Plus size={14} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToCart(product.id)}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-primary-500 to-primary-600 text-white text-xs font-bold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 hover:scale-105 active:scale-95 transition-all shadow-md shadow-primary-500/15"
                                >
                                  <ShoppingBag size={14} />
                                  Add
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </AnimatePresence>
            </div>

            {/* Empty State */}
            {filteredCategories.every(c => c.products.length === 0) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <Search size={32} className="text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-lg font-semibold">No items found</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Try a different search or category</p>
                <button
                  onClick={() => { setSearchTerm(''); setSelectedCategory('') }}
                  className="mt-4 px-5 py-2 bg-gradient-to-br from-primary-500 to-primary-600 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  Reset Filters
                </button>
              </motion.div>
            )}
          </div>
        </main>

        {/* Cart Drawer */}
        <AnimatePresence>
          {showCartDrawer && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCartDrawer(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col"
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white font-heading">Your Cart</h3>
                  <button
                    onClick={() => setShowCartDrawer(false)}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {cartItems.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingBag size={48} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                      <p className="text-gray-400 font-medium">Your cart is empty</p>
                    </div>
                  ) : (
                    cartItems.map(item => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50"
                      >
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 overflow-hidden flex-shrink-0">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Coffee size={20} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{item.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">KES {item.sellingPrice.toLocaleString()} each</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-sm font-bold text-gray-900 dark:text-white min-w-[20px] text-center">{item.quantity}</span>
                          <button
                            onClick={() => addToCart(item.id)}
                            className="p-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
                {cartItems.length > 0 && (
                  <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="font-bold text-gray-900 dark:text-white">KES {cartTotal.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => {
                        sessionStorage.setItem('cart', JSON.stringify(cart))
                        router.push('/customer/checkout')
                      }}
                      className="w-full py-3.5 bg-gradient-to-br from-primary-500 to-primary-600 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      Checkout — KES {cartTotal.toFixed(2)}
                    </button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Floating Cart */}
        <FloatingCart
          count={cartCount}
          total={cartTotal}
          onViewCart={() => setShowCartDrawer(true)}
        />
      </div>

      <BottomNav role={role} />
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)
  const allCategories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      products: {
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      },
    },
    orderBy: { name: 'asc' },
  })
  return {
    props: {
      role: session?.user?.role || 'CUSTOMER',
      categories: JSON.parse(JSON.stringify(allCategories)),
    },
  }
}
