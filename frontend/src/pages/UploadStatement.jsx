import { Link } from 'react-router-dom'
import { Check, Upload, FileCheck, CheckCircle2 } from 'lucide-react'
import { Skeleton, EmptyState, Toast } from '../components/Feedback'
import { useState } from 'react'
import AppHeader from '../components/AppHeader'

function UploadStatement() {
  const [message, setMessage] = useState('')
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
      setMessage('Statement processed. Review the extracted transactions.')
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
      setMessage('Transactions imported successfully.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-mist dark:bg-[#0A1F2E]">
      <AppHeader />
      <main className="page-content page-enter">
      <h1 className="page-title mb-6">Upload Statement</h1>

      <Toast message={message} onClose={() => setMessage('')} />
      <ol aria-label="Import progress" className="grid grid-cols-3 gap-2 mb-6">
        {[['select', 'Upload', Upload], ['review', 'Review', FileCheck], ['done', 'Complete', CheckCircle2]].map(([key, label, Icon], index) => {
          const current = ['select', 'review', 'done'].indexOf(step)
          return <li key={key} aria-current={step === key ? 'step' : undefined} className={`surface p-3 flex flex-col sm:flex-row items-center gap-2 text-sm ${index <= current ? 'text-teal border-teal' : 'opacity-60'}`}>
            {index < current ? <Check size={18} aria-hidden="true" /> : <Icon size={18} aria-hidden="true" />}<span>{label}</span>
          </li>
        })}
      </ol>
      {file && <p className="mb-4 text-sm break-all text-ink/60 dark:text-white/60">Selected file: {file.name}</p>}
      {loading && <div className="mb-5"><Skeleton rows={2} label={step === 'select' ? 'Processing statement' : 'Importing transactions'} /></div>}
      {error && <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>}

      {step === 'select' && (
        <form onSubmit={handleUpload} className="surface p-6 max-w-md">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
            aria-label="Choose a PDF statement"
            disabled={loading}
            className="mb-4 block w-full min-w-0 text-sm file:mr-3 file:rounded-lg file:bg-ocean/10 file:px-3 file:py-2 file:text-ocean dark:file:text-teal"
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
          {transactions.length === 0 && <EmptyState upload={false} title="No transactions to import" description="Try another PDF statement."><button className="mt-4 text-teal hover:underline" onClick={() => setStep('select')}>Choose another file</button></EmptyState>}
          <p className="mb-4">We found {transactions.length} transactions. Review before importing:</p>

          <div className="surface overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 dark:bg-white/5">
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
                  <tr key={i} className="border-t dark:border-white/10">
                    <td className="px-4 py-2">
                      <input
                        value={t.date}
                        onChange={(e) => updateTransaction(i, 'date', e.target.value)}
                        className="border dark:border-white/20 bg-white dark:bg-[#102A3D] text-ink dark:text-white rounded px-2 py-1 w-28"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={t.description}
                        onChange={(e) => updateTransaction(i, 'description', e.target.value)}
                        className="border dark:border-white/20 bg-white dark:bg-[#102A3D] text-ink dark:text-white rounded px-2 py-1 w-64"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        value={t.merchant}
                        onChange={(e) => updateTransaction(i, 'merchant', e.target.value)}
                        className="border dark:border-white/20 bg-white dark:bg-[#102A3D] text-ink dark:text-white rounded px-2 py-1 w-40"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={t.amount}
                        onChange={(e) => updateTransaction(i, 'amount', parseFloat(e.target.value))}
                        className="border dark:border-white/20 bg-white dark:bg-[#102A3D] text-ink dark:text-white rounded px-2 py-1 w-24"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={t.type}
                        onChange={(e) => updateTransaction(i, 'type', e.target.value)}
                        className="border dark:border-white/20 bg-white dark:bg-[#102A3D] text-ink dark:text-white rounded px-2 py-1"
                      >
                        <option value="debit">debit</option>
                        <option value="credit">credit</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => removeTransaction(i)}
                        className="text-red-600 dark:text-red-400 hover:underline"
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
        <div className="surface p-6 max-w-md">
          <p className="text-green-700 dark:text-green-400 font-medium">
            Successfully imported {transactions.length} transactions.
          </p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm"><Link to="/transactions" className="text-teal hover:underline">View transactions</Link><button onClick={() => { setStep('select'); setFile(null); setTransactions([]); setStatementId(null) }} className="text-ocean dark:text-teal hover:underline">Upload another statement</button></div>
        </div>
      )}
      </main>
    </div>
  )
}

export default UploadStatement
