import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '@/lib/prisma'
import Head from 'next/head'
import { Users, Phone, Mail, Search } from 'lucide-react'
import { useState } from 'react'

interface CustomerInfo {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  referralCode: string | null
  loyaltyPoints: number
  isActive: boolean
  createdAt: string
  totalOrders: number
  totalSpent: number
}

interface Props {
  customers: CustomerInfo[]
  role: string
}

export default function CustomersPage({ customers }: Props) {
  const [search, setSearch] = useState('')

  const filtered = customers.filter((c) =>
    !search || [c.name, c.phone, c.email].some((f) => f?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <>
      <Head><title>Customers - Danoscar Bite</title></Head>
      <div className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{customers.length} registered accounts</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
            />
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="p-4 font-medium">Name</th>
                    <th className="p-4 font-medium">Phone</th>
                    <th className="p-4 font-medium hidden md:table-cell">Email</th>
                    <th className="p-4 font-medium hidden sm:table-cell">Orders</th>
                    <th className="p-4 font-medium hidden sm:table-cell">Total Spent</th>
                    <th className="p-4 font-medium hidden lg:table-cell">Points</th>
                    <th className="p-4 font-medium hidden lg:table-cell">Joined</th>
                    <th className="p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-b border-gray-50 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                            <Users className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">{c.name || 'Unnamed'}</span>
                            {c.referralCode && (
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 block">Ref: {c.referralCode}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-300">
                        <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gray-400" />{c.phone || '-'}</span>
                      </td>
                      <td className="p-4 text-gray-500 dark:text-gray-400 hidden md:table-cell">
                        {c.email ? (
                          <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-gray-400" />{c.email}</span>
                        ) : '-'}
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-300 hidden sm:table-cell">{c.totalOrders}</td>
                      <td className="p-4 text-gray-600 dark:text-gray-300 hidden sm:table-cell font-medium">KES {c.totalSpent.toLocaleString()}</td>
                      <td className="p-4 text-gray-500 dark:text-gray-400 hidden lg:table-cell">{c.loyaltyPoints}</td>
                      <td className="p-4 text-gray-500 dark:text-gray-400 hidden lg:table-cell text-xs">
                        {new Date(c.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          c.isActive
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                        }`}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center shadow-sm">
            <Users className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
              {search ? 'No customers match your search' : 'No customers yet'}
            </h2>
            <p className="text-gray-400 dark:text-gray-500">
              {search ? 'Try a different search term.' : 'Customers will appear here once they create accounts.'}
            </p>
          </div>
        )}
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)
  if (!session || !session.user || session.user.role !== 'SUPER_ADMIN') {
    return { redirect: { destination: '/auth/login', permanent: false } }
  }

  const users = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    orderBy: { createdAt: 'desc' },
    include: {
      orders: {
        select: { totalAmount: true },
      },
    },
  })

  const customers = users.map((u) => ({
    id: u.id,
    name: u.name,
    phone: u.phone,
    email: u.email,
    referralCode: u.referralCode,
    loyaltyPoints: u.loyaltyPoints,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
    totalOrders: u.orders.length,
    totalSpent: u.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
  }))

  return {
    props: { customers, role: session.user.role },
  }
}
