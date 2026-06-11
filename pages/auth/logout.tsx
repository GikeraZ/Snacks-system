import { useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import { Loader2 } from 'lucide-react'

export default function Logout() {
  const router = useRouter()

  useEffect(() => {
    signOut({ redirect: false }).then(() => {
      router.push('/auth/login')
    })
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
        <p className="text-gray-600">Signing out...</p>
      </div>
    </div>
  )
}
