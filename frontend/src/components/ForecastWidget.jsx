import { API_BASE_URL } from '../config'
import { Skeleton, EmptyState } from './Feedback'
import { useState, useEffect } from 'react'

function ForecastWidget() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchForecast() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_BASE_URL}/forecast`, {
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

  if (loading) return <Skeleton rows={2} label="Loading forecast" />
  if (error) return <div className="bg-white dark:bg-[#102A3D] rounded-lg shadow-md p-6 mt-4 text-red-600 dark:text-red-400">{error}</div>
  if (data?.forecast?.projection == null) return <div className="surface"><EmptyState title="Not enough history for a forecast" description="Import more months to see a spending projection." /></div>

  return (
    <div className="bg-white dark:bg-[#102A3D] border border-line dark:border-white/10 rounded-2xl shadow-sm p-6 mt-4">
      <h2 className="font-semibold mb-2">Next Month's Projected Spending</h2>
      <p className="text-3xl font-bold">${data.forecast.projection.toFixed(2)}</p>
      <p className="text-sm text-gray-500 dark:text-white/60 mt-1">
        Based on the average of the last {data.forecast.window_used} month{data.forecast.window_used > 1 ? 's' : ''}
      </p>

    </div>
  )
}

export default ForecastWidget