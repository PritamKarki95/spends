import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, FileText, X } from 'lucide-react'

export function Skeleton({ rows = 3, label = 'Loading data' }) {
  return <div role="status" className="surface p-6 space-y-4">
    <span className="sr-only">{label}</span>
    {Array.from({ length: rows }, (_, i) => <div key={i} aria-hidden="true" className="motion-safe:animate-pulse flex gap-4 items-center">
      <div className="h-10 w-10 shrink-0 rounded-lg bg-ocean/10 dark:bg-white/10" />
      <div className="flex-1 space-y-2"><div className="h-3 w-2/3 rounded bg-ocean/10 dark:bg-white/10" /><div className="h-3 w-1/3 rounded bg-ocean/10 dark:bg-white/10" /></div>
    </div>)}
  </div>
}

export function EmptyState({ title = 'No transactions yet', description = 'Upload a statement to start exploring your spending.', upload = true, children }) {
  return <div className="p-6 sm:p-10 text-center">
    <FileText size={28} aria-hidden="true" className="mx-auto mb-3 text-teal" />
    <h3 className="font-display font-semibold">{title}</h3>
    <p className="mt-2 text-sm text-ink/60 dark:text-white/60 max-w-md mx-auto">{description}</p>
    {upload && <Link to="/upload" className="inline-block mt-5 rounded-lg bg-ocean px-4 py-2 text-sm text-white hover:opacity-90">Upload Statement</Link>}
    {children}
  </div>
}

export function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [message, onClose])
  if (!message) return null
  return <div role="status" className="fixed bottom-5 left-4 right-4 sm:left-auto sm:max-w-sm z-[60] surface p-4 shadow-lg flex items-start gap-3 page-enter">
    <CheckCircle2 size={20} aria-hidden="true" className="shrink-0 text-teal" />
    <p className="text-sm flex-1">{message}</p>
    <button type="button" aria-label="Dismiss notification" onClick={onClose}><X size={18} /></button>
  </div>
}
