import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, X } from 'lucide-react'

interface FloatingCartProps {
  count: number
  total: number
  onViewCart: () => void
}

export default function FloatingCart({ count, total, onViewCart }: FloatingCartProps) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onClick={onViewCart}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gradient-to-br from-orange-500 to-orange-600 text-white px-5 py-3.5 rounded-2xl shadow-[0_8px_32px_rgba(249,115,22,0.35)] hover:shadow-[0_12px_40px_rgba(249,115,22,0.45)] hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <div className="relative">
            <ShoppingBag size={20} />
            <span className="absolute -top-2 -right-2 w-4 h-4 bg-white text-orange-600 text-[9px] font-bold rounded-full flex items-center justify-center">
              {count}
            </span>
          </div>
          <div className="text-left">
            <p className="text-[10px] text-orange-100 font-medium">{count} items</p>
            <p className="text-sm font-bold">KES {total.toFixed(2)}</p>
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
