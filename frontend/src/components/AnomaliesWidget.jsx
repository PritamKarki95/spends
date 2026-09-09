import { useState, useEffect } from 'react'

function AnomaliesWidget() {
  const [anomalies, setAnomalies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchAnomalies() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://127.0.0.1:8000/anomalies', {
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
    <div className="bg-white rounded-lg shadow-md p-6 mt-4">
      <h2 className="font-semibold mb-3">⚠ Unusual Transactions</h2>
      {loading && <p className="text-sm text-gray-500">Loading unusual transactions...</p>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {!loading && !error && anomalies.length === 0 && (
        <p className="text-sm text-gray-500">
          No unusual transactions detected. Detection requires at least six categorized debit transactions in a category.
        </p>
      )}
      <div className="space-y-2">
        {anomalies.map((a) => (
          <div key={a.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-b-0">
            <div>
              <p className="font-medium">{a.description}</p>
              <p className="text-gray-500">
                {a.date} · {a.category} · typical range ${a.category_typical_range[0]}-${a.category_typical_range[1]}
              </p>
            </div>
            <p className="font-medium text-orange-600">${a.amount.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AnomaliesWidget
