import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Head from 'next/head'

import { Users, Plus, Edit2, Trash2, X, UserPlus, Shield, Search } from 'lucide-react'

const ROLE_BADGES: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400',
  CASHIER: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400',
  KITCHEN_STAFF: 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400',
  DELIVERY: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400',
  BUSINESS_PARTNER: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-400',
}

const ROLE_OPTIONS = ['SUPER_ADMIN', 'CASHIER', 'KITCHEN_STAFF', 'DELIVERY', 'BUSINESS_PARTNER']

interface Employee {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  role: string
  isActive: boolean
  createdAt: string
}

interface Props {
  role: string
}

export default function EmployeesPage({ role }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState<'add' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'CASHIER' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/admin/employees')
      if (res.ok) {
        const data = await res.json()
        setEmployees(data)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { fetchEmployees() }, [])

  const openEdit = (emp: Employee) => {
    setEditing(emp)
    setForm({ name: emp.name || '', email: emp.email || '', phone: emp.phone || '', password: '', role: emp.role })
    setShowModal('edit')
    setError('')
  }

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', email: '', phone: '', password: '', role: 'CASHIER' })
    setShowModal('add')
    setError('')
  }

  const handleSave = async () => {
    setError('')
    if (!form.name || !form.phone) { setError('Name and phone are required'); return }
    if (showModal === 'add' && form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (form.phone.length < 10) { setError('Phone must be at least 10 characters'); return }

    setSaving(true)
    try {
      const url = '/api/admin/employees'
      const method = showModal === 'add' ? 'POST' : 'PUT'
      const body = showModal === 'add'
        ? form
        : { id: editing!.id, name: form.name, email: form.email, phone: form.phone, role: form.role, ...(form.password ? { password: form.password } : {}) }

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (res.ok) {
        setShowModal(null)
        fetchEmployees()
      } else {
        setError(data.error || 'Failed to save')
      }
    } catch { setError('Network error') }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch('/api/admin/employees', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      if (res.ok) { fetchEmployees(); setConfirmDelete(null) }
    } catch { /* ignore */ }
  }

  const filtered = employees.filter(e =>
    !search || e.name?.toLowerCase().includes(search.toLowerCase()) || e.phone?.includes(search)
  )

  return (
    <>
      <Head><title>Employees - Danoscar Bite</title></Head>
      <div>
        <div className="p-4 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Employees</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your staff and their roles</p>
            </div>
            <button onClick={openAdd} className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-sm font-medium">
              <UserPlus className="h-5 w-5" /> Add Employee
            </button>
          </div>

          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">No employees found</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Add your first employee to get started</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map(emp => (
                <div key={emp.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-lg">
                        {emp.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{emp.name || 'Unnamed'}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{emp.phone}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_BADGES[emp.role] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                      {emp.role.replace('_', ' ')}
                    </span>
                  </div>
                  {emp.email && <p className="text-sm text-gray-400 dark:text-gray-500 mb-3">{emp.email}</p>}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-700">
                    <span className={`text-xs font-medium ${emp.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                      {emp.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(emp)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => setConfirmDelete(emp.id)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold dark:text-white">{showModal === 'add' ? 'Add Employee' : 'Edit Employee'}</h2>
              <button onClick={() => setShowModal(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="h-5 w-5" /></button>
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl">{error}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone *</label>
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role *</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                  {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {showModal === 'add' ? 'Password *' : 'New Password (leave blank to keep)'}
                </label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(null)} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium">
                {saving ? 'Saving...' : showModal === 'add' ? 'Add Employee' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold dark:text-white mb-2">Deactivate Employee?</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">This will deactivate the employee. They won't be able to log in.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700">Deactivate</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return { redirect: { destination: '/auth/login', permanent: false } }
  }
  return { props: { role: session.user.role } }
}
