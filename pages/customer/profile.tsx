import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '../../lib/prisma'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, ChevronLeft, Gift, Phone, Mail, MapPin,
  LogOut, Award, Star, TrendingUp, Shield, Save,
  Lock, Pencil, CheckCircle, X, Loader2, Eye, EyeOff,
  Settings, Home, Clock
} from 'lucide-react'
import BottomNav from '../../components/layout/BottomNav'
import NotificationBell from '../../components/ui/NotificationBell'

interface Props {
  loyaltyPoints: number
  totalSpent: number
  totalOrders: number
}

export default function CustomerProfile({ loyaltyPoints, totalSpent, totalOrders }: Props) {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  const role = session?.user?.role || 'CUSTOMER'
  const user = session?.user

  const [tab, setTab] = useState<'profile' | 'settings'>(
    router.query.tab === 'settings' ? 'settings' : 'profile'
  )
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [address, setAddress] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)

  useEffect(() => {
    fetch('/api/customers/profile')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setName(data.user.name || '')
          setEmail(data.user.email || '')
          setPhone(data.user.phone || '')
        }
        if (data.customer) {
          setAddress(data.customer.address || '')
        }
        setLoadingProfile(false)
      })
      .catch(() => setLoadingProfile(false))
  }, [])

  const handleSaveProfile = async () => {
    setSaving(true)
    setMessage('')
    try {
      const body: Record<string, unknown> = { name, email, phone, address }
      if (newPassword) {
        body.currentPassword = currentPassword
        body.newPassword = newPassword
      }
      const res = await fetch('/api/customers/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        setMessageType('success')
        setMessage('Profile updated successfully!')
        setCurrentPassword('')
        setNewPassword('')
        updateSession()
      } else {
        setMessageType('error')
        setMessage(data.error || 'Failed to update profile')
      }
    } catch {
      setMessageType('error')
      setMessage('Network error. Please try again.')
    }
    setSaving(false)
    setTimeout(() => setMessage(''), 4000)
  }

  if (loadingProfile) {
    return (
      <>
        <Head><title>Profile - Hot Take</title></Head>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      </>
    )
  }

  return (
    <>
      <Head><title>{tab === 'profile' ? 'Profile' : 'Account Settings'} - Hot Take</title></Head>

      <div className="page-container min-h-screen pt-16 lg:pt-0">
        <header className="sticky top-16 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50">
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white font-heading ml-2">
                {tab === 'profile' ? 'My Profile' : 'Account Settings'}
              </h1>
            </div>
            <NotificationBell compact />
          </div>
        </header>

        <div className="p-4 max-w-2xl mx-auto space-y-4 pb-24">
          {/* Tab Switcher */}
          <div className="flex gap-2 bg-gray-100 dark:bg-gray-800/50 rounded-2xl p-1">
            <button
              onClick={() => setTab('profile')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === 'profile'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <User size={16} className="inline mr-1.5" />
              Profile
            </button>
            <button
              onClick={() => setTab('settings')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === 'settings'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Settings size={16} className="inline mr-1.5" />
              Settings
            </button>
          </div>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3.5 rounded-2xl text-sm font-medium flex items-center gap-2 ${
                messageType === 'success'
                  ? 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300 border border-success-200 dark:border-success-800/30'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30'
              }`}
            >
              {messageType === 'success' ? <CheckCircle size={16} /> : <X size={16} />}
              {message}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {tab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card !p-6 text-center"
                >
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/20">
                    <span className="text-4xl font-bold text-white font-heading">
                      {(user?.name || 'C')[0].toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white font-heading">{user?.name || 'Customer'}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Hot Take</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="glass-card !p-5"
                >
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-500">
                      <User size={14} />
                    </div>
                    Account Info
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/30">
                      <Mail size={16} className="text-gray-400 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Email</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.email || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/30">
                      <Phone size={16} className="text-gray-400 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Phone</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.phone || '—'}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass-card !p-5"
                >
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-lg bg-success-50 dark:bg-success-900/20 text-success-500">
                      <Gift size={14} />
                    </div>
                    Loyalty & Rewards
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/10 text-center">
                      <Star size={20} className="text-primary-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-primary-500 font-heading">
                        {loyaltyPoints}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Points</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10 text-center">
                      <TrendingUp size={20} className="text-purple-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-purple-500 font-heading">{totalOrders}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Orders</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="glass-card !p-5"
                >
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500">
                      <MapPin size={14} />
                    </div>
                    Saved Address
                  </h3>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/30">
                    <MapPin size={16} className="text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Default Delivery</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{address || 'Campus Area'}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <button
                    onClick={() => { sessionStorage.clear(); router.push('/auth/logout') }}
                    className="w-full py-3.5 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/10 text-red-500 dark:text-red-400 font-bold text-sm rounded-2xl border border-red-200 dark:border-red-800/30 hover:from-red-100 hover:to-red-200 dark:hover:from-red-900/30 dark:hover:to-red-800/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </motion.div>

                <p className="text-center text-xs text-gray-400 dark:text-gray-500 pt-2">
                  Hot Take v1.0
                </p>
              </motion.div>
            )}

            {tab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card !p-5 space-y-4"
                >
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-500">
                      <Pencil size={14} />
                    </div>
                    Edit Profile
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="input-premium text-sm"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="input-premium text-sm"
                        placeholder="your@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="input-premium text-sm"
                        placeholder="07XX XXX XXX"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Delivery Address</label>
                      <input
                        type="text"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        className="input-premium text-sm"
                        placeholder="e.g. Hostel B, Room 204"
                      />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="glass-card !p-5 space-y-4"
                >
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-500">
                      <Lock size={14} />
                    </div>
                    Change Password
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Current Password</label>
                      <div className="relative">
                        <input
                          type={showCurrent ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={e => setCurrentPassword(e.target.value)}
                          className="input-premium text-sm pr-10"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrent(!showCurrent)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">New Password</label>
                      <div className="relative">
                        <input
                          type={showNew ? 'text' : 'password'}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          className="input-premium text-sm pr-10"
                          placeholder="Min. 8 characters"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew(!showNew)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    {newPassword && newPassword.length > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <div className={`h-1.5 rounded-full flex-1 ${newPassword.length >= 6 ? 'bg-success-500' : 'bg-gray-200 dark:bg-gray-600'}`} />
                        <div className={`h-1.5 rounded-full flex-1 ${newPassword.length >= 8 ? 'bg-success-500' : 'bg-gray-200 dark:bg-gray-600'}`} />
                        <div className={`h-1.5 rounded-full flex-1 ${newPassword.length >= 12 ? 'bg-success-500' : 'bg-gray-200 dark:bg-gray-600'}`} />
                        <span className={`ml-1 font-medium ${newPassword.length >= 8 ? 'text-success-500' : 'text-gray-400'}`}>
                          {newPassword.length < 6 ? 'Weak' : newPassword.length < 8 ? 'Fair' : 'Strong'}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="w-full py-3.5 bg-gradient-to-br from-primary-500 to-primary-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <><Loader2 size={16} className="animate-spin" /> Saving...</>
                  ) : (
                    <><Save size={16} /> Save Changes</>
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <BottomNav role={role} />
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)
  if (!session || session.user.role !== 'CUSTOMER') {
    return { redirect: { destination: '/auth/login', permanent: false } }
  }

  const [userData, orderData] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { loyaltyPoints: true },
    }),
    prisma.order.findMany({
      where: { customerId: session.user.id },
      select: { totalAmount: true },
    }),
  ])

  return {
    props: {
      loyaltyPoints: userData?.loyaltyPoints ?? 0,
      totalSpent: orderData.reduce((s, o) => s + Number(o.totalAmount), 0),
      totalOrders: orderData.length,
    },
  }
}
