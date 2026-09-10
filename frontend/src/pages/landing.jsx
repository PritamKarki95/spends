import ProjectFooter from '../components/ProjectFooter'
import { Link } from 'react-router-dom'
import logo from '../assets/logo-mark.png'
import Reveal from '../components/Reveal'

function Landing() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-mist dark:bg-[#0A1F2E] transition-colors">
      <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-6 py-16">
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none"
          viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true"
        >
          <defs>
            <linearGradient id="landingWave" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0E5C82" />
              <stop offset="100%" stopColor="#1FAE7D" />
            </linearGradient>
          </defs>
          <path d="M0 100 C200 180, 100 300, 300 340 C500 380, 300 500, 500 560 L800 600 L800 0 L0 0 Z" fill="url(#landingWave)" />
        </svg>

        <Reveal>
          <div className="relative text-center">
            <Link to="/" aria-label="SpendS home" className="block w-fit mx-auto mb-6 rounded-2xl">
              <img src={logo} alt="SpendS" className="h-16 w-16 rounded-2xl" />
            </Link>
            <h1 className="font-display text-4xl md:text-5xl font-semibold text-ink dark:text-white">
              Spend<span className="text-teal">S</span>
            </h1>
            <p className="mt-3 text-ink/60 dark:text-white/60 max-w-sm mx-auto">
              Upload a statement and see exactly what changed, month to month and why.
            </p>

            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              <Link
                to="/login"
                className="px-5 py-2.5 bg-gradient-to-r from-ocean to-teal text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 border border-line dark:border-white/20 text-ink dark:text-white font-medium rounded-lg hover:bg-white dark:hover:bg-white/5 transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
        </Reveal>
      </main>

      <ProjectFooter />
    </div>
  )
}

export default Landing