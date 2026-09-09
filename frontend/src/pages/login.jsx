import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import logo from '../assets/logo-mark.png'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await fetch('http://127.0.0.1:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Login failed')
      }
      const data = await response.json()
      localStorage.setItem('token', data.access_token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex font-sans bg-mist dark:bg-[#0A1F2E] transition-colors">
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-ink items-center justify-center">
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="loginWave" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0E5C82" />
              <stop offset="100%" stopColor="#1FAE7D" />
            </linearGradient>
          </defs>
          <path d="M0 200 C150 260, 50 380, 200 420 C320 450, 180 600, 350 650 L400 800 L0 800 Z" fill="url(#loginWave)" />
        </svg>
        <div className="relative text-center px-12">
          <img src={logo} alt="SpendS" className="h-16 w-16 rounded-2xl mx-auto mb-6" />
          <h1 className="font-display text-3xl font-semibold text-white mb-3">Know where your money goes.</h1>
          <p className="text-white/60 text-sm max-w-xs mx-auto">
            Upload a statement and SpendS shows you exactly what changed, month to month.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <form onSubmit={handleSubmit} className="page-enter w-full max-w-sm">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <img src={logo} alt="SpendS" className="h-8 w-8 rounded-lg" />
            <span className="font-display font-semibold text-lg text-ink dark:text-white">Spend<span className="text-teal">S</span></span>
          </Link>

          <h2 className="font-display text-2xl font-semibold text-ink dark:text-white mb-1">Welcome back</h2>
          <p className="text-sm text-ink/50 dark:text-white/50 mb-6">Log in to see your spending.</p>

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <label className="block text-xs font-medium text-ink/60 dark:text-white/60 mb-1.5">Email</label>
          <input
            type="email" value={email} required
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-line dark:border-white/15 bg-white dark:bg-[#102A3D] text-ink dark:text-white rounded-lg px-3 py-2.5 mb-4 outline-none focus:ring-2 focus:ring-teal/40 transition-shadow"
          />

          <label className="block text-xs font-medium text-ink/60 dark:text-white/60 mb-1.5">Password</label>
          <input
            type="password" value={password} required
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-line dark:border-white/15 bg-white dark:bg-[#102A3D] text-ink dark:text-white rounded-lg px-3 py-2.5 mb-6 outline-none focus:ring-2 focus:ring-teal/40 transition-shadow"
          />

          <button
            type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-ocean to-teal text-white font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>

          <p className="text-sm text-ink/50 dark:text-white/50 mt-5 text-center">
            Don't have an account?{' '}
            <Link to="/register" className="text-teal hover:underline">Register</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default Login