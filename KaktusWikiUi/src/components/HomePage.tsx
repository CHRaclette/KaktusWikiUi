import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Search, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WIKI_CATEGORIES } from '@/data/wikiStructure'
import type { WikiData } from '@/types/wiki'

interface HomePageProps {
  wikiData: WikiData | null
  loading: boolean
}

// Per-category text colour classes (accent bar colours live in index.css)
const CAT_TEXT: Record<string, string> = {
  allgemeines:    'text-blue-400',
  fabrik:         'text-yellow-400',
  'tower-defense':'text-red-400',
  runen:          'text-purple-400',
  stadt:          'text-orange-400',
  aincraft:       'text-cyan-400',
  farmzone:       'text-green-400',
  bauplaene:      'text-amber-400',
  klassensystem:  'text-rose-400',
  tutorials:      'text-teal-400',
}

export function HomePage({ wikiData, loading }: HomePageProps) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const totalPages   = WIKI_CATEGORIES.reduce((s, c) => s + c.pages.length, 0)
  const scrapedCount = wikiData?.pages.length ?? 0

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  const tutorialSteps = WIKI_CATEGORIES
    .find(c => c.id === 'tutorials')
    ?.pages.filter(p => p.slug.startsWith('erste-schritte')) ?? []

  return (
    <div className="fade-in">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border/50">
        {/* Dot grid texture */}
        <div className="cat-hero-dots" />

        <div className="relative max-w-3xl mx-auto px-5 py-16 sm:py-20 text-center">
          <div className="text-6xl mb-3 select-none">🌵</div>

          <h1 className="font-pixel text-2xl sm:text-3xl text-primary mb-3 leading-tight hero-title">
            KaktusWiki
          </h1>

          <p className="text-muted-foreground/80 text-sm font-mono mb-1">
            Cactus Clicker — Inoffizielle Wiki
          </p>
          <p className="text-muted-foreground/50 text-xs mb-8">
            Alle Infos zu{' '}
            <a href="https://playlegend.net/" target="_blank" rel="noopener noreferrer"
              className="text-primary hover:underline">PlayLegend.net
            </a>
            {' '}— übersichtlich als Kacheln.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto">
            <div className="mc-slot flex items-center gap-2 flex-1 h-11 px-4">
              <Search className="h-4 w-4 text-muted-foreground/60 shrink-0" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Wiki durchsuchen…"
                className="flex-1 bg-transparent text-sm font-mono outline-none placeholder:text-muted-foreground/40 min-w-0"
              />
            </div>
            <button type="submit" className="mc-btn shrink-0">
              Suchen
            </button>
          </form>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-6 mt-6 text-xs font-mono text-muted-foreground/60">
            <span className="flex items-center gap-1.5">
              <span className="mc-stat-dot" />
              {WIKI_CATEGORIES.length} Kategorien
            </span>
            <span className="flex items-center gap-1.5">
              <span className="mc-stat-dot" />
              {totalPages} Seiten
            </span>
            {!loading && wikiData && (
              <span className="flex items-center gap-1.5">
                <span className="mc-stat-dot mc-stat-dot-hi" />
                {scrapedCount} geladen
              </span>
            )}
          </div>
        </div>

        <div className="mc-grass-bar" />
        <div className="mc-dirt-bar" />
      </section>

      {/* ── NO DATA BANNER ───────────────────────────────────────── */}
      {!loading && !wikiData && (
        <div className="max-w-5xl mx-auto px-5 pt-6">
          <div className="callout-warning text-sm flex items-center gap-3">
            <span className="text-xl shrink-0">⚠️</span>
            <div>
              <span className="font-semibold">Wiki noch nicht geladen — </span>
              <span className="text-muted-foreground">
                führe <code className="text-primary font-mono px-1">npm run scrape</code> aus
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── KATEGORIEN ───────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="font-heading text-2xl text-foreground leading-none">Alle Kategorien</h2>
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-xs text-muted-foreground font-mono">{WIKI_CATEGORIES.length} Bereiche</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {WIKI_CATEGORIES.map(cat => {
            const textCls  = CAT_TEXT[cat.id]  ?? 'text-primary'
            const scrapedN = wikiData
              ? cat.pages.filter(p => wikiData.pages.some(wp => wp.slug === p.slug)).length
              : 0
            const progress = wikiData ? scrapedN / cat.pages.length : 0

            return (
              <Link
                key={cat.id}
                to={`/category/${cat.id}`}
                className="mc-slot group flex flex-col transition-all duration-150 hover:-translate-y-0.5 hover:brightness-110 overflow-hidden"
              >
                {/* Top accent bar */}
                <div className={`cat-bar cat-bar-${cat.id}`} />

                <div className="flex flex-col flex-1 p-5">
                  {/* Emoji + chevron */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="mc-slot flex items-center justify-center w-12 h-12 text-2xl shrink-0">
                      {cat.emoji}
                    </div>
                    <ChevronRight className={cn(
                      'h-4 w-4 mt-1 opacity-25 transition-all duration-150',
                      'group-hover:opacity-100 group-hover:translate-x-0.5',
                      textCls
                    )} />
                  </div>

                  <h3 className={cn('font-heading text-xl mb-1 transition-colors leading-tight', textCls)}>
                    {cat.title}
                  </h3>

                  <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground font-mono">
                    <span>{cat.pages.length} Seiten</span>
                    {wikiData && <span className={textCls}>{scrapedN} geladen</span>}
                  </div>

                  {/* Progress bar */}
                  {wikiData && (
                    <div className="mc-progress-track mb-4">
                      <div
                        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                        {...({ style: { '--bar-width': `${progress * 100}%` } } as React.HTMLAttributes<HTMLDivElement>)}
                        className={`progress-bar cat-fill-${cat.id}`}
                      />
                    </div>
                  )}

                  {/* Page preview */}
                  <ul className="flex-1 space-y-1.5 mb-4">
                    {cat.pages.slice(0, 4).map(page => (
                      <li key={page.slug} className="flex items-center gap-2 text-xs text-muted-foreground/80">
                        <span className={cn('text-[10px] shrink-0 opacity-70', textCls)}>▸</span>
                        <span className="truncate">{page.title}</span>
                      </li>
                    ))}
                    {cat.pages.length > 4 && (
                      <li className={cn('text-xs font-mono', textCls)}>
                        +{cat.pages.length - 4} weitere…
                      </li>
                    )}
                  </ul>

                  {/* CTA */}
                  <div className={cn(
                    'pt-3 border-t border-border/40 text-sm font-heading leading-none transition-all',
                    textCls,
                    'group-hover:brightness-125'
                  )}>
                    Alle {cat.pages.length} Seiten ansehen →
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── ERSTE SCHRITTE ───────────────────────────────────────── */}
      {tutorialSteps.length > 0 && (
        <>
          <div className="mc-grass-bar" />
          <div className="mc-dirt-bar" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-10">
            <div className="mc-panel p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="mc-slot flex items-center justify-center w-11 h-11 text-xl shrink-0">🚀</div>
                <h2 className="font-heading text-2xl text-foreground leading-none">Erste Schritte</h2>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {tutorialSteps.map((page, i) => (
                  <Link
                    key={page.slug}
                    to={`/page/${page.slug}`}
                    className="mc-slot group flex items-center gap-3 p-3 hover:brightness-110 transition-all"
                  >
                    <span className="mc-slot flex items-center justify-center w-7 h-7 font-pixel text-[9px] text-primary shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate flex-1 leading-snug font-mono">
                      {page.title.replace(/^\d+\.\s*/, '')}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  )
}
