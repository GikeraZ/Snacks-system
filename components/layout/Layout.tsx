import type { ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import { useRouter } from 'next/router'

interface LayoutProps {
  children: ReactNode
}

const authPaths = ['/auth/login', '/auth/register', '/auth/logout', '/auth/unauthorized', '/_error']
const publicPaths = ['/']
const customerPaths = ['/customer']

export default function Layout({ children }: LayoutProps) {
  const { data: session } = useSession()
  const router = useRouter()

  const isAuthPage = authPaths.some(p => router.pathname.startsWith(p))
  const isPublicPage = publicPaths.includes(router.pathname)
  const isCustomerPage = customerPaths.some(p => router.pathname.startsWith(p))

  if (isAuthPage || isPublicPage || isCustomerPage) {
    return <>{children}</>
  }

  const role = session?.user?.role as string

  return (
    <div className="page-container">
      <Sidebar role={role} />
      <div className="lg:pl-64 transition-all duration-300">
        <main className="content-area">
          {children}
        </main>
      </div>
      <BottomNav role={role} />
    </div>
  )
}
