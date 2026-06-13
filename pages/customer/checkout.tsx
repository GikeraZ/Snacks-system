import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {
  ShoppingCart, MapPin, CreditCard, ChevronLeft, CheckCircle,
  Loader2, Phone, Building2, Clock, Receipt, ArrowLeft, Smartphone, Copy
} from 'lucide-react'
import NotificationBell from '../../components/ui/NotificationBell'

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

interface ReceiptData {
  businessName: string
  orderNumber: string
  transactionCode: string
  amount: number
  phoneNumber: string
  items: { name: string; quantity: number; price: number; total: number }[]
  date: string
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
  const [mpesaPhone, setMpesaPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [processingMpesa, setProcessingMpesa] = useState(false)
  const [error, setError] = useState('')
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [copied, setCopied] = useState(false)
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null)
  const [pollError, setPollError] = useState('')
  const pollingRef = useRef(false)
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
  const deliveryFee = 0
  const total = subtotal + deliveryFee

  const placeOrder = async () => {
    if (!locationDetails || !phone) {
      setError('Please fill in delivery location and contact phone number')
      return
    }
    if (paymentMethod === 'MPESA' && !mpesaPhone) {
      setError('Please enter the M-Pesa phone number to pay with')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const orderRes = await fetch('/api/customers/orders', {
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
      const orderData = await orderRes.json()
      if (!orderRes.ok) {
        setError(orderData.error || 'Failed to place order')
        setSubmitting(false)
        return
      }

      setOrderNumber(orderData.orderNumber)

      if (paymentMethod === 'MPESA') {
        setSubmitting(false)
        setProcessingMpesa(true)
        setPollError('')

        const mpesaRes = await fetch('/api/payments/mpesa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderData.id,
            amount: total,
            phoneNumber: mpesaPhone,
          }),
        })
        const mpesaData = await mpesaRes.json()

        if (!mpesaRes.ok) {
          setError(mpesaData.error || 'M-Pesa payment failed')
          setProcessingMpesa(false)
          return
        }

        if (mpesaData.checkoutRequestId) {
          setPendingOrderId(orderData.id)
        } else {
          sessionStorage.removeItem('cart')
          setReceiptData(mpesaData.receipt)
          setProcessingMpesa(false)
          setOrderPlaced(true)
        }
      } else {
        sessionStorage.removeItem('cart')
        setSubmitting(false)
        setOrderPlaced(true)
      }
    } catch {
      setError('Network error. Please try again.')
      setSubmitting(false)
      setProcessingMpesa(false)
    }
  }

  useEffect(() => {
    if (!pendingOrderId) return

    pollingRef.current = true
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${pendingOrderId}`)
        if (!res.ok) return
        const order = await res.json()
        if (order.paymentStatus === 'COMPLETED' && order.mpesaReceipt) {
          clearInterval(interval)
          pollingRef.current = false
          sessionStorage.removeItem('cart')
          setReceiptData({
            businessName: 'Danoscar Bite',
            orderNumber: order.orderNumber,
            transactionCode: order.mpesaReceipt,
            amount: Number(order.totalAmount),
            phoneNumber: (order.delivery?.customerPhone || '').replace(/(\d{3})(\d{3})(\d{4})/, '$1****$3'),
            items: order.orderItems.map((i: { product: { name: string }; quantity: number; unitPrice: number }) => ({
              name: i.product.name,
              quantity: i.quantity,
              price: i.unitPrice,
              total: i.unitPrice * i.quantity,
            })),
            date: order.createdAt,
          })
          setProcessingMpesa(false)
          setPendingOrderId(null)
          setOrderPlaced(true)
        }
      } catch {
        setPollError('Connection issue. Retrying...')
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
  }, [pendingOrderId])

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

  if (processingMpesa) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Head><title>Processing Payment - Danoscar Bite</title></Head>
        <div className="glass-card !p-8 max-w-md w-full text-center animate-scale-in">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary-500/20">
            <Smartphone className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white font-heading mb-2">Check Your Phone</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            An M-Pesa payment prompt has been sent to <strong className="text-gray-900 dark:text-white">{mpesaPhone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')}</strong>
          </p>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">Waiting for confirmation...</p>
            </div>
            {pollError && (
              <p className="text-sm text-red-500 mb-2">{pollError}</p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500">
              1. Enter your M-Pesa PIN on your phone<br />
              2. Confirm the payment to <strong>Danoscar Bite</strong><br />
              3. Wait for confirmation
            </p>
          </div>
          {pollError && (
            <button
              onClick={() => {
                setPollError('')
                setPendingOrderId(pendingOrderId)
              }}
              className="w-full py-3 rounded-2xl text-sm font-semibold gradient-primary text-white shadow-lg shadow-orange-500/20 mb-3"
            >
              Retry
            </button>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-400">
            Amount: <strong className="text-gray-900 dark:text-white">KES {total.toFixed(2)}</strong>
          </p>
        </div>
      </div>
    )
  }

  if (orderPlaced) {
    if (receiptData) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Head><title>Receipt - Danoscar Bite</title></Head>
          <div className="glass-card !p-6 max-w-md w-full animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-success-500/20">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white font-heading">Payment Successful!</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">M-Pesa receipt</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 space-y-4">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-white font-heading">{receiptData.businessName}</p>
              </div>

              <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Order</span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-white">{receiptData.orderNumber}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Transaction Code</span>
                  <span className="font-mono font-semibold text-primary-500">{receiptData.transactionCode}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Phone</span>
                  <span className="font-mono text-gray-900 dark:text-white">{receiptData.phoneNumber}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Date</span>
                  <span className="text-gray-900 dark:text-white">{new Date(receiptData.date).toLocaleString('en-KE')}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Items</p>
                <div className="space-y-2">
                  {receiptData.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-gray-700 dark:text-gray-300">
                        {item.name} <span className="text-gray-400">x{item.quantity}</span>
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">KES {item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-3">
                <div className="flex justify-between font-bold text-gray-900 dark:text-white">
                  <span>Total Paid</span>
                  <span className="text-primary-500">KES {receiptData.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(receiptData.transactionCode).then(() => {
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  })
                }}
                className="w-full py-3 rounded-2xl text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Copy size={14} />
                {copied ? 'Copied!' : 'Copy Transaction Code'}
              </button>
              <Link
                href="/customer"
                className="w-full py-3 rounded-2xl text-sm font-semibold gradient-primary text-white shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} />
                Back to Menu
              </Link>
            </div>
          </div>
        </div>
      )
    }

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
    <div className="min-h-screen pt-16 lg:pt-0">
      <Head>
        <title>Checkout - Danoscar Bite</title>
      </Head>

      <header className="sticky top-16 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white font-heading ml-2">Checkout</h1>
          </div>
          <NotificationBell compact />
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

          {paymentMethod === 'MPESA' && (
            <div className="mt-3 p-4 rounded-2xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/20 space-y-3">
              <div className="flex items-center gap-2">
                <Smartphone size={16} className="text-green-600 dark:text-green-400" />
                <p className="text-sm font-semibold text-green-800 dark:text-green-300">M-Pesa Payment</p>
              </div>
              <p className="text-xs text-green-700 dark:text-green-400">
                Enter the phone number you will use to pay via M-Pesa. We will send a payment prompt to this number.
              </p>
              <input
                type="tel"
                value={mpesaPhone}
                onChange={e => setMpesaPhone(e.target.value)}
                className="input-premium text-sm !border-green-300 dark:!border-green-700 focus:!border-green-500"
                placeholder="e.g. 0712 345 678"
              />
            </div>
          )}
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
          disabled={submitting || processingMpesa || cart.length === 0}
          className="btn-primary w-full !py-4 !rounded-2xl !text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none flex items-center justify-center gap-2"
        >
          {submitting ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Placing Order...</>
          ) : paymentMethod === 'MPESA' ? (
            <>
              <Smartphone size={18} />
              Pay with M-Pesa — KES {total.toFixed(2)}
            </>
          ) : (
            `Place Order — KES ${total.toFixed(2)}`
          )}
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
