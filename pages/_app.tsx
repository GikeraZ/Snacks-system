import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/lib/ThemeContext'
import Layout from '@/components/layout/Layout'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
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

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const router = useRouter()

  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        <FaviconLoader />
        <PWARegister />
        <Layout>
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
        </Layout>
      </ThemeProvider>
    </SessionProvider>
  )
}
