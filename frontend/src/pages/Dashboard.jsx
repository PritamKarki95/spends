import SpendingCharts from '../components/SpendingCharts'
import { Skeleton, EmptyState } from '../components/Feedback'
import { useState, useEffect } from 'react'
import AnimatedNumber from '../components/AnimatedNumber'
import Reveal from '../components/Reveal'
import AnomaliesWidget from '../components/AnomaliesWidget'
import ForecastWidget from '../components/ForecastWidget'
import AppHeader from '../components/AppHeader'

const CURRENT = { year: 2026, month: 8 }
const PREVIOUS = { year: 2026, month: 7 }

function monthLabel(y, m) {
  return new Date(y, m - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
}

function WaveAccent() {
  return (
    <svg
      className="absolute right-0 top-0 h-full w-1/2 opacity-[0.08] pointer-events-none"
      viewBox="0 0 400 300" preserveAspectRatio="xMaxYMid slice" aria-hidden="true"
    >
      <defs>
        <linearGradient id="waveGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-ocean)" />
          <stop offset="100%" stopColor="var(--color-teal)" />
        </linearGradient>
      </defs>
      <path
        d="M60 0 C160 60, 40 120, 160 160 C260 190, 120 250, 220 300 L400 300 L400 0 Z"
        fill="url(#waveGrad)"
      />
    </svg>
  )
}

function Dashboard() {
  const [comparison, setComparison] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [error, setError] = useState('')
  const [income, setIncome] = useState(0)
  const [subscriptions, setSubscriptions] = useState([])
  const [anomalyCount, setAnomalyCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAll() {
      try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      const start = `${CURRENT.year}-${String(CURRENT.month).padStart(2, '0')}-01`
      const end = `${CURRENT.year}-${String(CURRENT.month).padStart(2, '0')}-${new Date(CURRENT.year, CURRENT.month, 0).getDate()}`

      const [compRes, txnRes, subRes, anomRes] = await Promise.all([
        fetch(`http://127.0.0.1:8000/comparisons/months/${CURRENT.year}/${CURRENT.month}/${PREVIOUS.year}/${PREVIOUS.month}`, { headers }),
        fetch('http://127.0.0.1:8000/transactions', { headers }),
        fetch('http://127.0.0.1:8000/subscriptions', { headers }),
        fetch('http://127.0.0.1:8000/anomalies', { headers }),
      ])

      if (![compRes, txnRes, subRes, anomRes].every(r => r.ok)) throw new Error('Unable to load dashboard data. Please refresh to try again.')
      if (compRes.ok) setComparison(await compRes.json())
      if (txnRes.ok) {
        const txns = await txnRes.json()
        setTransactions(txns)
        setIncome(txns.filter(t => t.type === 'credit' && t.date >= start && t.date <= end).reduce((s, t) => s + t.amount, 0))
      }
      if (subRes.ok) setSubscriptions(await subRes.json())
      if (anomRes.ok) setAnomalyCount((await anomRes.json()).length)

      } catch (err) { setError(err.message) } finally { setLoading(false) }
    }
    loadAll()
  }, [])

  const recurringTotal = subscriptions.reduce((s, sub) => s + sub.avg_amount, 0)
  const netCashFlow = income - (comparison?.current_total ?? 0)

  const insights = []
  if (comparison) {
    insights.push(
      `Total spending ${comparison.total_change >= 0 ? 'increased' : 'decreased'} $${Math.abs(comparison.total_change).toFixed(2)}${
        comparison.total_percent_change != null ? ` (${Math.abs(comparison.total_percent_change).toFixed(1)}%)` : ''
      } vs ${monthLabel(PREVIOUS.year, PREVIOUS.month)}.`
    )
    comparison.categories.slice(0, 2).forEach(cat => {
      insights.push(
        `${cat.category} spending ${cat.change >= 0 ? 'increased' : 'decreased'} ${
          cat.percent_change != null ? `${Math.abs(cat.percent_change).toFixed(1)}%` : `$${Math.abs(cat.change).toFixed(2)}`
        } compared with ${monthLabel(PREVIOUS.year, PREVIOUS.month)}.`
      )
    })
  }
  if (subscriptions.length > 0) {
    insights.push(`Your recurring expenses total approximately $${recurringTotal.toFixed(2)}/month.`)
  }
  if (anomalyCount > 0) {
    insights.push(`${anomalyCount} transaction${anomalyCount > 1 ? 's were' : ' was'} significantly outside your normal spending pattern.`)
  }

  return (
    <div className="min-h-screen bg-mist dark:bg-[#0A1F2E] font-sans transition-colors">
      <AppHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line dark:border-white/10">
        <WaveAccent />
        <div className="max-w-6xl mx-auto px-6 py-12 relative">
          <p className="text-sm text-ink/60 dark:text-white/50 mb-2">{monthLabel(CURRENT.year, CURRENT.month)}</p>
          {loading && <Skeleton rows={1} label="Loading spending summary" />}
          {error && <p role="alert" className="text-red-600 dark:text-red-400">{error}</p>}
          {!loading && comparison && (
            <>
              <h1 className="font-display text-5xl md:text-6xl font-semibold text-ink dark:text-white">
                <AnimatedNumber value={comparison.current_total} prefix="$" />
              </h1>
              <p className={`mt-3 text-sm font-medium ${comparison.total_change >= 0 ? 'text-orange-600 dark:text-orange-400' : 'text-teal'}`}>
                {comparison.total_change >= 0 ? '↑' : '↓'} ${Math.abs(comparison.total_change).toFixed(2)}
                {comparison.total_percent_change != null && ` (${Math.abs(comparison.total_percent_change).toFixed(1)}%)`}
                {' '}vs {monthLabel(PREVIOUS.year, PREVIOUS.month)}
              </p>
            </>
          )}
        </div>
      </section>

      <main className="page-content space-y-10">
        {!loading && !error && transactions.length === 0 && <div className="surface"><EmptyState /></div>}
        {loading ? <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{[0,1,2,3].map(i => <Skeleton key={i} rows={1} />)}</div> : !error && <>
        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Income', value: income, delay: 0 },
            { label: 'Total Spending', value: comparison?.current_total ?? 0, delay: 80 },
            { label: 'Net Cash Flow', value: netCashFlow, delay: 160 },
            { label: 'Recurring Monthly', value: recurringTotal, delay: 240 },
          ].map(card => (
            <Reveal key={card.label} delay={card.delay}>
              <div className="rounded-2xl border border-line dark:border-white/10 bg-white dark:bg-[#102A3D] p-5">
                <p className="text-xs text-ink/50 dark:text-white/50">{card.label}</p>
                <p className="mt-1 font-display text-2xl font-semibold text-ink dark:text-white">
                  <AnimatedNumber value={card.value} prefix="$" />
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <Reveal>
            <div className="rounded-2xl border border-line dark:border-white/10 bg-white dark:bg-[#102A3D] p-6">
              <h2 className="font-display font-semibold text-ink dark:text-white mb-4">Insights</h2>
              <ul className="space-y-3">
                {insights.map((text, i) => (
                  <li key={i} className="text-sm text-ink/80 dark:text-white/80 flex gap-2">
                    <span className="text-teal mt-0.5">—</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        )}

        <SpendingCharts transactions={transactions} />
        </>}
        {/* Existing widgets */}
        <Reveal><AnomaliesWidget /></Reveal>
        <Reveal><ForecastWidget /></Reveal>
      </main>
    </div>
  )
}

export default Dashboard