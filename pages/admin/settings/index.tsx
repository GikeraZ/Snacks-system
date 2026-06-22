import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'

import { Save, Building2, Printer, Settings2, Image, Loader2, Upload, Trash2 } from 'lucide-react'

interface Props { role: string }

export default function SettingsPage({ role }: Props) {
  const [tab, setTab] = useState<'business' | 'receipt' | 'general' | 'appearance'>('business')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [receipt, setReceipt] = useState({
    businessName: 'Hot Take',
    address: '',
    phone: '',
    email: '',
    website: '',
    footerText: 'Thank you for your patronage!',
    logoUrl: '',
    faviconUrl: '',
    receiptLogoUrl: '',
  })

  const [uploading, setUploading] = useState<'logo' | 'favicon' | 'receiptLogo' | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const faviconInputRef = useRef<HTMLInputElement>(null)
  const receiptLogoInputRef = useRef<HTMLInputElement>(null)

  const [settings, setSettings] = useState<Record<string, string>>({
    taxRate: '0',
    currency: 'KES',
    lowStockThreshold: '10',
    orderPrefix: 'ORD',
  })

  useEffect(() => {
    fetch('/api/admin/settings').then(res => res.json()).then(data => {
      if (data.receipt) setReceipt({ ...receipt, ...data.receipt })
      if (data.settings) {
        const map: Record<string, string> = {}
        for (const s of data.settings) map[s.key] = s.value
        setSettings(prev => ({ ...prev, ...map }))
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon' | 'receiptLogo') => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(type)
    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const imageData = event.target?.result as string
        const res = await fetch('/api/admin/upload-logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: imageData, type }),
        })
        const data = await res.json()
        if (res.ok) {
          if (type === 'logo') setReceipt({ ...receipt, logoUrl: data.url })
          if (type === 'favicon') setReceipt({ ...receipt, faviconUrl: data.url })
          if (type === 'receiptLogo') setReceipt({ ...receipt, receiptLogoUrl: data.url })
          setMessage('Logo uploaded successfully!')
        } else {
          setMessage(data.error || 'Upload failed')
        }
      }
      reader.readAsDataURL(file)
    } catch {
      setMessage('Upload failed')
    }
    setUploading(null)
    if (e.target) e.target.value = ''
  }

  const handleRemove = async (field: string) => {
    setReceipt({ ...receipt, [field]: '' })
    setMessage('Logo removed. Save settings to confirm.')
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      const body: Record<string, unknown> = {}
      if (tab === 'business' || tab === 'receipt' || tab === 'appearance') body.receipt = receipt
      if (tab === 'general') body.settings = Object.entries(settings).map(([key, value]) => ({ key, value }))

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) setMessage('Settings saved successfully!')
      else setMessage(data.error || 'Failed to save settings')
    } catch { setMessage('Network error') }
    setSaving(false)
  }

  if (loading) {
    return (
      <>
        <Head><title>Settings - Hot Take</title></Head>
        <div>
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 dark:text-primary-400" />
        </div>
      </>
    )
  }

  const tabs = [
    { id: 'business', label: 'Business Info', icon: Building2 },
    { id: 'receipt', label: 'Receipt Settings', icon: Printer },
    { id: 'appearance', label: 'Appearance', icon: Image },
    { id: 'general', label: 'General', icon: Settings2 },
  ] as const

  return (
    <>
      <Head><title>Settings - Hot Take</title></Head>
      <div>
        <div className="p-4 md:p-8 max-w-3xl">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Manage your business configuration</p>

          <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-600 pb-2 overflow-x-auto">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  tab === t.id ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}>
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded-xl text-sm ${message.includes('success') ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
              {message}
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
            {tab === 'business' && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold dark:text-white">Business Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Name</label>
                    <input type="text" value={receipt.businessName} onChange={e => setReceipt({ ...receipt, businessName: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                    <input type="text" value={receipt.address || ''} onChange={e => setReceipt({ ...receipt, address: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                    <input type="tel" value={receipt.phone || ''} onChange={e => setReceipt({ ...receipt, phone: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input type="email" value={receipt.email || ''} onChange={e => setReceipt({ ...receipt, email: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</label>
                    <input type="url" value={receipt.website || ''} onChange={e => setReceipt({ ...receipt, website: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
              </div>
            )}

            {tab === 'receipt' && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold dark:text-white">Receipt Configuration</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Footer Text</label>
                  <textarea value={receipt.footerText || ''} onChange={e => setReceipt({ ...receipt, footerText: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Appears at the bottom of printed receipts</p>
                </div>
              </div>
            )}

            {tab === 'appearance' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold dark:text-white">Appearance</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Upload your brand logo and favicon. Recommended: square PNG images.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">App Logo</label>
                    <div className="flex flex-col items-center gap-3 p-4 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                      {receipt.logoUrl ? (
                        <img src={receipt.logoUrl} alt="Logo" className="h-20 w-20 object-contain rounded-xl" />
                      ) : (
                        <div className="h-20 w-20 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <Image className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <button onClick={() => logoInputRef.current?.click()} disabled={uploading === 'logo'}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors disabled:opacity-50">
                        {uploading === 'logo' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Upload Logo
                      </button>
                      <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, 'logo')} />
                      {receipt.logoUrl && (
                        <button onClick={() => handleRemove('logoUrl')} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                          <Trash2 className="h-3 w-3" /> Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Favicon (Browser Icon)</label>
                    <div className="flex flex-col items-center gap-3 p-4 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                      {receipt.faviconUrl ? (
                        <img src={receipt.faviconUrl} alt="Favicon" className="h-12 w-12 object-contain rounded-lg" />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <Image className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <button onClick={() => faviconInputRef.current?.click()} disabled={uploading === 'favicon'}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors disabled:opacity-50">
                        {uploading === 'favicon' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Upload Favicon
                      </button>
                      <input ref={faviconInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, 'favicon')} />
                      {receipt.faviconUrl && (
                        <button onClick={() => handleRemove('faviconUrl')} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                          <Trash2 className="h-3 w-3" /> Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Receipt Logo</label>
                    <div className="flex flex-col items-center gap-3 p-4 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                      {receipt.receiptLogoUrl ? (
                        <img src={receipt.receiptLogoUrl} alt="Receipt Logo" className="h-20 w-20 object-contain rounded-xl" />
                      ) : (
                        <div className="h-20 w-20 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <Image className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <button onClick={() => receiptLogoInputRef.current?.click()} disabled={uploading === 'receiptLogo'}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors disabled:opacity-50">
                        {uploading === 'receiptLogo' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Upload Receipt Logo
                      </button>
                      <input ref={receiptLogoInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, 'receiptLogo')} />
                      {receipt.receiptLogoUrl && (
                        <button onClick={() => handleRemove('receiptLogoUrl')} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                          <Trash2 className="h-3 w-3" /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'general' && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold dark:text-white">General Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                    <select value={settings.currency} onChange={e => setSettings({ ...settings, currency: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="KES">KES - Kenyan Shilling</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax Rate (%)</label>
                    <input type="number" step="0.01" value={settings.taxRate} onChange={e => setSettings({ ...settings, taxRate: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Low Stock Threshold</label>
                    <input type="number" value={settings.lowStockThreshold} onChange={e => setSettings({ ...settings, lowStockThreshold: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Order Number Prefix</label>
                    <input type="text" value={settings.orderPrefix} onChange={e => setSettings({ ...settings, orderPrefix: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
              <button onClick={handleSave} disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" /> Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
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
