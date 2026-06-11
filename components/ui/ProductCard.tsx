import { Clock, Plus } from 'lucide-react'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
  onAdd?: (product: Product) => void
  onClick?: (product: Product) => void
}

export default function ProductCard({ product, onAdd, onClick }: ProductCardProps) {
  return (
    <div
      onClick={() => onClick?.(product)}
      className="group bg-white dark:bg-gray-800/90 rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 cursor-pointer"
    >
      <div className="relative h-40 overflow-hidden bg-gray-100 dark:bg-gray-700">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl">🍽️</span>
          </div>
        )}
        {product.preparationTime > 0 && (
          <div className="absolute top-3 left-3 glass px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-200">
            <Clock size={12} />
            {product.preparationTime} min
          </div>
        )}
        {product.sellingPrice < 100 && (
          <div className="absolute top-3 right-3 bg-success-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
            Budget
          </div>
        )}
        {onAdd && (
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(product) }}
            className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-primary-600 active:scale-95"
          >
            <Plus size={18} />
          </button>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs font-medium text-primary-500 uppercase tracking-wider">{product.category?.name || 'General'}</p>
        <h3 className="font-heading font-semibold text-gray-900 dark:text-white mt-0.5 line-clamp-1">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-bold text-gray-900 dark:text-white font-heading">
            KES {product.sellingPrice.toLocaleString()}
          </span>
          {product.stockQuantity <= product.lowStockAlert && product.stockQuantity > 0 && (
            <span className="text-xs text-secondary-500 font-medium">{product.stockQuantity} left</span>
          )}
          {product.stockQuantity === 0 && (
            <span className="text-xs text-secondary-500 font-medium bg-secondary-50 dark:bg-secondary-900/20 px-2 py-0.5 rounded-full">Out of stock</span>
          )}
        </div>
      </div>
    </div>
  )
}
