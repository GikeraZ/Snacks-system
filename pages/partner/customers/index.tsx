import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '@/lib/prisma'
import { useState } from 'react'
import Head from 'next/head'
import { Users, Search, Phone, Mail, ShoppingBag } from 'lucide-react'

interface CustomerData {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  totalOrders: number
  totalSpent: number
  createdAt: string
}

interface Props {
  customers: CustomerData[]
  role: string
}

export default function PartnerCustomers({ customers, role }: Props) {
  const [search, setSearch] = useState('')

  const filtered = search
    ? customers.filter(c =>
        (c.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (c.phone || '').includes(search)
      )
    : customers

  return (
    <>
      <Head><title>Customers - Danoscar Bite</title></Head>
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold dark:text-white">Customers</h1>
          <span className="text-sm text-gray-400">{customers.length} total</span>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customers..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
          />
        </div>

        {filtered.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="p-3 font-medium">Name</th>
                    <th className="p-3 font-medium hidden sm:table-cell">Phone</th>
                    <th className="p-3 font-medium hidden md:table-cell">Email</th>
                    <th className="p-3 font-medium">Orders</th>
                    <th className="p-3 font-medium text-right">Total Spent</th>
                    <th className="p-3 font-medium hidden lg:table-cell">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{c.name || 'Unnamed'}</span>
                        </div>
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                        <span className="flex items-center gap-1">
                          <Phone size={12} className="text-gray-400" />
                          {c.phone || '-'}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">
                        <span className="flex items-center gap-1">
                          <Mail size={12} className="text-gray-400" />
                          {c.email || '-'}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">{c.totalOrders}</td>
                      <td className="p-3 text-right font-medium text-gray-900 dark:text-white">KES {c.totalSpent.toLocaleString()}</td>
                      <td className="p-3 text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                        {new Date(c.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <Users size={48} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">{search ? 'No customers match your search' : 'No customers yet'}</p>
          </div>
        )}
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)
  if (!session || !session.user || session.user.role !== 'BUSINESS_PARTNER') {
    return { redirect: { destination: '/auth/login', permanent: false } }
  }

  const customers = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    orderBy: { createdAt: 'desc' },
    include: {
      orders: { select: { totalAmount: true } },
    },
  })

  const mappedCustomers = customers.map(u => ({
    id: u.id,
    name: u.name,
    phone: u.phone,
    email: u.email,
    totalOrders: u.orders.length,
    totalSpent: u.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
    createdAt: u.createdAt.toISOString(),
  }))

  return {
    props: {
      customers: JSON.parse(JSON.stringify(mappedCustomers)),
      role: session.user.role,
    },
  }
}
