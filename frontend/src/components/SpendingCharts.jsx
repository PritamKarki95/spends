import { useState } from 'react'
import { EmptyState } from './Feedback'
import { CategoryIcon } from '../utils/categoryIcons'

export default function SpendingCharts({ transactions }) {
  const months = [...new Set(transactions.map(t => t.date.slice(0, 7)))].sort()
  const [selected, setSelected] = useState('')
  const month = months.includes(selected) ? selected : months.at(-1)
  const debits = transactions.filter(t => t.type === 'debit')
  const totals = new Map()
  for (const t of debits.filter(t => t.date.startsWith(month))) totals.set(t.category || 'Uncategorized', (totals.get(t.category || 'Uncategorized') || 0) + t.amount)
  const categories = [...totals].sort((a, b) => b[1] - a[1])
  const total = categories.reduce((sum, [, amount]) => sum + amount, 0)
  const trend = []
  if (month) {
    const [year, number] = month.split('-').map(Number)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, number - 1 - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      trend.push({ key, label: d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }), amount: debits.filter(t => t.date.startsWith(key)).reduce((sum, t) => sum + t.amount, 0), present: months.includes(key) })
    }
  }
  const max = Math.max(1, ...trend.map(t => t.amount))
  return <section aria-label="Spending charts" className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-display text-xl font-semibold">Spending overview</h2>
      {month && <label className="text-sm flex items-center gap-2">Month<select className="field" value={month} onChange={e => setSelected(e.target.value)}>{months.map(m => <option key={m}>{m}</option>)}</select></label>}
    </div>
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="surface p-5 min-w-0"><h3 className="font-display font-semibold mb-5">By category</h3>
        {!categories.length ? <EmptyState title="No spending this month" description="Categorized debit transactions will appear here." /> : <div className="space-y-4">{categories.map(([category, amount]) => <div key={category}>
          <div className="flex justify-between gap-3 text-sm mb-2"><span className="inline-flex gap-2 items-center min-w-0"><CategoryIcon category={category} /><span className="break-words">{category}</span></span><span className="shrink-0">${amount.toFixed(2)}</span></div>
          <div role="meter" aria-label={category} aria-valuenow={amount} aria-valuemin={0} aria-valuemax={total} className="h-2 rounded-full bg-ocean/10 dark:bg-white/10"><div className="h-full rounded-full bg-teal transition-all motion-reduce:transition-none" style={{ width: `${total ? amount / total * 100 : 0}%` }} /></div>
        </div>)}</div>}
      </div>
      <div className="surface p-5 min-w-0"><h3 className="font-display font-semibold">Monthly trend</h3><p className="text-xs text-ink/60 dark:text-white/60 mt-1">Recorded debit spending · select a bar to explore</p>
        {!month ? <EmptyState /> : <div className="flex items-end gap-2 h-64 mt-5">{trend.map(t => <button key={t.key} disabled={!t.present} onClick={() => setSelected(t.key)} aria-label={`${t.label}: ${t.present ? '$' + t.amount.toFixed(2) : 'no data'}`} aria-pressed={month === t.key} className="flex-1 min-w-0 h-full flex flex-col justify-end items-center gap-2 text-xs">
          <span className="text-[10px] sm:text-xs">{t.present ? `$${Math.round(t.amount).toLocaleString()}` : '—'}</span>
          <span className={`w-full rounded-t-md ${month === t.key ? 'bg-teal' : 'bg-ocean'}`} style={{ height: `${Math.max(2, t.amount / max * 75)}%` }} />
          <span>{t.label}</span>
        </button>)}</div>}
      </div>
    </div>
  </section>
}
