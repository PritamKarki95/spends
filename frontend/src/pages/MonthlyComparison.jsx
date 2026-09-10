import { API_BASE_URL } from '../config'
import { Skeleton, EmptyState } from '../components/Feedback'
import { useState, useEffect, useRef } from 'react'
import AppHeader from '../components/AppHeader'
import { CategoryIcon } from '../utils/categoryIcons'
import { ChevronDown } from 'lucide-react'

function MonthlyComparison() {
  const [currentMonth, setCurrentMonth] = useState({ year: 2026, month: 8 })
  const [previousMonth, setPreviousMonth] = useState({ year: 2026, month: 7 })
  const [comparison, setComparison] = useState(null)
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [merchantData, setMerchantData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedMerchant, setExpandedMerchant] = useState(null)
  const [merchantTransactions, setMerchantTransactions] = useState(null)

  const detailRequest = useRef(0)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_BASE_URL}/comparisons/months/${currentMonth.year}/${currentMonth.month}/${previousMonth.year}/${previousMonth.month}`, {
          headers: { Authorization: `Bearer ${token}` }, signal: controller.signal,
        })
        if (!response.ok) throw new Error('Failed to load comparison')
        const data = await response.json()
        if (!controller.signal.aborted) setComparison(data)
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [currentMonth, previousMonth])

  function changeMonth(value, setter) {
    if (!value) return
    const [year, month] = value.split('-').map(Number)
    detailRequest.current++
    setLoading(true)
    setError('')
    setComparison(null)
    setExpandedCategory(null)
    setExpandedMerchant(null)
    setMerchantData(null)
    setMerchantTransactions(null)
    setDetailLoading(false)
    setter({ year, month })
  }

  async function toggleCategory(categoryName) {
    const request = ++detailRequest.current
    setError('')
    setMerchantData(null)
    setExpandedMerchant(null)
    setMerchantTransactions(null)
    if (expandedCategory === categoryName) {
      setExpandedCategory(null)
      setDetailLoading(false)
      return
    }
    setExpandedCategory(categoryName)
    setDetailLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/comparisons/months/${currentMonth.year}/${currentMonth.month}/${previousMonth.year}/${previousMonth.month}/category/${encodeURIComponent(categoryName)}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!response.ok) throw new Error('Failed to load category details')
      const data = await response.json()
      if (request === detailRequest.current) setMerchantData(data)
    } catch (err) {
      if (request === detailRequest.current) setError(err.message)
    } finally {
      if (request === detailRequest.current) setDetailLoading(false)
    }
  }

  async function toggleMerchant(merchantName) {
    const request = ++detailRequest.current
    setError('')
    setMerchantTransactions(null)
    if (expandedMerchant === merchantName) {
      setExpandedMerchant(null)
      setDetailLoading(false)
      return
    }
    setExpandedMerchant(merchantName)
    setDetailLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/comparisons/months/${currentMonth.year}/${currentMonth.month}/category/${encodeURIComponent(expandedCategory)}/merchant/${encodeURIComponent(merchantName)}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!response.ok) throw new Error('Failed to load merchant transactions')
      const data = await response.json()
      if (request === detailRequest.current) setMerchantTransactions(data)
    } catch (err) {
      if (request === detailRequest.current) setError(err.message)
    } finally {
      if (request === detailRequest.current) setDetailLoading(false)
    }
  }

  function monthLabel(y, m) {
    return new Date(y, m - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-mist dark:bg-[#0A1F2E]">
      <AppHeader />
      <main className="page-content page-enter">
      <h1 className="page-title mb-2">Monthly Comparison</h1>
      <p className="text-gray-600 dark:text-white/70 mb-6">
        {monthLabel(currentMonth.year, currentMonth.month)} vs {monthLabel(previousMonth.year, previousMonth.month)}
      </p>

      {/* Month pickers */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-xs text-gray-600 dark:text-white/70 mb-1">Current month</label>
          <input
            type="month"
            value={`${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}`}
            onChange={(e) => changeMonth(e.target.value, setCurrentMonth)}
            className="border dark:border-white/20 bg-white dark:bg-[#102A3D] text-ink dark:text-white rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 dark:text-white/70 mb-1">Compare to</label>
          <input
            type="month"
            value={`${previousMonth.year}-${String(previousMonth.month).padStart(2, '0')}`}
            onChange={(e) => changeMonth(e.target.value, setPreviousMonth)}
            className="border dark:border-white/20 bg-white dark:bg-[#102A3D] text-ink dark:text-white rounded-md px-3 py-2"
          />
        </div>
      </div>

      {error && <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>}
      {loading && <Skeleton rows={4} label="Loading comparison" />}

      {!loading && comparison && (
        <div>
          {/* Summary card */}
          <div className="surface p-6 mb-6">
            <p className="text-sm text-gray-500 dark:text-white/60">Total spending</p>
            <p className="text-3xl font-bold">${comparison.current_total.toFixed(2)}</p>
            <p className={comparison.total_change >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
              {comparison.total_change >= 0 ? '↑' : '↓'} ${Math.abs(comparison.total_change).toFixed(2)}
              {comparison.total_percent_change !== null && ` (${comparison.total_percent_change.toFixed(1)}%)`}
              {' '}vs {monthLabel(previousMonth.year, previousMonth.month)}
            </p>
          </div>

          {/* Category breakdown */}
          <div className="surface overflow-hidden">
            {comparison.categories.length === 0 && <EmptyState title="No spending to compare" description="Choose months with imported transactions, or upload another statement." />}
            {comparison.categories.map((cat) => (
              <div key={cat.category} className="border-b dark:border-white/10 last:border-b-0">
                <button
                  onClick={() => toggleCategory(cat.category)}
                  aria-expanded={expandedCategory === cat.category}
                  className="w-full flex justify-between items-center p-4 hover:bg-gray-50 dark:hover:bg-white/5 text-left"
                >
                  <div>
                    <p className="font-medium flex items-center gap-2"><CategoryIcon category={cat.category} />{cat.category}</p>
                    <p className="text-sm text-gray-500 dark:text-white/60">
                      ${cat.current_amount.toFixed(2)} (was ${cat.previous_amount.toFixed(2)})
                    </p>
                  </div>
                  <div className={`text-right ${cat.change >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    <p className="font-medium">
                      {cat.change >= 0 ? '+' : ''}{cat.change.toFixed(2)}
                    </p>
                    {cat.percent_change !== null && (
                      <p className="text-sm">
                        {cat.change >= 0 ? '+' : ''}{cat.percent_change.toFixed(1)}%
                      </p>
                    )}
                  </div>
                  <ChevronDown size={18} aria-hidden="true" className={`shrink-0 ml-2 text-ocean transition-transform ${expandedCategory === cat.category ? 'rotate-180' : ''}`} />
                </button>

                {expandedCategory === cat.category && detailLoading && <Skeleton rows={1} label="Loading details" />}
                {expandedCategory === cat.category && merchantData && (
        <div className="bg-gray-50 dark:bg-[#0A1F2E] px-4 pb-4">
           {merchantData.merchants.map((m) => (
           <div key={m.category}>
                <button
                onClick={() => toggleMerchant(m.category)}
                className="w-full flex justify-between py-2 border-t border-gray-200 dark:border-white/10 text-sm hover:bg-gray-100 dark:hover:bg-white/5 text-left"
                >
                    <span>{m.category}</span>
                    <span className={m.change >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                        {m.change >= 0 ? '+' : ''}${m.change.toFixed(2)}
                        </span>
                        </button>

        {expandedMerchant === m.category && merchantTransactions && (
          <div className="pl-4 pb-2">
            {merchantTransactions.map((txn) => (
              <div key={txn.id} className="flex justify-between py-1 text-xs text-gray-600 dark:text-white/70">
                <span>{txn.date} — {txn.description}</span>
                <span>${txn.amount.toFixed(2)}</span>
              </div>
            ))}
            {merchantTransactions.length === 0 && (
              <p className="text-xs text-gray-400 dark:text-white/50 py-1">No transactions this month.</p>
            )}
          </div>
        )}
      </div>
    ))}
  </div>
)}

              </div>
            ))}
          </div>
        </div>
      )}
      </main>
    </div>
  )
}

export default MonthlyComparison
