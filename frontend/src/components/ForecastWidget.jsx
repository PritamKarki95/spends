import { useState, useEffect } from 'react'

function ForecastWidget() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchForecast() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://127.0.0.1:8000/forecast', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) throw new Error('Failed to load forecast')
        setData(await response.json())
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchForecast()
  }, [])

  if (loading) return <div className="bg-white rounded-lg shadow-md p-6 mt-4">Loading forecast...</div>
  if (error) return <div className="bg-white rounded-lg shadow-md p-6 mt-4 text-red-600">{error}</div>
  if (!data || !data.forecast.projection) return null

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-4">
      <h2 className="font-semibold mb-2">Next Month's Projected Spending</h2>
      <p className="text-3xl font-bold">${data.forecast.projection.toFixed(2)}</p>
      <p className="text-sm text-gray-500 mt-1">
        Based on the average of the last {data.forecast.window_used} month{data.forecast.window_used > 1 ? 's' : ''}
      </p>

    </div>
  )
}

export default ForecastWidget