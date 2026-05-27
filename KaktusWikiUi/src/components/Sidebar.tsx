import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ChevronRight, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { WIKI_CATEGORIES } from '@/data/wikiStructure'
import type { WikiData } from '@/types/wiki'

interface SidebarProps {
  wikiData: WikiData | null
  onNavigate?: () => void
}

const CATEGORY_COLORS: Record<string, string> = {
  allgemeines:   'text-blue-500   bg-blue-500/10   border-blue-500/30',
  fabrik:        'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
  'tower-defense':'text-red-500    bg-red-500/10    border-red-500/30',
  runen:         'text-purple-500 bg-purple-500/10 border-purple-500/30',
  stadt:         'text-orange-500 bg-orange-500/10 border-orange-500/30',
  aincraft:      'text-cyan-500   bg-cyan-500/10   border-cyan-500/30',
  farmzone:      'text-green-500  bg-green-500/10  border-green-500/30',
  bauplaene:     'text-amber-500  bg-amber-500/10  border-amber-500/30',
  klassensystem: 'text-rose-500   bg-rose-500/10   border-rose-500/30',
  tutorials:     'text-teal-500   bg-teal-500/10   border-teal-500/30',
}

export function Sidebar({ wikiData, onNavigate }: SidebarProps) {
  const params = useParams()
  const currentSlug = params['*'] || ''
  const scrapedSlugs = new Set(wikiData?.pages.map(p => p.slug) ?? [])

  // Find the category of current page to auto-expand it
  const activeCategory = WIKI_CATEGORIES.find(cat =>
    cat.pages.some(p => p.slug === currentSlug)
  )?.id

  const [openCats, setOpenCats] = useState<Set<string>>(
    () => new Set(activeCategory ? [activeCategory] : ['allgemeines'])
  )
  const [filter, setFilter] = useState('')

  const toggle = (id: string) =>
    setOpenCats(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const filterLower = filter.toLowerCase()

  return (
    <div className="flex flex-col h-full">
      {/* Filter input */}
      <div className="px-3 pt-3 pb-2 shrink-0">
          <div className="mc-slot flex items-center gap-2 h-8 px-2.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filtern…"
            className="flex-1 bg-transparent text-sm font-mono outline-none placeholder:text-muted-foreground/40 min-w-0"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <nav className="sidebar-nav px-2 pb-4">
          {WIKI_CATEGORIES.map(cat => {
            const colorClass = CATEGORY_COLORS[cat.id] ?? 'text-primary bg-primary/10'
            const isOpen = openCats.has(cat.id)

            // Filter pages
            const visiblePages = filter
              ? cat.pages.filter(p => p.title.toLowerCase().includes(filterLower))
              : cat.pages

            if (filter && visiblePages.length === 0) return null

            return (
              <div key={cat.id} className="mb-0.5">
                {/* Category header */}
                <div className="flex items-center gap-1">
                  {/* Category grid link */}
                  <Link
                    to={`/category/${cat.id}`}
                    onClick={onNavigate}
                    title={`Alle ${cat.title}-Seiten als Kacheln`}
                    className={cn(
                      'flex items-center justify-center w-9 h-9 rounded-lg border shrink-0 transition-colors hover:opacity-80',
                      colorClass
                    )}
                  >
                    {cat.emoji}
                  </Link>

                  {/* Expand toggle */}
                  <button
                    type="button"
                    onClick={() => toggle(cat.id)}
                    className={cn(
                      'flex-1 flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-semibold transition-colors',
                      'hover:bg-accent/60',
                      isOpen ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span className="flex-1 text-left truncate font-heading font-semibold text-sm">{cat.title}</span>
                    <span className="text-[10px] text-muted-foreground/60 tabular-nums">{cat.pages.length}</span>
                    <ChevronRight className={cn(
                      'h-3.5 w-3.5 text-muted-foreground/50 shrink-0 transition-transform duration-200',
                      isOpen && 'rotate-90'
                    )} />
                  </button>
                </div>

                {/* Pages list */}
                {(isOpen || filter) && visiblePages.length > 0 && (
                  <ul className="ml-3 pl-3 border-l border-border/50 mt-0.5 mb-1 space-y-0.5">
                    {visiblePages.map(page => {
                      const isActive = currentSlug === page.slug
                      const scraped = scrapedSlugs.has(page.slug)
                      return (
                        <li key={page.slug}>
                          <Link
                            to={`/page/${page.slug}`}
                            onClick={onNavigate}
                            className={cn(
                              'flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm transition-all',
                              isActive
                                ? 'nav-active'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                            )}
                          >
                            <span className="flex-1 truncate leading-snug">{page.title}</span>
                            {!scraped && (
                              <span
                                title="Nicht gescrapt"
                                className="w-1.5 h-1.5 rounded-full bg-muted-foreground/25 shrink-0"
                              />
                            )}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="shrink-0 px-3 py-2 mc-panel border-x-0 border-b-0">
        <p className="text-[10px] text-muted-foreground/50 text-center leading-snug font-mono">
          {wikiData ? (
            <>Gescrapt: {new Date(wikiData.scrapedAt).toLocaleDateString('de-DE')}</>
          ) : (
            <>Führe <code className="text-primary">npm run scrape</code> aus</>
          )}
        </p>
      </div>
    </div>
  )
}
