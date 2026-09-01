import { useState } from 'react'

function UploadStatement() {
  const [file, setFile] = useState(null)
  const [statementId, setStatementId] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [step, setStep] = useState('select') // 'select' | 'review' | 'done'
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleUpload(e) {
    e.preventDefault()
    if (!file) return
    setError('')
    setLoading(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://127.0.0.1:8000/statements/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Upload failed')
      }

      const data = await response.json()
      setStatementId(data.statement_id)
      setTransactions(data.transactions)
      setStep('review')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function updateTransaction(index, field, value) {
    setTransactions((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    )
  }

  function removeTransaction(index) {
    setTransactions((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleConfirm() {
    setError('')
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `http://127.0.0.1:8000/statements/${statementId}/confirm`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ transactions }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Import failed')
      }

      setStep('done')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-6">Upload Statement</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {step === 'select' && (
        <form onSubmit={handleUpload} className="bg-white p-6 rounded-lg shadow-md max-w-md">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
            className="mb-4"
          />
          <button
            type="submit"
            disabled={!file || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Upload'}
          </button>
        </form>
      )}

      {step === 'review' && (
        <div>
          <p className="mb-4">We found {transactions.length} transactions. Review before importing:</p>

          <div className="bg-white rounded-lg shadow-md overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-left">Merchant</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-2">
                      <input
                        value={t.date}
                        onChange={(e) => updateTransaction(i, 'date', e.target.value)}
                        className="border rounded px-2 py-1 w-28"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={t.description}
                        onChange={(e) => updateTransaction(i, 'description', e.target.value)}
                        className="border rounded px-2 py-1 w-64"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={t.merchant}
                        onChange={(e) => updateTransaction(i, 'merchant', e.target.value)}
                        className="border rounded px-2 py-1 w-40"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={t.amount}
                        onChange={(e) => updateTransaction(i, 'amount', parseFloat(e.target.value))}
                        className="border rounded px-2 py-1 w-24"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={t.type}
                        onChange={(e) => updateTransaction(i, 'type', e.target.value)}
                        className="border rounded px-2 py-1"
                      >
                        <option value="debit">debit</option>
                        <option value="credit">credit</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => removeTransaction(i)}
                        className="text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleConfirm}
            disabled={loading || transactions.length === 0}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Importing...' : `Confirm Import (${transactions.length})`}
          </button>
        </div>
      )}

      {step === 'done' && (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
          <p className="text-green-700 font-medium">
            Successfully imported {transactions.length} transactions.
          </p>
        </div>
      )}
    </div>
  )
}

export default UploadStatement