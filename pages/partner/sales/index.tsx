import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import Head from 'next/head'

import { DollarSign } from 'lucide-react'

interface Props { role: string }

export default function Page({ role }: Props) {
  return (
    <>
      
      <Head><title>Sales - Danoscar Bite</title></Head>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Sales</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-12 text-center">
          <DollarSign className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">Coming Soon</h2>
          <p className="text-gray-400 dark:text-gray-500">This feature is under development.</p>
        </div>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)
  if (!session || !session.user || session.user.role !== 'BUSINESS_PARTNER') {
    return { redirect: { destination: '/auth/login', permanent: false } }
  }
  return { props: { role: session.user.role } }
}
