import { useState, useEffect } from 'react'

function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editValues, setEditValues] = useState({})

  const [showAddForm, setShowAddForm] = useState(false)
  const [newTxn, setNewTxn] = useState({
  date: '', description: '', merchant: '', amount: '', type: 'debit',
})

  async function fetchTransactions() {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (search) params.append('search', search)

      const response = await fetch(`http://127.0.0.1:8000/transactions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error('Failed to load transactions')
      const data = await response.json()
      setTransactions(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    const token = localStorage.getItem('token')

    fetch('http://127.0.0.1:8000/transactions', {
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
    fetchTransactions()
  }

  function startEdit(t) {
    setEditingId(t.id)
    setEditValues({ ...t })
  }

  async function saveEdit(id) {
    const token = localStorage.getItem('token')
    const response = await fetch(`http://127.0.0.1:8000/transactions/${id}`, {
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

    if (response.ok) {
      const updated = await response.json()
      setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)))
      setEditingId(null)
    }
  }

  async function handleAddTransaction(e) {
    e.preventDefault()
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://127.0.0.1:8000/transactions', {
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
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id) {
    const token = localStorage.getItem('token')
    const response = await fetch(`http://127.0.0.1:8000/transactions/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.status === 204) {
      setTransactions((prev) => prev.filter((t) => t.id !== id))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-6">Transactions</h1>

      <form onSubmit={handleSearchSubmit} className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Search description or merchant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-md px-3 py-2 w-64"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Search
        </button>
      </form>

      <button
  onClick={() => setShowAddForm(!showAddForm)}
  className="mb-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
>
  {showAddForm ? 'Cancel' : '+ Add Transaction'}
</button>

{showAddForm && (
  <form onSubmit={handleAddTransaction} className="mb-4 bg-white p-4 rounded-lg shadow-md flex gap-2 flex-wrap items-end">
    <div>
      <label className="block text-xs text-gray-600">Date</label>
      <input
        type="date"
        required
        value={newTxn.date}
        onChange={(e) => setNewTxn({ ...newTxn, date: e.target.value })}
        className="border rounded px-2 py-1"
      />
    </div>
    <div>
      <label className="block text-xs text-gray-600">Description</label>
      <input
        required
        value={newTxn.description}
        onChange={(e) => setNewTxn({ ...newTxn, description: e.target.value })}
        className="border rounded px-2 py-1"
      />
    </div>
    <div>
      <label className="block text-xs text-gray-600">Merchant</label>
      <input
        value={newTxn.merchant}
        onChange={(e) => setNewTxn({ ...newTxn, merchant: e.target.value })}
        className="border rounded px-2 py-1"
      />
    </div>
    <div>
      <label className="block text-xs text-gray-600">Amount</label>
      <input
        type="number"
        step="0.01"
        required
        value={newTxn.amount}
        onChange={(e) => setNewTxn({ ...newTxn, amount: e.target.value })}
        className="border rounded px-2 py-1 w-24"
      />
    </div>
    <div>
      <label className="block text-xs text-gray-600">Type</label>
      <select
        value={newTxn.type}
        onChange={(e) => setNewTxn({ ...newTxn, type: e.target.value })}
        className="border rounded px-2 py-1"
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

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading && <p>Loading...</p>}

      {!loading && (
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
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
              {transactions.map((t) => (
                <tr key={t.id} className="border-t">
                  {editingId === t.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          value={editValues.date}
                          onChange={(e) => setEditValues({ ...editValues, date: e.target.value })}
                          className="border rounded px-2 py-1 w-28"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={editValues.description}
                          onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                          className="border rounded px-2 py-1 w-56"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={editValues.merchant || ''}
                          onChange={(e) => setEditValues({ ...editValues, merchant: e.target.value })}
                          className="border rounded px-2 py-1 w-40"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={editValues.amount}
                          onChange={(e) => setEditValues({ ...editValues, amount: e.target.value })}
                          className="border rounded px-2 py-1 w-24"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={editValues.type}
                          onChange={(e) => setEditValues({ ...editValues, type: e.target.value })}
                          className="border rounded px-2 py-1"
                        >
                          <option value="debit">debit</option>
                          <option value="credit">credit</option>
                        </select>
                      </td>
                      <td className="px-4 py-2 space-x-2">
                        <button onClick={() => saveEdit(t.id)} className="text-green-700 hover:underline">
                          Save
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-gray-500 hover:underline">
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
                      <td className="px-4 py-2">{t.category || 'Uncategorized'}</td>
                      <td className="px-4 py-2 space-x-2">
                        <button onClick={() => startEdit(t)} className="text-blue-600 hover:underline">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:underline">
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <p className="p-4 text-gray-500">No transactions found.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default Transactions
