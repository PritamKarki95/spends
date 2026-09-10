import { API_BASE_URL } from '../config'
import { Skeleton, EmptyState, Toast } from '../components/Feedback'
import { useState, useEffect } from 'react'
import { Repeat } from 'lucide-react'
import AppHeader from '../components/AppHeader'
import Reveal from '../components/Reveal'
import AnimatedNumber from '../components/AnimatedNumber'

function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [detecting, setDetecting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function fetchSubscriptions() {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/subscriptions`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed to load subscriptions')
      setSubscriptions(await response.json())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function runDetection() {
    setDetecting(true)
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/subscriptions/detect`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Detection failed')
      setMessage('Recurring payment scan completed.')
      await fetchSubscriptions()
    } catch (err) {
      setError(err.message)
    } finally {
      setDetecting(false)
      setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${API_BASE_URL}/subscriptions`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      signal: controller.signal,
    }).then(async response => {
      if (!response.ok) throw new Error('Failed to load subscriptions')
      return response.json()
    }).then(data => { if (!controller.signal.aborted) setSubscriptions(data) })
      .catch(err => { if (!controller.signal.aborted) setError(err.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])

  const totalMonthly = subscriptions.reduce((sum, s) => sum + s.avg_amount, 0)

  return (
    <div className="min-h-screen bg-mist dark:bg-[#0A1F2E] font-sans transition-colors">
      <AppHeader />

      <main className="page-content">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 className="page-title">Recurring Payments</h1>
          <button
            onClick={runDetection}
            disabled={detecting}
            className="px-4 py-2 rounded-lg bg-ocean text-white text-sm font-medium hover:bg-ocean/90 transition-colors disabled:opacity-50"
          >
            {detecting ? 'Scanning...' : 'Re-scan Transactions'}
          </button>
        </div>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <Toast message={message} onClose={() => setMessage('')} />
        {loading && <Skeleton rows={4} label="Loading subscriptions" />}
        {!loading && !error && (
          <>
            <Reveal>
              <div className="rounded-2xl border border-line dark:border-white/10 bg-white dark:bg-[#102A3D] p-6 mb-6">
                <p className="text-xs text-ink/50 dark:text-white/50">Estimated recurring monthly spending</p>
                <p className="font-display text-3xl font-semibold text-ink dark:text-white mt-1">
                  <AnimatedNumber value={totalMonthly} prefix="$" />
                </p>
              </div>
            </Reveal>

            <div className="rounded-2xl border border-line dark:border-white/10 bg-white dark:bg-[#102A3D] overflow-hidden">
              {subscriptions.map((s, i) => (
                <Reveal key={s.id} delay={i * 60}>
                  <div className="flex flex-wrap gap-3 justify-between items-center p-4 border-b border-line dark:border-white/10 last:border-b-0 hover:bg-mist dark:hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 shrink-0 rounded-full bg-teal/10 flex items-center justify-center">
                        <Repeat size={16} className="text-teal" />
                      </div>
                      <div>
                        <p className="font-medium text-ink dark:text-white break-all">{s.merchant}</p>
                        <p className="text-sm text-ink/50 dark:text-white/50">every ~{s.interval_days} days</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-ink dark:text-white">${s.avg_amount.toFixed(2)}/mo</p>
                      <p className="text-xs text-ink/40 dark:text-white/40">{Math.round(s.confidence * 100)}% confidence</p>
                    </div>
                  </div>
                </Reveal>
              ))}
              {subscriptions.length === 0 && <EmptyState title="No recurring payments yet" description="Upload statements, then re-scan to find recurring payments." />}

            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default Subscriptions