import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '@/lib/prisma'
import { useState } from 'react'
import Head from 'next/head'
import { Receipt, Clock, Copy, CheckCircle, Printer } from 'lucide-react'

interface ReceiptData {
  id: string
  orderNumber: string
  totalAmount: number
  paymentMethod: string
  paymentStatus: string
  mpesaReceipt: string | null
  createdAt: string
  items: { name: string; quantity: number; unitPrice: number; totalPrice: number }[]
  customerPhone: string | null
}

interface Props {
  receipts: ReceiptData[]
  role: string
}

export default function CashierReceipts({ receipts, role }: Props) {
  const [copied, setCopied] = useState<string | null>(null)
  const [selected, setSelected] = useState<ReceiptData | null>(null)

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const formatDate = (d: string) => {
    const date = new Date(d)
    return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) +
      ' · ' + date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  return (
    <>
      <Head><title>Receipts - Hot Take</title></Head>
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold dark:text-white">Receipts</h1>
          <span className="text-sm text-gray-400">{receipts.length} today</span>
        </div>

        {receipts.length === 0 ? (
          <div className="text-center py-16">
            <Receipt size={48} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No receipts for today</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Complete sales at the POS to see receipts here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {receipts.map(receipt => (
              <div
                key={receipt.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden"
              >
                <div
                  onClick={() => setSelected(selected?.id === receipt.id ? null : receipt)}
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">{receipt.orderNumber}</span>
                      {receipt.mpesaReceipt && (
                        <span className="ml-2 text-[10px] text-primary-500 font-mono">{receipt.mpesaReceipt}</span>
                      )}
                    </div>
                    <span className="text-lg font-bold text-primary-500">KES {receipt.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1"><Clock size={12} />{formatDate(receipt.createdAt)}</span>
                    <span className="flex items-center gap-1"><Receipt size={12} />{receipt.items.length} items</span>
                    <span>{receipt.paymentMethod}</span>
                  </div>
                </div>

                {selected?.id === receipt.id && (
                  <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3 space-y-2 bg-gray-50 dark:bg-gray-800/50">
                    {receipt.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">{item.name} <span className="text-gray-400">x{item.quantity}</span></span>
                        <span className="font-medium text-gray-900 dark:text-white">KES {item.totalPrice.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-bold text-sm">
                      <span className="text-gray-700 dark:text-gray-300">Total</span>
                      <span className="text-primary-500">KES {receipt.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 pt-1">
                      <span>{receipt.paymentMethod} · {receipt.paymentStatus}</span>
                      {receipt.customerPhone && <span>{receipt.customerPhone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')}</span>}
                    </div>
                    {receipt.mpesaReceipt && (
                      <button
                        onClick={() => copyCode(receipt.mpesaReceipt!)}
                        className="w-full mt-2 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
                      >
                        {copied === receipt.mpesaReceipt ? <><CheckCircle size={14} /> Copied!</> : <><Copy size={14} /> Copy M-Pesa Code</>}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)
  if (!session || !session.user || (session.user.role !== 'CASHIER' && session.user.role !== 'SUPER_ADMIN')) {
    return { redirect: { destination: '/auth/login', permanent: false } }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: today },
      delivery: { locationType: 'POS' },
    },
    include: {
      orderItems: { include: { product: { select: { name: true } } } },
      delivery: { select: { customerPhone: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const receipts = orders.map(o => ({
    id: o.id,
    orderNumber: o.orderNumber,
    totalAmount: Number(o.totalAmount),
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    mpesaReceipt: o.mpesaReceipt,
    createdAt: o.createdAt.toISOString(),
    items: o.orderItems.map(i => ({
      name: i.product.name,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      totalPrice: Number(i.totalPrice),
    })),
    customerPhone: o.delivery?.customerPhone || null,
  }))

  return {
    props: {
      receipts: JSON.parse(JSON.stringify(receipts)),
      role: session.user.role,
    },
  }
}
