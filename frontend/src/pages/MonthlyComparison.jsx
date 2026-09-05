import { useState, useEffect } from 'react'

function MonthlyComparison() {
  const [currentMonth, setCurrentMonth] = useState({ year: 2026, month: 8 })
  const [previousMonth, setPreviousMonth] = useState({ year: 2026, month: 7 })
  const [comparison, setComparison] = useState(null)
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [merchantData, setMerchantData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function fetchComparison() {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const url = `http://127.0.0.1:8000/comparisons/months/${currentMonth.year}/${currentMonth.month}/${previousMonth.year}/${previousMonth.month}`
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (!response.ok) throw new Error('Failed to load comparison')
      setComparison(await response.json())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComparison()
    setExpandedCategory(null)
    setMerchantData(null)
  }, [currentMonth, previousMonth])

  async function toggleCategory(categoryName) {
    if (expandedCategory === categoryName) {
      setExpandedCategory(null)
      setMerchantData(null)
      return
    }

    setExpandedCategory(categoryName)
    const token = localStorage.getItem('token')
    const url = `http://127.0.0.1:8000/comparisons/months/${currentMonth.year}/${currentMonth.month}/${previousMonth.year}/${previousMonth.month}/category/${encodeURIComponent(categoryName)}`
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (response.ok) {
      setMerchantData(await response.json())
    }
  }

  function monthLabel(y, m) {
    return new Date(y, m - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-2">Monthly Comparison</h1>
      <p className="text-gray-600 mb-6">
        {monthLabel(currentMonth.year, currentMonth.month)} vs {monthLabel(previousMonth.year, previousMonth.month)}
      </p>

      {/* Month pickers */}
      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Current month</label>
          <input
            type="month"
            value={`${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split('-').map(Number)
              setCurrentMonth({ year: y, month: m })
            }}
            className="border rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Compare to</label>
          <input
            type="month"
            value={`${previousMonth.year}-${String(previousMonth.month).padStart(2, '0')}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split('-').map(Number)
              setPreviousMonth({ year: y, month: m })
            }}
            className="border rounded-md px-3 py-2"
          />
        </div>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading && <p>Loading...</p>}

      {!loading && comparison && (
        <div>
          {/* Summary card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <p className="text-sm text-gray-500">Total spending</p>
            <p className="text-3xl font-bold">${comparison.current_total.toFixed(2)}</p>
            <p className={comparison.total_change >= 0 ? 'text-red-600' : 'text-green-600'}>
              {comparison.total_change >= 0 ? '↑' : '↓'} ${Math.abs(comparison.total_change).toFixed(2)}
              {comparison.total_percent_change !== null && ` (${comparison.total_percent_change.toFixed(1)}%)`}
              {' '}vs {monthLabel(previousMonth.year, previousMonth.month)}
            </p>
          </div>

          {/* Category breakdown */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {comparison.categories.map((cat) => (
              <div key={cat.category} className="border-b last:border-b-0">
                <button
                  onClick={() => toggleCategory(cat.category)}
                  className="w-full flex justify-between items-center p-4 hover:bg-gray-50 text-left"
                >
                  <div>
                    <p className="font-medium">{cat.category}</p>
                    <p className="text-sm text-gray-500">
                      ${cat.current_amount.toFixed(2)} (was ${cat.previous_amount.toFixed(2)})
                    </p>
                  </div>
                  <div className={`text-right ${cat.change >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    <p className="font-medium">
                      {cat.change >= 0 ? '+' : ''}{cat.change.toFixed(2)}
                    </p>
                    {cat.percent_change !== null && (
                      <p className="text-sm">
                        {cat.change >= 0 ? '+' : ''}{cat.percent_change.toFixed(1)}%
                      </p>
                    )}
                  </div>
                </button>

                {expandedCategory === cat.category && merchantData && (
                  <div className="bg-gray-50 px-4 pb-4">
                    {merchantData.merchants.map((m) => (
                      <div key={m.category} className="flex justify-between py-2 border-t border-gray-200 text-sm">
                        <span>{m.category}</span>
                        <span className={m.change >= 0 ? 'text-red-600' : 'text-green-600'}>
                          {m.change >= 0 ? '+' : ''}${m.change.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MonthlyComparison