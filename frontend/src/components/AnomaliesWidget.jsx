import { API_BASE_URL } from '../config'
import { Skeleton } from './Feedback'
import { useState, useEffect } from 'react'
import { CategoryIcon } from '../utils/categoryIcons'

function AnomaliesWidget() {
  const [anomalies, setAnomalies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchAnomalies() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_BASE_URL}/anomalies`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) throw new Error(`Unable to load unusual transactions (${response.status}).`)
        setAnomalies(await response.json())
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchAnomalies()
  }, [])

  return (
    <div className="bg-white dark:bg-[#102A3D] border border-line dark:border-white/10 rounded-2xl shadow-sm p-6 mt-4">
      <h2 className="font-semibold mb-3">⚠ Unusual Transactions</h2>
      {loading && <Skeleton rows={2} label="Loading unusual transactions" />}
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {!loading && !error && anomalies.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-white/60">
          No unusual transactions detected. Detection requires at least six categorized debit transactions in a category.
        </p>
      )}
      <div className="space-y-2">
        {anomalies.map((a) => (
          <div key={a.id} className="flex flex-wrap gap-3 justify-between items-center text-sm border-b pb-2 last:border-b-0">
            <div>
              <p className="font-medium">{a.description}</p>
              <p className="text-gray-500 dark:text-white/60">
                {a.date} · <span className="inline-flex items-center gap-1 align-middle"><CategoryIcon category={a.category} size={16} />{a.category || 'Uncategorized'}</span> · typical range ${a.category_typical_range[0]}-${a.category_typical_range[1]}
              </p>
            </div>
            <p className="font-medium text-orange-600 dark:text-orange-400">${a.amount.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AnomaliesWidget
