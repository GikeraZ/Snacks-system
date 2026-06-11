import { motion } from 'framer-motion'
import { Star, Gift } from 'lucide-react'

interface LoyaltyBadgeProps {
  points: number
}

export default function LoyaltyBadge({ points }: LoyaltyBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-4 p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border border-amber-200/50 dark:border-amber-700/30"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/20">
            <Star size={18} className="text-white fill-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              <span className="text-primary-500">{points}</span> Loyalty Points
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Earn points with every order</p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <Gift size={12} />
          Rewards
        </button>
      </div>
    </motion.div>
  )
}
