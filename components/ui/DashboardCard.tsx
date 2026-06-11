import { type ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import GlassCard from './GlassCard'

interface DashboardCardProps {
  title: string
  value: string | number
  icon: ReactNode
  trend?: { value: number; isUp: boolean }
  gradient?: 'orange' | 'red' | 'green' | 'indigo'
  onClick?: () => void
}

const gradientMap = {
  orange: 'from-[#F97316] to-[#FB923C]',
  red: 'from-[#DC2626] to-[#F87171]',
  green: 'from-[#10B981] to-[#34D399]',
  indigo: 'from-[#6366F1] to-[#818CF8]',
}

const glowMap = {
  orange: 'rgba(249, 115, 22, 0.2)',
  red: 'rgba(220, 38, 38, 0.2)',
  green: 'rgba(16, 185, 129, 0.2)',
  indigo: 'rgba(99, 102, 241, 0.2)',
}

export default function DashboardCard({ title, value, icon, trend, gradient = 'orange', onClick }: DashboardCardProps) {
  return (
    <GlassCard onClick={onClick} className="relative overflow-hidden group" gradient>
      <div className="flex items-start justify-between">
        <div className="z-10">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 font-heading">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <div className={`p-0.5 rounded-full ${trend.isUp ? 'bg-success-100 dark:bg-success-900/30' : 'bg-secondary-100 dark:bg-secondary-900/30'}`}>
                {trend.isUp ? (
                  <TrendingUp size={12} className="text-success-500" />
                ) : (
                  <TrendingDown size={12} className="text-secondary-500" />
                )}
              </div>
              <span className={`text-xs font-semibold ${trend.isUp ? 'text-success-500' : 'text-secondary-500'}`}>
                {trend.isUp ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">vs last week</span>
            </div>
          )}
        </div>
        <div className={`z-10 p-3.5 rounded-2xl bg-gradient-to-br ${gradientMap[gradient]} shadow-lg shadow-[${glowMap[gradient]}]`}>
          <div className="text-white">
            {icon}
          </div>
        </div>
      </div>
      <div className={`absolute -bottom-6 -right-6 w-36 h-36 rounded-full bg-gradient-to-br ${gradientMap[gradient]} opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500`} />
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-700 blur-3xl"
        style={{ background: glowMap[gradient] }}
      />
    </GlassCard>
  )
}
