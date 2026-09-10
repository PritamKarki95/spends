import { Link, useLocation } from 'react-router-dom'
import { ArrowUpRight, Code2, UserRound, Sparkles } from 'lucide-react'
import logo from '../assets/logo-mark.png'

export default function ProjectFooter() {
  const { pathname } = useLocation()
  return (
    <footer className="border-t border-line dark:border-white/10 bg-white/50 dark:bg-white/[0.02]">
      <div className="max-w-6xl mx-auto px-6 py-5 sm:py-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 font-display font-semibold text-ink dark:text-white">
            <img src={logo} alt="" className="h-7 w-7 rounded-lg" />Spend<span className="-ml-2 text-teal">S</span>
          </Link>
          <p className="mt-2 text-xs text-ink/50 dark:text-white/50">Built by Pritam Karki</p>
        </div>
        <nav aria-label="Project links" className="flex flex-wrap gap-2 text-sm">
          <Link to={pathname === '/about' ? '/' : '/about'} className="group inline-flex items-center gap-2 rounded-lg px-3 py-2 text-ocean dark:text-teal hover:bg-ocean/5 dark:hover:bg-white/5 transition-colors">
            <Sparkles size={16} aria-hidden="true" />{pathname === '/about' ? 'Explore SpendS' : 'About this project'}<ArrowUpRight size={14} aria-hidden="true" className="motion-safe:group-hover:-translate-y-0.5 transition-transform" />
          </Link>
          <a href="https://github.com/PritamKarki95/spends" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-ink/70 dark:text-white/70 hover:bg-ocean/5 dark:hover:bg-white/5"><Code2 size={16} aria-hidden="true" />Source<span className="sr-only"> on GitHub (opens in a new tab)</span></a>
          <a href="https://www.linkedin.com/in/pritamkarki/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-ink/70 dark:text-white/70 hover:bg-ocean/5 dark:hover:bg-white/5"><UserRound size={16} aria-hidden="true" />Connect<span className="sr-only"> on LinkedIn (opens in a new tab)</span></a>
        </nav>
      </div>
    </footer>
  )
}
