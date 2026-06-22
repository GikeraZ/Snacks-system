import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Sparkles } from 'lucide-react'
import { useState } from 'react'

interface FloatingCartProps {
  count: number
  total: number
  onViewCart: () => void
}

export default function FloatingCart({ count, total, onViewCart }: FloatingCartProps) {
  const [pulse, setPulse] = useState(false)

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.button
          initial={{ scale: 0, opacity: 0, y: 60 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0, y: 60 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setPulse(true); setTimeout(() => setPulse(false), 300); onViewCart() }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gradient-to-br from-orange-500 to-orange-600 text-white pl-5 pr-6 py-3.5 rounded-2xl shadow-[0_8px_32px_rgba(249,115,22,0.35)] hover:shadow-[0_12px_40px_rgba(249,115,22,0.45)] transition-all duration-200 group"
        >
          <div className="relative">
            <motion.div
              animate={pulse ? { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] } : {}}
              transition={{ duration: 0.3 }}
            >
              <ShoppingBag size={20} className="group-hover:animate-bounce-in" />
            </motion.div>
            <motion.span
              key={count}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 bg-white text-orange-600 text-[9px] font-bold rounded-full flex items-center justify-center shadow-lg"
            >
              {count}
            </motion.span>
          </div>
          <div className="text-left">
            <p className="text-[10px] text-orange-100 font-medium flex items-center gap-1">
              <Sparkles size={10} />
              {count} {count === 1 ? 'item' : 'items'}
            </p>
            <p className="text-sm font-bold">KES {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="ml-1 w-1.5 h-8 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
