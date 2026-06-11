import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { ShoppingCart, MapPin, CreditCard, ChevronLeft, CheckCircle, Loader2, Phone, Building2, Clock, Receipt, ArrowLeft } from 'lucide-react'

interface CartItem {
  id: string
  name: string
  sellingPrice: number
  imageUrl?: string
  quantity: number
}

interface Product {
  id: string
  name: string
  sellingPrice: number
  imageUrl?: string
}

const locations = [
  { value: 'HOSTEL', label: 'Hostel', icon: Building2 },
  { value: 'CLASSROOM', label: 'Classroom', icon: Building2 },
  { value: 'LIBRARY', label: 'Library', icon: Building2 },
  { value: 'OFFICE', label: 'Office', icon: Building2 },
  { value: 'ROOM', label: 'Room', icon: Building2 },
  { value: 'GATE', label: 'Main Gate', icon: MapPin },
]

export default function Checkout() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [locationType, setLocationType] = useState('HOSTEL')
  const [locationDetails, setLocationDetails] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const router = useRouter()

  useEffect(() => {
    const stored = sessionStorage.getItem('cart')
    const storedPhone = sessionStorage.getItem('phone')
    if (stored) {
      const items = JSON.parse(stored)
      const productIds = Object.keys(items)
      if (productIds.length === 0) {
        router.push('/customer')
        return
      }
      fetch('/api/products')
        .then(res => {
          if (!res.ok) throw new Error('Failed to load products')
          return res.json()
        })
        .then((allProducts: Product[]) => {
          const enriched = productIds
            .map(id => {
              const p = allProducts.find((pr: Product) => pr.id === id)
              if (!p) return null
              return {
                id: p.id,
                name: p.name,
                sellingPrice: p.sellingPrice,
                imageUrl: p.imageUrl,
                quantity: items[id],
              }
            })
            .filter(Boolean) as CartItem[]
          if (enriched.length === 0) {
            router.push('/customer')
            return
          }
          setCart(enriched)
          setLoading(false)
        })
        .catch(() => {
          setError('Failed to load product details. Please try again.')
          setLoading(false)
        })
    } else {
      router.push('/customer')
    }
    if (storedPhone) setPhone(storedPhone)
  }, [router])

  const subtotal = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0)
  const deliveryFee = subtotal > 1000 ? 0 : 50
  const total = subtotal + deliveryFee

  const placeOrder = async () => {
    if (!locationDetails || !phone) {
      setError('Please fill in delivery location and phone number')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/customers/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({ productId: i.id, quantity: i.quantity })),
          paymentMethod,
          deliveryLocation: { type: locationType, details: locationDetails },
          deliveryNotes,
          phone,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        sessionStorage.removeItem('cart')
        setOrderNumber(data.orderNumber || data.id)
        setOrderPlaced(true)
      } else {
        setError(data.error || 'Failed to place order')
      }
    } catch {
      setError('Network error. Please try again.')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Head><title>Checkout - Danoscar Bite</title></Head>
        <div className="glass-card !p-8 flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Loading checkout...</p>
        </div>
      </div>
    )
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Head><title>Order Placed - Danoscar Bite</title></Head>
        <div className="glass-card !p-8 max-w-md w-full text-center animate-scale-in">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-success-500/20">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-heading mb-2">Order Placed!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Your order has been received and is being prepared.</p>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 mb-6">
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider mb-1">Order Number</p>
            <p className="text-xl font-bold text-primary-500 font-mono tracking-wider">{orderNumber}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 mb-6 justify-center">
            <Clock size={14} />
            <span>Estimated time: 15-25 minutes</span>
          </div>
          <Link href="/customer" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft size={16} />
            Back to Menu
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Head>
        <title>Checkout - Danoscar Bite</title>
      </Head>

      <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50">
        <div className="px-4 py-4 flex items-center">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white font-heading ml-2">Checkout</h1>
        </div>
      </header>

      <div className="p-4 max-w-2xl mx-auto space-y-4 pb-8">
        {error && (
          <div className="glass-card !p-4 bg-red-50/80 dark:bg-red-900/20 border-red-200 dark:border-red-800/30 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <span>{error}</span>
          </div>
        )}

        <div className="glass-card !p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
            <div className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-500">
              <Phone size={14} />
            </div>
            Contact
          </h2>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="input-premium text-sm"
            placeholder="07XX XXX XXX"
          />
        </div>

        <div className="glass-card !p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
            <div className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-500">
              <MapPin size={14} />
            </div>
            Delivery Details
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {locations.map(loc => {
              const isActive = locationType === loc.value
              const Icon = loc.icon
              return (
                <button
                  key={loc.value}
                  onClick={() => setLocationType(loc.value)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'gradient-primary text-white shadow-lg shadow-orange-500/20'
                      : 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-gray-100 dark:border-gray-700/30'
                  }`}
                >
                  <Icon size={16} className="mx-auto mb-1" />
                  {loc.label}
                </button>
              )
            })}
          </div>
          <input
            type="text"
            value={locationDetails}
            onChange={e => setLocationDetails(e.target.value)}
            className="input-premium text-sm"
            placeholder="e.g. Hostel B, Room 204"
          />
          <textarea
            value={deliveryNotes}
            onChange={e => setDeliveryNotes(e.target.value)}
            className="input-premium text-sm resize-none"
            rows={2}
            placeholder="Any special instructions..."
          />
        </div>

        <div className="glass-card !p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
            <div className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-500">
              <CreditCard size={14} />
            </div>
            Payment Method
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'CASH', label: 'Cash', icon: Receipt },
              { value: 'MPESA', label: 'M-Pesa', icon: CreditCard },
              { value: 'CARD', label: 'Card', icon: CreditCard },
              { value: 'PAY_ON_DELIVERY', label: 'Pay on Delivery', icon: MapPin },
            ].map(method => {
              const isActive = paymentMethod === method.value
              const Icon = method.icon
              return (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    isActive
                      ? 'gradient-primary text-white shadow-lg shadow-orange-500/20'
                      : 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-gray-100 dark:border-gray-700/30'
                  }`}
                >
                  <Icon size={16} />
                  {method.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="glass-card !p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm mb-4">
            <div className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-500">
              <ShoppingCart size={14} />
            </div>
            Order Summary
          </h2>
          {cart.length === 0 ? (
            <p className="text-gray-400 text-center py-6">Your cart is empty</p>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700/30 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-xs font-bold text-gray-500">
                      {item.quantity}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                      <p className="text-xs text-gray-400">x{item.quantity}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">KES {(item.sellingPrice * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="pt-3 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>KES {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>Delivery Fee</span>
                  <span className={deliveryFee === 0 ? 'text-success-500 font-medium' : ''}>
                    {deliveryFee === 0 ? 'Free' : `KES ${deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-gray-700/30">
                  <span>Total</span>
                  <span className="text-primary-500">KES {total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={placeOrder}
          disabled={submitting || cart.length === 0}
          className="btn-primary w-full !py-4 !rounded-2xl !text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
          {submitting ? 'Placing Order...' : `Place Order — KES ${total.toFixed(2)}`}
        </button>
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)
  if (!session || session.user.role !== 'CUSTOMER') {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    }
  }
  return { props: {} }
}
