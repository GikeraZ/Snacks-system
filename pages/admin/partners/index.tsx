import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '@/lib/prisma'
import { useState } from 'react'
import Head from 'next/head'
import { Handshake, Users, ShoppingBag, Search, ToggleLeft, ToggleRight, DollarSign } from 'lucide-react'

interface PartnerData {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  isActive: boolean
  totalRevenue: number
  totalOrders: number
  createdAt: string
}

interface Props {
  partners: PartnerData[]
  role: string
}

export default function AdminPartners({ partners: initialPartners, role }: Props) {
  const [partners, setPartners] = useState(initialPartners)
  const [search, setSearch] = useState('')
  const [toggling, setToggling] = useState<string | null>(null)

  const filtered = search
    ? partners.filter(p =>
        (p.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (p.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.phone || '').includes(search)
      )
    : partners

  const toggleActive = async (id: string, current: boolean) => {
    setToggling(id)
    try {
      const res = await fetch('/api/admin/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !current }),
      })
      if (res.ok) {
        setPartners(prev => prev.map(p => p.id === id ? { ...p, isActive: !current } : p))
      }
    } catch {}
    setToggling(null)
  }

  const activeCount = partners.filter(p => p.isActive).length
  const totalRevenue = partners.reduce((s, p) => s + p.totalRevenue, 0)

  return (
    <>
      <Head><title>Partners - Danoscar Bite</title></Head>
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold dark:text-white">Business Partners</h1>
          <span className="text-sm text-gray-400">{activeCount} active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                <Handshake className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-2xl font-bold dark:text-white">{partners.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Partners</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-900/20">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-2xl font-bold dark:text-white">KES {totalRevenue.toLocaleString()}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold dark:text-white">{activeCount}/{partners.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Partners</p>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search partners..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
          />
        </div>

        {filtered.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="p-3 font-medium">Partner</th>
                    <th className="p-3 font-medium hidden sm:table-cell">Contact</th>
                    <th className="p-3 font-medium hidden md:table-cell">Orders</th>
                    <th className="p-3 font-medium text-right hidden md:table-cell">Revenue</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <Handshake className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{p.name || 'Unnamed'}</span>
                        </div>
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                        <p className="text-sm">{p.email || '-'}</p>
                        <p className="text-xs text-gray-400">{p.phone || '-'}</p>
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-300 hidden md:table-cell">{p.totalOrders}</td>
                      <td className="p-3 text-right font-medium text-gray-900 dark:text-white hidden md:table-cell">KES {p.totalRevenue.toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${
                          p.isActive
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => toggleActive(p.id, p.isActive)}
                          disabled={toggling === p.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                            p.isActive
                              ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'
                              : 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40'
                          }`}
                        >
                          {toggling === p.id ? (
                            <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : p.isActive ? (
                            <><ToggleRight size={14} /> Deactivate</>
                          ) : (
                            <><ToggleLeft size={14} /> Activate</>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <Handshake size={48} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">{search ? 'No partners match your search' : 'No business partners yet'}</p>
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

  const partners = await prisma.user.findMany({
    where: { role: 'BUSINESS_PARTNER' },
    orderBy: { createdAt: 'desc' },
    include: {
      orders: { select: { totalAmount: true } },
    },
  })

  const mappedPartners = partners.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    isActive: u.isActive,
    totalRevenue: u.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
    totalOrders: u.orders.length,
    createdAt: u.createdAt.toISOString(),
  }))

  return {
    props: {
      partners: JSON.parse(JSON.stringify(mappedPartners)),
      role: session.user.role,
    },
  }
}
