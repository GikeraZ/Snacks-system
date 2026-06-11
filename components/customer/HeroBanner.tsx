import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Coffee } from 'lucide-react'

const slides = [
  {
    icon: '🍔',
    title: 'Buy 2 Burgers',
    subtitle: 'Get a Free Soda!',
    gradient: 'from-orange-500 via-orange-600 to-red-500',
    badge: 'Limited Offer',
  },
  {
    icon: '🚚',
    title: 'Free Delivery',
    subtitle: 'On orders above KES 1,000',
    gradient: 'from-emerald-500 via-emerald-600 to-teal-500',
    badge: 'Today Only',
  },
  {
    icon: '🎓',
    title: 'Student Combo',
    subtitle: 'Burger + Chips + Drink = KES 350',
    gradient: 'from-purple-500 via-purple-600 to-indigo-500',
    badge: 'Best Value',
  },
]

export default function HeroBanner() {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1)
      setCurrent(prev => (prev + 1) % slides.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const goTo = (idx: number) => {
    setDirection(idx > current ? 1 : -1)
    setCurrent(idx)
  }

  const prev = () => {
    setDirection(-1)
    setCurrent(prev => (prev - 1 + slides.length) % slides.length)
  }

  const next = () => {
    setDirection(1)
    setCurrent(prev => (prev + 1) % slides.length)
  }

  const slide = slides[current]

  return (
    <div className="relative overflow-hidden rounded-3xl mx-4 mt-4">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          initial={{ opacity: 0, x: direction * 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -direction * 80 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className={`relative bg-gradient-to-br ${slide.gradient} p-6 rounded-3xl overflow-hidden`}
        >
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/5" />
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block px-2.5 py-0.5 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold rounded-full mb-3 uppercase tracking-wider">
                  {slide.badge}
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-white font-heading leading-tight">
                  {slide.icon} {slide.title}
                </h2>
                <p className="text-white/90 text-sm md:text-base mt-1 font-medium">{slide.subtitle}</p>
              </div>
            </div>
            <button className="mt-4 px-5 py-2 bg-white text-gray-900 text-xs font-bold rounded-xl hover:bg-white/90 transition-colors shadow-lg">
              Order Now
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              idx === current ? 'w-6 bg-white' : 'bg-white/40'
            }`}
          />
        ))}
      </div>

      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/30 transition-colors hidden sm:block"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/30 transition-colors hidden sm:block"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
