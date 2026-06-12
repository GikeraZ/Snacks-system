import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  User, ChevronLeft, Gift, Phone, Mail, MapPin,
  LogOut, Award, Star, TrendingUp, Shield
} from 'lucide-react'
import BottomNav from '../../components/layout/BottomNav'
import NotificationBell from '../../components/ui/NotificationBell'

export default function CustomerProfile() {
  const { data: session } = useSession()
  const router = useRouter()
  const role = session?.user?.role || 'CUSTOMER'
  const user = session?.user

  return (
    <>
      <Head><title>Profile - Danoscar Bite</title></Head>

      <div className="page-container min-h-screen pt-16 lg:pt-0">
        <header className="sticky top-16 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50">
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white font-heading ml-2">My Profile</h1>
            </div>
            <NotificationBell compact />
          </div>
        </header>

        <div className="p-4 max-w-2xl mx-auto space-y-4 pb-24">
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
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Danoscar Bite</p>
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
                  {(user as any)?.loyaltyPoints ?? 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Points</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10 text-center">
                <TrendingUp size={20} className="text-purple-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-purple-500 font-heading">Silver</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Tier</p>
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
                <Shield size={14} />
              </div>
              Saved Addresses
            </h3>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/30">
              <MapPin size={16} className="text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Default Delivery</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Campus Area</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <button
              onClick={() => {
                sessionStorage.clear()
                router.push('/auth/logout')
              }}
              className="w-full py-3.5 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/10 text-red-500 dark:text-red-400 font-bold text-sm rounded-2xl border border-red-200 dark:border-red-800/30 hover:from-red-100 hover:to-red-200 dark:hover:from-red-900/30 dark:hover:to-red-800/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </motion.div>

          <p className="text-center text-xs text-gray-400 dark:text-gray-500 pt-2">
            Danoscar Bite v1.0
          </p>
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
  return { props: {} }
}
