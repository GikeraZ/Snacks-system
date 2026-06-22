import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '@/lib/prisma'
import Head from 'next/head'
import { Package, AlertTriangle, Plus, Minus } from 'lucide-react'

interface IngredientData {
  id: string
  name: string
  unit: string
  costPerUnit: number
  stockQuantity: number
  lowStockAlert: number
}

interface ProductData {
  id: string
  name: string
  sellingPrice: number
  stockQuantity: number
}

interface Props {
  ingredients: IngredientData[]
  products: ProductData[]
  totalValue: number
  lowStockCount: number
  role: string
}

export default function PartnerInventory({ ingredients, products, totalValue, lowStockCount, role }: Props) {
  return (
    <>
      <Head><title>Inventory - Hot Take</title></Head>
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Inventory</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-900/20">
                <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-2xl font-bold dark:text-white">{products.length + ingredients.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Items</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold dark:text-white">KES {totalValue.toLocaleString()}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Inventory Value</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{lowStockCount}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Low Stock Alerts</p>
          </div>
        </div>

        {lowStockCount > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">Low Stock Alert</p>
            </div>
            <p className="text-xs text-red-600 dark:text-red-400">
              {lowStockCount} item{lowStockCount > 1 ? 's' : ''} running low on stock. Consider restocking soon.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold dark:text-white">Products</h2>
            </div>
            {products.length > 0 ? (
              <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {products.map(p => {
                  const isLow = p.stockQuantity <= 5
                  return (
                    <div key={p.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium dark:text-white">{p.name}</p>
                        <p className="text-xs text-gray-400">KES {p.sellingPrice.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-bold ${isLow ? 'text-red-600 dark:text-red-400' : 'dark:text-white'}`}>
                          {p.stockQuantity}
                        </span>
                        {isLow && <AlertTriangle size={12} className="inline ml-1 text-red-500" />}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-400">No products</p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold dark:text-white">Ingredients</h2>
            </div>
            {ingredients.length > 0 ? (
              <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {ingredients.map(ing => {
                  const isLow = ing.stockQuantity <= ing.lowStockAlert
                  return (
                    <div key={ing.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium dark:text-white">{ing.name}</p>
                        <p className="text-xs text-gray-400">{ing.unit} · KES {ing.costPerUnit.toFixed(2)}/unit</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-bold ${isLow ? 'text-red-600 dark:text-red-400' : 'dark:text-white'}`}>
                          {ing.stockQuantity}
                        </span>
                        {isLow && <AlertTriangle size={12} className="inline ml-1 text-red-500" />}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-400">No ingredients</p>
            )}
          </div>
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

  const [ingredients, products] = await Promise.all([
    prisma.ingredient.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
  ])

  const totalValue = ingredients.reduce((s, i) => s + Number(i.costPerUnit) * Number(i.stockQuantity), 0)
  const lowStockCount = [
    ...ingredients.filter(i => i.stockQuantity <= i.lowStockAlert),
    ...products.filter(p => p.stockQuantity <= 5),
  ].length

  return {
    props: {
      ingredients: JSON.parse(JSON.stringify(ingredients)),
      products: JSON.parse(JSON.stringify(products)),
      totalValue,
      lowStockCount,
      role: session.user.role,
    },
  }
}
