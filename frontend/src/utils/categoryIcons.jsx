import { Utensils, ShoppingBag, Car, Clapperboard, Receipt, Wallet, HeartPulse, Plane, CircleHelp } from 'lucide-react'

const ICONS = {
  'Food': { Icon: Utensils, color: 'text-orange-500' },
  'Shopping': { Icon: ShoppingBag, color: 'text-blue-500' },
  'Transportation': { Icon: Car, color: 'text-slate-500' },
  'Entertainment': { Icon: Clapperboard, color: 'text-purple-500' },
  'Bills & Utilities': { Icon: Receipt, color: 'text-amber-600' },
  'Income': { Icon: Wallet, color: 'text-teal' },
  'Health': { Icon: HeartPulse, color: 'text-rose-500' },
  'Travel': { Icon: Plane, color: 'text-ocean' },
  'Other': { Icon: CircleHelp, color: 'text-gray-400' },
}

export function CategoryIcon({ category, size = 18, className = '' }) {
  const { Icon, color } = ICONS[category] || ICONS['Other']
  return <Icon size={size} aria-hidden="true" className={`shrink-0 ${color} ${className}`} strokeWidth={2} />
}
