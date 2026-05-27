import { Link, useParams } from 'react-router-dom'
import { ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WIKI_CATEGORIES } from '@/data/wikiStructure'
import type { WikiData } from '@/types/wiki'

interface CategoryPageProps {
  wikiData: WikiData | null
}

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

export function CategoryPage({ wikiData }: CategoryPageProps) {
  const { id } = useParams<{ id: string }>()
  const category = WIKI_CATEGORIES.find(c => c.id === id)
  const textCls  = CAT_TEXT[id ?? ''] ?? 'text-primary'

  if (!category) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-20 text-center fade-in">
        <div className="text-5xl mb-4">❓</div>
        <h2 className="font-heading text-2xl mb-2">Kategorie nicht gefunden</h2>
        <Link to="/" className="text-primary hover:underline text-sm">← Zurück zur Startseite</Link>
      </div>
    )
  }

  return (
    <div className="fade-in">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-border/50">
        <div className="cat-hero-dots" />

        <div className="relative max-w-5xl mx-auto px-5 py-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5 font-mono">
            <Link to="/" className="hover:text-foreground transition-colors">Wiki</Link>
            <span className="opacity-50">›</span>
            <span className={cn('font-medium', textCls)}>{category.title}</span>
          </div>

          <div className="flex items-center gap-5">
            <div className="mc-slot flex items-center justify-center w-16 h-16 text-4xl shrink-0">
              {category.emoji}
            </div>
            <div>
              <h1 className={cn('font-heading text-3xl sm:text-4xl leading-tight', textCls)}>
                {category.title}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm font-mono">
                {category.pages.length} Seiten
                {wikiData && (() => {
                  const scraped = category.pages.filter(
                    p => wikiData.pages.some(wp => wp.slug === p.slug)
                  ).length
                  return scraped < category.pages.length
                    ? <span className="ml-2 text-xs opacity-60">({scraped} geladen)</span>
                    : null
                })()}
              </p>
            </div>
          </div>
        </div>

        <div className="mc-grass-bar" />
        <div className="mc-dirt-bar" />
      </div>

      {/* ── Page grid ─────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {category.pages.map(page => {
            const wikiPage   = wikiData?.pages.find(wp => wp.slug === page.slug)
            const firstPara  = wikiPage?.blocks.find(b => b.type === 'paragraph')
            const excerpt    = firstPara?.type === 'paragraph'
              ? firstPara.content.slice(0, 120) + (firstPara.content.length > 120 ? '…' : '')
              : null
            const hasImage   = wikiPage?.blocks.some(b => b.type === 'image') ?? false
            const tableCount = wikiPage?.blocks.filter(b => b.type === 'table').length ?? 0
            const isScraped  = !!wikiPage

            return (
              <Link
                key={page.slug}
                to={`/page/${page.slug}`}
                className="mc-slot group flex flex-col transition-all duration-150 hover:-translate-y-0.5 hover:brightness-110 overflow-hidden"
              >
                {/* Category-coloured top strip */}
                <div className={`cat-bar cat-bar-${id ?? 'allgemeines'}`} />

                <div className="flex flex-col flex-1 p-5">
                  <h3 className={cn(
                    'font-heading text-lg mb-2 leading-snug transition-colors',
                    textCls
                  )}>
                    {page.title}
                  </h3>

                  {excerpt ? (
                    <p className="text-xs text-muted-foreground/80 leading-relaxed flex-1 line-clamp-3 font-mono mb-4">
                      {excerpt}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground/40 italic flex-1 mb-4">
                      {isScraped ? 'Kein Textinhalt' : 'Noch nicht geladen'}
                    </p>
                  )}

                  {/* Footer meta */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/40">
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
                      {hasImage && (
                        <span className="flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" />
                          Bilder
                        </span>
                      )}
                      {tableCount > 0 && (
                        <span>📊 {tableCount}×</span>
                      )}
                    </div>
                    <span className={cn(
                      'text-xs font-heading opacity-0 group-hover:opacity-100 transition-opacity',
                      textCls
                    )}>
                      Lesen →
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

    </div>
  )
}
