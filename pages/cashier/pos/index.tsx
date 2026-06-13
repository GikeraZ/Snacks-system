import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '@/lib/prisma'
import { useState, useMemo, useEffect, useRef } from 'react'
import Head from 'next/head'
import {
  ShoppingCart, Plus, Minus, Trash2, Search, Smartphone,
  CreditCard, DollarSign, Loader2, CheckCircle, X, Printer,
  Copy, Coffee, Users, Phone, ChevronRight, Banknote,
} from 'lucide-react'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  sellingPrice: number
  imageUrl?: string
  stockQuantity: number
  category: { id: string; name: string }
}

interface Category {
  id: string
  name: string
}

interface CartItem {
  productId: string
  name: string
  sellingPrice: number
  quantity: number
}

interface ReceiptData {
  orderNumber: string
  totalAmount: number
  paymentMethod: string
  items: { name: string; quantity: number; unitPrice: number; totalPrice: number }[]
  customerPhone: string
  cashier: string
  amountPaid: number
  change: number
  createdAt: string
  transactionCode?: string
}

interface Props {
  products: Product[]
  categories: Category[]
  role: string
}

export default function POSPage({ products, categories, role }: Props) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [amountPaid, setAmountPaid] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [processingMpesa, setProcessingMpesa] = useState(false)
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null)
  const [pollTick, setPollTick] = useState(0)
  const [pollError, setPollError] = useState('')
  const pollingRef = useRef(false)
  const [copied, setCopied] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (receipt) {
      const timer = setTimeout(() => {
        setCart([])
        setCustomerPhone('')
        setAmountPaid('')
        setPaymentMethod('CASH')
        setReceipt(null)
      }, 30000)
      return () => clearTimeout(timer)
    }
  }, [receipt])

  useEffect(() => {
    if (!pendingOrderId) return

    pollingRef.current = true
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${pendingOrderId}`)
        if (!res.ok) return
        const order = await res.json()
        if (order.paymentStatus === 'COMPLETED') {
          clearInterval(interval)
          pollingRef.current = false
          setProcessingMpesa(false)
          setPendingOrderId(null)
          setReceipt({
            orderNumber: order.orderNumber,
            totalAmount: Number(order.totalAmount),
            paymentMethod: 'MPESA',
            items: order.orderItems.map((i: { product: { name: string }; quantity: number; unitPrice: number; totalPrice: number }) => ({
              name: i.product.name,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              totalPrice: i.totalPrice,
            })),
            customerPhone: order.delivery?.customerPhone || '',
            cashier: order.customer?.name || '',
            amountPaid: Number(order.totalAmount),
            change: 0,
            createdAt: order.createdAt,
            transactionCode: order.mpesaReceipt,
          })
        }
      } catch {
        setPollError('Connection issue. Tap refresh to retry.')
      }
    }, 3000)

    const timeout = setTimeout(() => {
      if (pollingRef.current) {
        clearInterval(interval)
        pollingRef.current = false
        setProcessingMpesa(false)
        setPendingOrderId(null)
        setPollError('Payment timed out. Please try again.')
      }
    }, 120000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
      pollingRef.current = false
    }
  }, [pendingOrderId, pollTick])

  const retryPoll = () => {
    setPollError('')
    setPollTick(t => t + 1)
  }

  const filteredProducts = useMemo(() => {
    let filtered = products
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category.id === selectedCategory)
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q))
    }
    return filtered
  }, [products, selectedCategory, searchTerm])

  const cartTotal = useMemo(() =>
    cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0),
    [cart]
  )

  const cartCount = useMemo(() =>
    cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  )

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id)
      if (existing) {
        if (existing.quantity >= product.stockQuantity) return prev
        return prev.map(i =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        sellingPrice: product.sellingPrice,
        quantity: 1,
      }]
    })
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      const item = prev.find(i => i.productId === productId)
      if (!item) return prev
      const newQty = item.quantity + delta
      if (newQty <= 0) return prev.filter(i => i.productId !== productId)
      const product = products.find(p => p.id === productId)
      if (product && newQty > product.stockQuantity) return prev
      return prev.map(i =>
        i.productId === productId ? { ...i, quantity: newQty } : i
      )
    })
  }

  const removeItem = (productId: string) => {
    setCart(prev => prev.filter(i => i.productId !== productId))
  }

  const changeDue = useMemo(() => {
    if (paymentMethod !== 'CASH' || !amountPaid) return 0
    return Math.max(0, Number(amountPaid) - cartTotal)
  }, [amountPaid, cartTotal, paymentMethod])

  const handlePlaceOrder = async () => {
    if (!customerPhone || cart.length === 0) {
      setError('Add items and enter customer phone number')
      return
    }
    if (paymentMethod === 'CASH' && Number(amountPaid) < cartTotal) {
      setError('Amount paid must be at least the total')
      return
    }
    if (paymentMethod === 'MPESA' && !customerPhone) {
      setError('Enter customer phone number for M-Pesa')
      return
    }

    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/cashier/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({ productId: i.productId, quantity: i.quantity })),
          paymentMethod,
          customerPhone,
          amountPaid: paymentMethod === 'CASH' ? Number(amountPaid) : cartTotal,
          change: changeDue,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create order')
        setSubmitting(false)
        return
      }

      if (paymentMethod === 'MPESA') {
        setSubmitting(false)
        setProcessingMpesa(true)
        setPollError('')

        const mpesaRes = await fetch('/api/payments/mpesa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: data.id,
            amount: cartTotal,
            phoneNumber: customerPhone,
          }),
        })

        const mpesaData = await mpesaRes.json()
        if (!mpesaRes.ok) {
          setError(mpesaData.error || 'M-Pesa payment failed')
          setProcessingMpesa(false)
          return
        }

        if (mpesaData.checkoutRequestId) {
          setPendingOrderId(data.id)
        } else {
          setProcessingMpesa(false)
          setReceipt({
            ...data,
            transactionCode: mpesaData.mpesaReceipt,
          })
        }
      } else {
        setSubmitting(false)
        setReceipt({ ...data, transactionCode: undefined })
      }
    } catch {
      setError('Network error. Please try again.')
      setSubmitting(false)
      setProcessingMpesa(false)
    }
  }

  const newSale = () => {
    setCart([])
    setCustomerPhone('')
    setAmountPaid('')
    setPaymentMethod('CASH')
    setReceipt(null)
    setError('')
    setShowConfirm(false)
  }

  if (processingMpesa) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <Head><title>M-Pesa - Danoscar Bite POS</title></Head>
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border border-gray-100 dark:border-gray-700">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-500/20">
            <Smartphone className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white font-heading mb-2">M-Pesa STK Push Sent</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            A payment prompt has been sent to <strong className="text-gray-900 dark:text-white">{customerPhone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')}</strong>
          </p>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">Waiting for customer to enter PIN...</p>
            </div>
            {pollError && (
              <p className="text-sm text-red-500 mb-3">{pollError}</p>
            )}
            <div className="text-left space-y-2 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary-600 dark:text-primary-400">1</span>
                </div>
                <span>Check the customer&apos;s phone for M-Pesa prompt</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary-600 dark:text-primary-400">2</span>
                </div>
                <span>Customer enters their M-Pesa PIN</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary-600 dark:text-primary-400">3</span>
                </div>
                <span>Confirmation will appear automatically</span>
              </div>
            </div>
          </div>
          {pollError && (
            <button
              onClick={retryPoll}
              className="w-full py-3 rounded-2xl text-sm font-semibold gradient-primary text-white shadow-lg shadow-orange-500/20 mb-3"
            >
              Retry
            </button>
          )}
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-white">KES {cartTotal.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">Amount to pay</p>
          </div>
        </div>
      </div>
    )
  }

  if (receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <Head><title>Receipt - Danoscar Bite POS</title></Head>
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 max-w-md w-full border border-gray-100 dark:border-gray-700 animate-scale-in">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white font-heading">
              {paymentMethod === 'MPESA' ? 'Payment Successful!' : 'Sale Complete!'}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">POS Transaction Receipt</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-5 space-y-3">
            <div className="text-center border-b border-dashed border-gray-200 dark:border-gray-700 pb-3 mb-2">
              <p className="text-base font-bold text-gray-900 dark:text-white">Danoscar Bite</p>
              <p className="text-[10px] text-gray-400">Point of Sale Receipt</p>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Order</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">{receipt.orderNumber}</span>
              </div>
              {receipt.transactionCode && (
                <div className="flex justify-between">
                  <span className="text-gray-400">M-Pesa Code</span>
                  <span className="font-mono font-semibold text-primary-500">{receipt.transactionCode}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Phone</span>
                <span className="font-mono text-gray-900 dark:text-white">{receipt.customerPhone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Cashier</span>
                <span className="text-gray-900 dark:text-white">{receipt.cashier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Date</span>
                <span className="text-gray-900 dark:text-white">
                  {new Date(receipt.createdAt).toLocaleString('en-KE')}
                </span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Items</p>
              <div className="space-y-1.5">
                {receipt.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-gray-700 dark:text-gray-300">
                      {item.name} <span className="text-gray-400">x{item.quantity}</span>
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">KES {item.totalPrice.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-3 space-y-1">
              <div className="flex justify-between text-sm font-bold text-gray-900 dark:text-white">
                <span>Total</span>
                <span className="text-primary-500">KES {receipt.totalAmount.toFixed(2)}</span>
              </div>
              {receipt.paymentMethod === 'CASH' && (
                <>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Amount Paid</span>
                    <span>KES {receipt.amountPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-green-600 dark:text-green-400 font-medium">
                    <span>Change</span>
                    <span>KES {receipt.change.toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-[10px] text-gray-400 pt-1">
                <span>Payment</span>
                <span>{receipt.paymentMethod}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {receipt.transactionCode && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(receipt.transactionCode!)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="w-full py-3 rounded-2xl text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
              >
                <Copy size={14} />
                {copied ? 'Copied!' : 'Copy Transaction Code'}
              </button>
            )}
            <button
              onClick={newSale}
              className="w-full py-3 rounded-2xl text-sm font-semibold gradient-primary text-white shadow-lg shadow-orange-500/20 hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              New Sale
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head><title>Point of Sale - Danoscar Bite</title></Head>
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/20">
              <Coffee size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white">Point of Sale</h1>
              <p className="text-xs text-gray-400">{cartCount} items | KES {cartTotal.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/cashier/orders" className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
              Orders <ChevronRight size={12} />
            </Link>
          </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Products area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Category pills */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-3 py-2 flex-shrink-0 overflow-x-auto scrollbar-hide">
              <div className="flex gap-1.5">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    !selectedCategory
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  All Items
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-primary-500 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-3 py-2 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Product grid */}
            <div className="flex-1 overflow-y-auto p-3">
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {filteredProducts.map(product => {
                    const inCart = cart.find(i => i.productId === product.id)
                    return (
                      <button
                        key={product.id}
                        onClick={() => addToCart(product)}
                        disabled={product.stockQuantity === 0}
                        className={`relative bg-white dark:bg-gray-800 rounded-xl border p-3 text-left transition-all hover:shadow-md active:scale-95 ${
                          product.stockQuantity === 0
                            ? 'border-red-200 dark:border-red-800/50 opacity-50 cursor-not-allowed'
                            : inCart
                              ? 'border-primary-300 dark:border-primary-600 shadow-sm shadow-primary-100 dark:shadow-primary-900/20'
                              : 'border-gray-100 dark:border-gray-700'
                        }`}
                      >
                        {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
                          <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[9px] font-medium rounded-full">
                            {product.stockQuantity} left
                          </span>
                        )}
                        {product.stockQuantity === 0 && (
                          <span className="absolute top-1 right-1 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[9px] font-medium rounded-full">
                            Out
                          </span>
                        )}
                        <div className="w-full h-16 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center mb-2 text-xl">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <Coffee size={24} className="text-gray-400" />
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-900 dark:text-white leading-tight line-clamp-2">{product.name}</p>
                        <p className="text-sm font-bold text-primary-600 dark:text-primary-400 mt-1">KES {product.sellingPrice.toLocaleString()}</p>
                        {inCart && (
                          <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-primary-500 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                            {inCart.quantity}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                  <div className="text-center">
                    <Coffee size={40} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{searchTerm ? 'No products match your search' : selectedCategory ? 'No products in this category' : 'No products available'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cart sidebar */}
          <div className="lg:w-96 bg-white dark:bg-gray-800 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShoppingCart size={16} className="text-primary-500" />
                Cart ({cartCount} items)
              </h2>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {cart.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                  <div className="text-center">
                    <ShoppingCart size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Click products to add them</p>
                  </div>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.productId} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-xl px-3 py-2">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                      <p className="text-[11px] text-gray-400">KES {item.sellingPrice.toLocaleString()} each</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => updateQuantity(item.productId, -1)}
                        className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 flex items-center justify-center transition-colors"
                      >
                        <Minus size={12} className="text-gray-600 dark:text-gray-300" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-gray-900 dark:text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, 1)}
                        className="w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-900/50 flex items-center justify-center transition-colors"
                      >
                        <Plus size={12} className="text-primary-600 dark:text-primary-400" />
                      </button>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center ml-1 transition-colors"
                      >
                        <Trash2 size={12} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Checkout section */}
            <div className="border-t border-gray-100 dark:border-gray-700 p-4 space-y-3 flex-shrink-0">
              {error && (
                <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2.5 rounded-xl border border-red-100 dark:border-red-800/30">
                  {error}
                </div>
              )}

              {/* Customer phone */}
              <div>
                <label className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 block">Customer Phone</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="0712 345 678"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Payment method */}
              <div>
                <label className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5 block">Payment Method</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { value: 'CASH', label: 'Cash', icon: Banknote },
                    { value: 'MPESA', label: 'M-Pesa', icon: Smartphone },
                    { value: 'CARD', label: 'Card', icon: CreditCard },
                  ].map(method => {
                    const isActive = paymentMethod === method.value
                    const Icon = method.icon
                    return (
                      <button
                        key={method.value}
                        onClick={() => setPaymentMethod(method.value)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? 'gradient-primary text-white shadow-sm'
                            : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-100 dark:border-gray-600'
                        }`}
                      >
                        <Icon size={14} />
                        {method.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Cash amount paid */}
              {paymentMethod === 'CASH' && (
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 block">Amount Paid</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      value={amountPaid}
                      onChange={e => setAmountPaid(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                    />
                  </div>
                  {changeDue > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                      Change due: KES {changeDue.toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              {/* Total and Place Order */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">KES {cartTotal.toLocaleString()}</span>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  disabled={submitting || cart.length === 0 || !customerPhone}
                  className="w-full py-3 rounded-2xl text-sm font-bold text-white gradient-primary shadow-lg shadow-orange-500/20 hover:shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 disabled:hover:shadow-none"
                >
                  {submitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Processing...</>
                  ) : paymentMethod === 'MPESA' ? (
                    <><Smartphone size={16} /> Pay with M-Pesa</>
                  ) : (
                    <><CheckCircle size={16} /> Complete Sale</>
                  )}
                </button>
              </div>
            </div>
          </div>
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

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { name: 'asc' },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return {
    props: {
      products: JSON.parse(JSON.stringify(products)),
      categories: JSON.parse(JSON.stringify(categories)),
      role: session.user.role,
    },
  }
}
