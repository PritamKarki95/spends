import { Link } from 'react-router-dom'
import logo from '../assets/logo-mark.png'

function About() {
  return (
    <div className="min-h-screen bg-mist dark:bg-[#0A1F2E] font-sans transition-colors">
      <header className="border-b border-line dark:border-white/10">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link to="/" className="flex items-center gap-2 w-fit">
            <img src={logo} alt="SpendS" className="h-8 w-8 rounded-lg" />
            <span className="font-display font-semibold text-lg text-ink dark:text-white">
              Spend<span className="text-teal">S</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-display text-3xl font-semibold text-ink dark:text-white mb-4">About this project</h1>

        <p className="text-ink/80 dark:text-white/80 leading-relaxed mb-4">
          SpendS is a full-stack financial statement intelligence app — upload a bank
          statement and it automatically extracts, categorizes, and explains your
          spending, with a focus on answering one question: what changed since last
          month, and why.
        </p>

        <p className="text-ink/80 dark:text-white/80 leading-relaxed mb-8">
          Built end to end includes PDF parsing, a rule-based and machine learning
          categorization pipeline (TF-IDF + Logistic Regression), algorithmic
          recurring-payment and anomaly detection, and a full React + FastAPI +
          PostgreSQL stack, containerized and deployed independently.
        </p>

                <div className="flex gap-4">
          
            <a href="https://github.com/PritamKarki95/spends"
            target="_blank" rel="noopener noreferrer"
            className="text-sm text-teal hover:underline"
          >
            View source on GitHub
          </a>
          <a href="https://www.linkedin.com/in/pritamkarki/"
            target="_blank" rel="noopener noreferrer"
            className="text-sm text-teal hover:underline"
          >
            Connect on LinkedIn
          </a>
        </div>
      </main>
    </div>
  )
}

export default About