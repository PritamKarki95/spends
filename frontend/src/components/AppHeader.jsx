import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, Sun, Moon } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import logo from '../assets/logo-mark.png'

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/upload', label: 'Upload Statement' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/comparison', label: 'Comparison' },
  { to: '/subscriptions', label: 'Subscriptions' },
  { to: '/about', label: 'About' },
]

function AppHeader() {
  const navigate = useNavigate()
  const [dark, setDark] = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  function handleLogout() {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line dark:border-white/10 bg-mist/90 dark:bg-[#0A1F2E]/90 backdrop-blur">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src={logo} alt="SpendS" className="h-8 w-8 rounded-lg" />
          <span className="font-display font-semibold text-lg text-ink dark:text-white">
            Spend<span className="text-teal">S</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6">
          {NAV_LINKS.map(link => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `text-sm transition-colors ${isActive ? 'text-teal font-medium' : 'text-ink/70 dark:text-white/70 hover:text-ink dark:hover:text-white'}`}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setDark(!dark)}
            aria-label="Toggle dark mode"
            className="h-8 w-8 rounded-full border border-line dark:border-white/20 flex items-center justify-center text-ink dark:text-white text-sm transition-transform hover:scale-105"
          >
            {dark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          </button>
          <button onClick={handleLogout} className="hidden sm:block text-sm text-ink/70 dark:text-white/70 hover:text-ink dark:hover:text-white transition-colors">
            Log out
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            className="lg:hidden text-ink dark:text-white"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div id="mobile-navigation" className="page-enter lg:hidden border-t border-line dark:border-white/10 px-6 py-4 space-y-3">
          {NAV_LINKS.map(link => (
            <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)} className="block text-sm text-ink/80 dark:text-white/80">
              {link.label}
            </Link>
          ))}
          <button onClick={handleLogout} className="block text-sm text-ink/80 dark:text-white/80 pt-2 border-t border-line dark:border-white/10">
            Log out
          </button>
        </div>
      )}
    </header>
  )
}

export default AppHeader
