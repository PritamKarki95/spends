import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, FileUp, Tags, ChartNoAxesCombined, Repeat2, ScanLine, TrendingUp, Code2, Layers, Sun, Moon } from 'lucide-react'
import logo from '../assets/logo-mark.png'
import Reveal from '../components/Reveal'
import ProjectFooter from '../components/ProjectFooter'
import { useTheme } from '../hooks/useTheme'

const FEATURES = [
  { Icon: FileUp, title: 'From PDF to a clear picture', text: 'Extract transactions from supported statements, review the details, and import when you are ready.' },
  { Icon: Tags, title: 'Give every purchase context', text: 'Group spending into categories with a rule-based pipeline and support for machine learning categorization.' },
  { Icon: ChartNoAxesCombined, title: 'Understand what changed', text: 'Compare months, explore categories, and drill down to the merchants and transactions behind the numbers.' },
  { Icon: Repeat2, title: 'Spot the repeat payments', text: 'Find recurring charges by looking for patterns in merchant, amount, and payment timing.' },
  { Icon: ScanLine, title: 'Notice the unusual', text: 'Highlight transactions outside a category’s typical range so you can take a closer look.' },
  { Icon: TrendingUp, title: 'Look one month ahead', text: 'Use a moving average of recorded spending to estimate what the next month might look like.' },
]

export default function About() {
  const [dark, setDark] = useTheme()
  return (
    <div className="min-h-screen flex flex-col bg-mist dark:bg-[#0A1F2E] font-sans text-ink dark:text-white transition-colors">
      <header className="border-b border-line dark:border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-2 font-display font-semibold text-lg"><img src={logo} alt="" className="h-8 w-8 rounded-lg" /><span>Spend<span className="text-teal">S</span></span></Link>
          <div className="flex items-center gap-4">
            <button onClick={() => setDark(!dark)} aria-label="Toggle dark mode" className="rounded-full border border-line dark:border-white/20 p-2">{dark ? <Sun size={17} /> : <Moon size={17} />}</button>
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-ink/60 dark:text-white/60 hover:text-teal"><ArrowLeft size={16} aria-hidden="true" />Back home</Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-line dark:border-white/10">
          <div aria-hidden="true" className="absolute -right-20 -top-20 h-80 w-80 rounded-full border-[40px] border-teal/5" />
          <div className="max-w-6xl mx-auto px-6 py-14 sm:py-20 relative grid lg:grid-cols-[1.4fr_1fr] gap-10 items-center">
            <Reveal>
              <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-teal mb-5"><Layers size={15} aria-hidden="true" />Behind the project</p>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.12]">Your spending.<br /><span className="text-teal">A clearer story.</span></h1>
              <p className="mt-6 max-w-xl text-base sm:text-lg text-ink/65 dark:text-white/65 leading-relaxed">SpendS turns financial statements into a view you can actually explore. Less time sorting transactions. More context for the question: what changed this month, and why?</p>
              <Link to="/register" className="inline-flex items-center gap-2 mt-7 px-5 py-3 rounded-xl bg-ocean text-white text-sm font-medium hover:opacity-90 transition-opacity">Explore your spending<ArrowRight size={17} aria-hidden="true" /></Link>
            </Reveal>
            <Reveal delay={120}>
              <div className="surface p-6 sm:p-8 relative">
                <p className="text-xs uppercase tracking-widest text-ink/50 dark:text-white/50 mb-6">The idea is simple</p>
                <ol className="space-y-6">
                  {[[FileUp, 'Bring your statement', 'Start with a supported PDF.'], [Tags, 'Review the details', 'Check and edit extracted transactions.'], [ChartNoAxesCombined, 'See the bigger picture', 'Explore patterns, changes, and trends.']].map(([Icon, title, text], i) => <li key={title} className="flex gap-4"><div className="h-10 w-10 shrink-0 rounded-xl bg-teal/10 text-teal flex items-center justify-center"><Icon size={20} aria-hidden="true" /></div><div><p className="font-display font-medium"><span className="text-teal mr-2 text-xs">0{i + 1}</span>{title}</p><p className="text-sm mt-1 text-ink/60 dark:text-white/60">{text}</p></div></li>)}
                </ol>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-14 sm:py-18" aria-labelledby="features-title">
          <p className="text-xs uppercase tracking-widest text-teal font-semibold mb-3">Built for the details</p>
          <h2 id="features-title" className="font-display text-2xl sm:text-3xl font-semibold mb-8">One statement. More perspective.</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ Icon, title, text }, i) => <Reveal key={title} delay={(i % 3) * 60} className="h-full"><article className="surface h-full p-6 motion-safe:hover:-translate-y-1 hover:shadow-md transition-all duration-200"><div className="inline-flex rounded-xl bg-ocean/10 dark:bg-teal/10 p-3 text-ocean dark:text-teal mb-5"><Icon size={22} aria-hidden="true" /></div><h3 className="font-display font-semibold mb-2">{title}</h3><p className="text-sm leading-relaxed text-ink/60 dark:text-white/60">{text}</p></article></Reveal>)}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 pb-14">
          <div className="rounded-2xl bg-ink text-white p-7 sm:p-10 grid md:grid-cols-2 gap-8 items-center">
            <div><Code2 size={26} className="text-teal mb-4" aria-hidden="true" /><h2 className="font-display text-2xl font-semibold">Built end to end.</h2><p className="text-sm leading-relaxed text-white/65 mt-3">A project by Pritam Karki, connecting document parsing, data analysis, and an interactive interface. Explore the source to see how the pieces fit together.</p></div>
            <div><ul aria-label="Project technologies" className="flex flex-wrap gap-2 mb-6">{['React', 'Tailwind CSS', 'FastAPI', 'PostgreSQL', 'Python', 'scikit-learn'].map(name => <li key={name} className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80">{name}</li>)}</ul><a href="https://github.com/PritamKarki95/spends" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-teal text-sm hover:underline">View the source<ArrowRight size={16} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a></div>
          </div>
        </section>
      </main>
      <ProjectFooter />
    </div>
  )
}
