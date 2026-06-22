import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/lib/ThemeContext'
import Layout from '@/components/layout/Layout'
import ErrorBoundary from '@/components/ErrorBoundary'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import '@/styles/globals.css'

function FaviconLoader() {
  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        const r = data?.receipt
        if (r?.faviconUrl) {
          const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
          if (link) link.href = r.faviconUrl.startsWith('data:') ? r.faviconUrl : `/api/logo/favicon`
        }
        if (r?.logoUrl) {
          const apple = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')
          if (apple) apple.href = `/api/logo/logo`
        }
      })
      .catch(() => {})
  }, [])
  return null
}

function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
    }
  }, [])
  return null
}

function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice
    if (result.outcome === 'accepted') {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 max-w-md mx-auto animate-slide-up">
      <div className="glass-card !p-4 flex items-center gap-3 bg-gradient-to-br from-primary-500 to-primary-600 text-white border-0 shadow-2xl">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">Install Hot Take</p>
          <p className="text-xs text-white/80">Add to your home screen for a better experience</p>
        </div>
        <button
          onClick={handleInstall}
          className="px-4 py-2 bg-white text-primary-600 rounded-xl text-sm font-bold hover:bg-white/90 transition-all active:scale-95"
        >
          Install
        </button>
        <button
          onClick={() => setShowPrompt(false)}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const router = useRouter()

  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        <FaviconLoader />
        <PWARegister />
        <PWAInstallPrompt />
        <Layout>
          <ErrorBoundary>
          <AnimatePresence mode="wait">
            <motion.div
              key={router.asPath}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              <Component {...pageProps} />
            </motion.div>
          </AnimatePresence>
          </ErrorBoundary>
        </Layout>
      </ThemeProvider>
    </SessionProvider>
  )
}
