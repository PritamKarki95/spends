import { API_BASE_URL } from '../config'
import { useState, useEffect } from 'react'
import { Skeleton, EmptyState, Toast } from '../components/Feedback'
import AppHeader from '../components/AppHeader'
import { CategoryIcon } from '../utils/categoryIcons'
import { Plus, Search } from 'lucide-react'

function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [type, setType] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [clearing, setClearing] = useState(false)
  const [clearMessage, setClearMessage] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editValues, setEditValues] = useState({})

  const [showAddForm, setShowAddForm] = useState(false)
  const [newTxn, setNewTxn] = useState({
  date: '', description: '', merchant: '', amount: '', type: 'debit',
})

  useEffect(() => {
    const controller = new AbortController()
    const token = localStorage.getItem('token')

    fetch(`${API_BASE_URL}/transactions`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Failed to load transactions')
        return response.json()
      })
      .then(setTransactions)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [])

  function handleSearchSubmit(e) {
    e.preventDefault()
    setEditingId(null)
  }

  function startEdit(t) {
    setEditingId(t.id)
    setEditValues({ ...t })
  }

  async function saveEdit(id) {
    setError('')
    try {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        date: editValues.date,
        description: editValues.description,
        merchant: editValues.merchant,
        amount: parseFloat(editValues.amount),
        type: editValues.type,
      }),
    })

    if (!response.ok) throw new Error('Unable to update transaction.')
    if (response.ok) {
      const updated = await response.json()
      setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)))
      setEditingId(null)
      setClearMessage('Transaction updated.')
    }
    } catch (err) { setError(err.message) }
  }

  async function handleAddTransaction(e) {
    e.preventDefault()
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: newTxn.date,
          description: newTxn.description,
          merchant: newTxn.merchant,
          amount: parseFloat(newTxn.amount),
          type: newTxn.type,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.detail || 'Failed to add transaction')
      }

      const created = await response.json()
      setTransactions((prev) => [created, ...prev])
      setNewTxn({ date: '', description: '', merchant: '', amount: '', type: 'debit' })
      setShowAddForm(false)
      setClearMessage('Transaction added.')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id) {
    setError('')
    try {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) throw new Error('Unable to delete transaction.')
    if (response.status === 204) {
      setTransactions((prev) => prev.filter((t) => t.id !== id))
      setClearMessage('Transaction deleted.')
    }
    } catch (err) { setError(err.message) }
  }

  async function handleClearAll() {
    const confirmed = window.confirm(
      'This will permanently delete ALL your transactions and detected subscriptions. This cannot be undone. Continue?'
    )
    if (!confirmed) return

    setClearing(true)
    setError('')
    setClearMessage('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/transactions/all`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed to clear transaction data. Please try again.')
      setTransactions([])
      setEditingId(null)
      setClearMessage('All transactions and detected subscriptions have been cleared.')
    } catch (err) {
      setError(err.message)
    } finally {
      setClearing(false)
    }
  }

  const categories = [...new Set(transactions.map(t => t.category || 'Uncategorized'))].sort()
  const invalidDates = dateFrom && dateTo && dateFrom > dateTo
  const filtered = transactions.filter(t =>
    (!search || `${t.description} ${t.merchant || ''}`.toLowerCase().includes(search.toLowerCase())) &&
    (!category || (t.category || 'Uncategorized') === category) &&
    (!type || t.type === type) && (!dateFrom || t.date >= dateFrom) && (!dateTo || t.date <= dateTo)
  )
  function resetFilters() { setSearch(''); setCategory(''); setType(''); setDateFrom(''); setDateTo('') }

  return (
    <div className="min-h-screen bg-mist dark:bg-[#0A1F2E]">
      <AppHeader />
      <main className="page-content page-enter">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">Transactions</h1>
        <button
          type="button"
          onClick={handleClearAll}
          disabled={loading || clearing}
          className="text-sm text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
        >
          {clearing ? 'Clearing...' : 'Clear all transaction data'}
        </button>
      </div>
      <Toast message={clearMessage} onClose={() => setClearMessage('')} />

      <div className="surface p-4 mb-5 space-y-4">
      <form onSubmit={handleSearchSubmit} className="mb-4 flex flex-wrap gap-2">
        <input
          type="text"
          aria-label="Search transactions"
          placeholder="Search description or merchant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border dark:border-white/20 bg-white dark:bg-[#102A3D] text-ink dark:text-white rounded-md px-3 py-2 w-64"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <span className="inline-flex items-center gap-2"><Search size={16} aria-hidden="true" />Search</span>
        </button>
      </form>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="text-sm grid gap-1">Category<select className="field" value={category} onChange={e => setCategory(e.target.value)}><option value="">All categories</option>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
        <label className="text-sm grid gap-1">Type<select className="field" value={type} onChange={e => setType(e.target.value)}><option value="">All transactions</option><option value="debit">Debit</option><option value="credit">Credit</option></select></label>
        <label className="text-sm grid gap-1">From<input className="field" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></label>
        <label className="text-sm grid gap-1">To<input className="field" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></label>
      </div>
      {invalidDates && <p role="alert" className="text-sm text-red-600 dark:text-red-400">Start date must be before the end date.</p>}
      <div className="flex flex-wrap gap-3 justify-between text-sm"><p role="status">{loading ? 'Loading results?' : `${filtered.length} of ${transactions.length} transactions`}</p><button type="button" onClick={resetFilters} className="text-teal hover:underline">Reset filters</button></div>
      </div>

      <button
  onClick={() => setShowAddForm(!showAddForm)}
  className="mb-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
>
  <span className="inline-flex items-center gap-2"><Plus size={16} aria-hidden="true" className={`transition-transform ${showAddForm ? 'rotate-45' : ''}`} />{showAddForm ? 'Cancel' : 'Add Transaction'}</span>
</button>

{showAddForm && (
  <form onSubmit={handleAddTransaction} className="mb-4 surface p-4 flex gap-2 flex-wrap items-end">
    <div>
      <label className="block text-xs text-gray-600 dark:text-white/70">Date</label>
      <input
        type="date"
        required
        value={newTxn.date}
        onChange={(e) => setNewTxn({ ...newTxn, date: e.target.value })}
        className="border dark:border-white/20 bg-white dark:bg-[#102A3D] text-ink dark:text-white rounded px-2 py-1"
      />
    </div>
    <div>
      <label className="block text-xs text-gray-600 dark:text-white/70">Description</label>
      <input
        required
        value={newTxn.description}
        onChange={(e) => setNewTxn({ ...newTxn, description: e.target.value })}
        className="border dark:border-white/20 bg-white dark:bg-[#102A3D] text-ink dark:text-white rounded px-2 py-1"
      />
    </div>
    <div>
      <label className="block text-xs text-gray-600 dark:text-white/70">Merchant</label>
      <input
        value={newTxn.merchant}
        onChange={(e) => setNewTxn({ ...newTxn, merchant: e.target.value })}
        className="border dark:border-white/20 bg-white dark:bg-[#102A3D] text-ink dark:text-white rounded px-2 py-1"
      />
    </div>
    <div>
      <label className="block text-xs text-gray-600 dark:text-white/70">Amount</label>
      <input
        type="number"
        step="0.01"
        required
        value={newTxn.amount}
        onChange={(e) => setNewTxn({ ...newTxn, amount: e.target.value })}
        className="border dark:border-white/20 bg-white dark:bg-[#102A3D] text-ink dark:text-white rounded px-2 py-1 w-24"
      />
    </div>
    <div>
      <label className="block text-xs text-gray-600 dark:text-white/70">Type</label>
      <select
        value={newTxn.type}
        onChange={(e) => setNewTxn({ ...newTxn, type: e.target.value })}
        className="border dark:border-white/20 bg-white dark:bg-[#102A3D] text-ink dark:text-white rounded px-2 py-1"
      >
        <option value="debit">debit</option>
        <option value="credit">credit</option>
      </select>
    </div>
    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
      Save
    </button>
  </form>
)}

      {error && <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>}
      {loading && <Skeleton rows={5} label="Loading transactions" />}

      {!loading && (
        <div className="surface overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 dark:bg-white/5">
              <tr>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-left">Merchant</th>
                <th className="px-4 py-2 text-left">Amount</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-t dark:border-white/10 transition-colors hover:bg-mist dark:hover:bg-white/5">
                  {editingId === t.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          value={editValues.date}
                          onChange={(e) => setEditValues({ ...editValues, date: e.target.value })}
                          className="border dark:border-white/20 bg-white dark:bg-[#102A3D] text-ink dark:text-white rounded px-2 py-1 w-28"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={editValues.description}
                          onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                          className="border dark:border-white/20 bg-white dark:bg-[#102A3D] text-ink dark:text-white rounded px-2 py-1 w-56"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={editValues.merchant || ''}
                          onChange={(e) => setEditValues({ ...editValues, merchant: e.target.value })}
                          className="border dark:border-white/20 bg-white dark:bg-[#102A3D] text-ink dark:text-white rounded px-2 py-1 w-40"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={editValues.amount}
                          onChange={(e) => setEditValues({ ...editValues, amount: e.target.value })}
                          className="border dark:border-white/20 bg-white dark:bg-[#102A3D] text-ink dark:text-white rounded px-2 py-1 w-24"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={editValues.type}
                          onChange={(e) => setEditValues({ ...editValues, type: e.target.value })}
                          className="border dark:border-white/20 bg-white dark:bg-[#102A3D] text-ink dark:text-white rounded px-2 py-1"
                        >
                          <option value="debit">debit</option>
                          <option value="credit">credit</option>
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center gap-2"><CategoryIcon category={editValues.category} />{editValues.category || 'Uncategorized'}</span>
                      </td>
                      <td className="px-4 py-2 space-x-2">
                        <button onClick={() => saveEdit(t.id)} className="text-green-700 dark:text-green-400 hover:underline">
                          Save
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-gray-500 dark:text-white/60 hover:underline">
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2">{t.date}</td>
                      <td className="px-4 py-2">{t.description}</td>
                      <td className="px-4 py-2">{t.merchant}</td>
                      <td className="px-4 py-2">${t.amount.toFixed(2)}</td>
                      <td className="px-4 py-2">{t.type}</td>
                      <td className="px-4 py-2"><span className="inline-flex items-center gap-2"><CategoryIcon category={t.category} />{t.category || 'Uncategorized'}</span></td>
                      <td className="px-4 py-2 space-x-2">
                        <button onClick={() => startEdit(t)} className="text-blue-600 dark:text-blue-400 hover:underline">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="text-red-600 dark:text-red-400 hover:underline">
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!error && filtered.length === 0 && <EmptyState title={transactions.length ? 'No matching transactions' : 'No transactions yet'} description={transactions.length ? 'Try another category, date range, or search term.' : undefined} upload={!transactions.length}>{transactions.length > 0 && <button onClick={resetFilters} className="mt-4 text-teal hover:underline">Reset filters</button>}</EmptyState>}
        </div>
      )}
      </main>
    </div>
  )
}

export default Transactions
