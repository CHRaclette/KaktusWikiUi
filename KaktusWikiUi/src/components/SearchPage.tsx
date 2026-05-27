import { useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, FileText, ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { WikiData } from '@/types/wiki'
import { WIKI_CATEGORIES } from '@/data/wikiStructure'

interface SearchPageProps {
  wikiData: WikiData | null
  loading: boolean
}

const CATEGORY_COLORS: Record<string, string> = {
  'Allgemeines':    'text-blue-500   bg-blue-500/10',
  'Fabrik':         'text-yellow-500 bg-yellow-500/10',
  'Tower Defense':  'text-red-500    bg-red-500/10',
  'Runen':          'text-purple-500 bg-purple-500/10',
  'Stadt':          'text-orange-500 bg-orange-500/10',
  'Aincraft':       'text-cyan-500   bg-cyan-500/10',
  'Farmzone':       'text-green-500  bg-green-500/10',
  'Baupläne':       'text-amber-500  bg-amber-500/10',
  'Klassensystem':  'text-rose-500   bg-rose-500/10',
  'Tutorials':      'text-teal-500   bg-teal-500/10',
}

function highlight(text: string, q: string) {
  if (!q.trim()) return <>{text}</>
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/25 text-primary rounded-sm px-0.5 not-italic">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  )
}

export function SearchPage({ wikiData, loading }: SearchPageProps) {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''

  const results = useMemo(() => {
    if (!query.trim() || !wikiData) return []
    const q = query.toLowerCase()

    return wikiData.pages
      .map(page => {
        let score = 0
        let excerpt = ''

        const titleMatch = page.title.toLowerCase().includes(q)
        if (titleMatch) score += 10
        if (page.title.toLowerCase().startsWith(q)) score += 5

        for (const block of page.blocks) {
          if (block.type === 'paragraph') {
            const lower = block.content.toLowerCase()
            if (lower.includes(q)) {
              score += 2
              if (!excerpt) {
                const idx = lower.indexOf(q)
                const start = Math.max(0, idx - 60)
                const end = Math.min(block.content.length, idx + q.length + 120)
                excerpt = (start > 0 ? '…' : '') + block.content.slice(start, end) + (end < block.content.length ? '…' : '')
              }
            }
          } else if (block.type === 'heading' && block.content.toLowerCase().includes(q)) {
            score += 3
          } else if (block.type === 'list') {
            if (block.items.some(item => item.toLowerCase().includes(q))) score += 1
          } else if (block.type === 'table') {
            const flat = [...block.headers, ...block.rows.flat()].join(' ').toLowerCase()
            if (flat.includes(q)) score += 1
          }
        }

        if (!excerpt) {
          const first = page.blocks.find(b => b.type === 'paragraph')
          if (first && first.type === 'paragraph') {
            excerpt = first.content.slice(0, 180) + (first.content.length > 180 ? '…' : '')
          }
        }

        const cat = WIKI_CATEGORIES.find(c => c.pages.some(p => p.slug === page.slug))
        return { ...page, excerpt, score, cat }
      })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 50)
  }, [query, wikiData])

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary shrink-0">
          <Search className="h-4 w-4" />
        </div>
        <div>
          <h1 className="font-heading font-bold text-xl text-foreground leading-none">
            "{query}"
          </h1>
          {!loading && wikiData && (
            <p className="text-xs text-muted-foreground mt-1">
              {results.length} Ergebnis{results.length !== 1 ? 'se' : ''} gefunden
            </p>
          )}
        </div>
      </div>

      {/* States */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-border space-y-2">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      )}

      {!loading && !wikiData && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🌵</div>
          <p className="text-muted-foreground text-sm">
            Keine Daten — führe <code className="text-primary font-mono">npm run scrape</code> aus.
          </p>
        </div>
      )}

      {!loading && wikiData && results.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-semibold text-base mb-1">Keine Ergebnisse</p>
          <p className="text-muted-foreground text-sm">
            Versuche einen anderen Suchbegriff.
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-2">
          {results.map(result => {
            const colorClass = result.cat
              ? (CATEGORY_COLORS[result.cat.title] ?? 'text-primary bg-primary/10')
              : 'text-primary bg-primary/10'

            return (
              <Link
                key={result.slug}
                to={`/page/${result.slug}`}
                className="group block p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <span className={cn('flex items-center justify-center w-8 h-8 rounded-lg text-sm shrink-0 mt-0.5', colorClass)}>
                    {result.cat?.emoji ?? '📄'}
                  </span>

                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors mb-0.5">
                      {highlight(result.title, query)}
                    </h3>

                    {/* Category badge */}
                    {result.cat && (
                      <span className={cn('inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-md mb-2', colorClass)}>
                        {result.cat.title}
                      </span>
                    )}

                    {/* Excerpt */}
                    {result.excerpt && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {highlight(result.excerpt, query)}
                      </p>
                    )}
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary shrink-0 mt-1 transition-colors" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
