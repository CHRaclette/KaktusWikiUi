import { useEffect, useState, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useParams, Link } from 'react-router-dom'
import { ExternalLink, AlertTriangle, ChevronLeft, ChevronRight, Search, X, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { TableOfContents, slugify } from '@/components/TableOfContents'
import type { WikiData, ContentBlock, TableCell } from '@/types/wiki'
import { ALL_PAGES, WIKI_CATEGORIES } from '@/data/wikiStructure'

/** Extract sortable/searchable text from a table cell */
function getCellText(cell: TableCell | undefined): string {
  if (cell === undefined) return ''
  if (typeof cell === 'object') return cell.alt
  return cell
}

interface WikiContentProps {
  wikiData: WikiData | null
  loading: boolean
}

// ─── Block renderers ──────────────────────────────────────────────────────────

function detectCalloutType(text: string): 'warning' | 'info' | 'tip' | null {
  if (/^[⚠️🚨❗]/.test(text) || /achtung|warnung|wichtig/i.test(text)) return 'warning'
  if (/^[ℹ️📌💡]/.test(text)) return 'info'
  if (/^[✅💡🎯]/.test(text)) return 'tip'
  return null
}

const CALLOUT_STYLES = {
  warning: { cls: 'callout-warning', icon: '⚠️', label: 'Achtung' },
  info:    { cls: 'callout-info',    icon: 'ℹ️', label: 'Info' },
  tip:     { cls: 'callout-tip',     icon: '💡', label: 'Tipp' },
}

function ParagraphBlock({ content }: { content: string }) {
  const callout = detectCalloutType(content)
  if (callout) {
    const s = CALLOUT_STYLES[callout]
    return (
      <div className={s.cls}>
        <p className="text-sm leading-relaxed m-0">{content}</p>
      </div>
    )
  }
  return <p className="text-[15px] leading-[1.85] text-foreground/90 mb-4">{content}</p>
}

/** Render a single table cell — either plain text or an inline image */
function CellContent({ cell }: { cell: TableCell }) {
  const [imgErr, setImgErr] = useState(false)
  if (typeof cell === 'object' && 'img' in cell) {
    if (imgErr) return <span className="text-muted-foreground/40 text-xs italic">{cell.alt || '?'}</span>
    return (
      <img
        src={cell.img}
        alt={cell.alt}
        title={cell.alt}
        loading="lazy"
        onError={() => setImgErr(true)}
        className="w-8 h-8 object-contain inline-block img-pixel"
      />
    )
  }
  return <>{cell}</>
}

// ─── Item detail modal ────────────────────────────────────────────────────────

function ItemDetailModal({
  headers,
  row,
  onClose,
}: {
  headers: string[]
  row: TableCell[]
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Find image cell
  const imgEntry = row
    .map((c, i) => ({ c, i }))
    .find(({ c }) => typeof c === 'object' && c !== null && 'img' in c) as
    | { c: { img: string; alt: string }; i: number }
    | undefined

  // Find primary name column
  const SKIP_HEADERS = new Set(['#', 'nr', 'nr.', 'level', 'stufe', 'ebene', 'bild', 'icon', 'bild/icon'])
  const nameIdx = headers.findIndex((h, i) =>
    !SKIP_HEADERS.has(h.toLowerCase()) &&
    i !== (imgEntry?.i ?? -1) &&
    typeof row[i] === 'string' &&
    String(row[i]).trim().length > 0
  )
  const itemName =
    nameIdx >= 0 ? getCellText(row[nameIdx]) : (imgEntry?.c.alt ?? 'Item')

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm fade-in"
      onClick={onClose}
    >
      <div
        className="mc-panel w-full max-w-lg mx-auto overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="mc-grass-bar" />
        <div className="mc-dirt-bar" />

        <div className="p-6">
          {/* Sprite */}
          {imgEntry && (
            <div className="flex justify-center mb-4">
              <div className="mc-slot w-24 h-24 flex items-center justify-center">
                <img
                  src={imgEntry.c.img}
                  alt={imgEntry.c.alt}
                  className="w-20 h-20 object-contain img-pixel"
                />
              </div>
            </div>
          )}

          {/* Name */}
          <h3 className="font-heading text-2xl text-foreground text-center mb-4 leading-tight">
            {itemName}
          </h3>

          {/* Stats */}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
            {headers.map((header, i) => {
              const cell = row[i]
              if (typeof cell === 'object' && cell !== null && 'img' in cell) return null
              const text = getCellText(cell)
              if (!text) return null
              return (
                <div key={i} className="mc-slot flex items-start gap-3 px-3 py-3 text-sm">
                  <span className="text-muted-foreground/60 font-mono shrink-0 w-28 pt-0.5 leading-relaxed">
                    {header}
                  </span>
                  <span className="text-foreground flex-1 font-mono leading-relaxed break-words">
                    {text}
                  </span>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mc-btn mc-btn-stone w-full mt-4 justify-center text-sm"
          >
            <X className="h-4 w-4" /> Schließen
          </button>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : modal
}

// ─── Table / Grid block ───────────────────────────────────────────────────────

function TableBlock({ headers, rows }: { headers: string[]; rows: TableCell[][] }) {
  // ── All hooks first ──────────────────────────────────────────
  const [filter,      setFilter]      = useState('')
  const [sortCol,     setSortCol]     = useState<number | null>(null)
  const [sortAsc,     setSortAsc]     = useState(true)
  const [selectedRow, setSelectedRow] = useState<TableCell[] | null>(null)

  const imgCols = useMemo(() => {
    const s = new Set<number>()
    rows.forEach(row => row.forEach((cell, ci) => {
      if (typeof cell === 'object' && cell !== null && 'img' in cell) s.add(ci)
    }))
    return s
  }, [rows])

  const hasImages = imgCols.size > 0

  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'masonry'>(() =>
    rows.some(row => row.some(c => typeof c === 'object' && c !== null && 'img' in c))
      ? 'masonry'
      : 'table'
  )

  // Primary image column (first column with image cells)
  const imgColIdx = useMemo(() => {
    const cols = Array.from(imgCols)
    return cols.length > 0 ? cols[0] : -1
  }, [imgCols])

  // Primary name column (first non-index, non-image text column)
  const nameColIdx = useMemo(() => {
    const SKIP = new Set(['#', 'nr', 'nr.', 'level', 'stufe', 'ebene', 'bild', 'icon', 'bild/icon'])
    return headers.findIndex((h, i) =>
      !SKIP.has(h.toLowerCase()) &&
      !imgCols.has(i) &&
      rows.some(row => typeof row[i] === 'string' && String(row[i]).trim().length > 0)
    )
  }, [headers, rows, imgCols])

  const filteredSorted = useMemo(() => {
    let result = rows
    if (filter.trim()) {
      const f = filter.toLowerCase()
      result = result.filter(row =>
        row.some(cell => getCellText(cell).toLowerCase().includes(f))
      )
    }
    if (sortCol !== null) {
      result = [...result].sort((a, b) => {
        const av = getCellText(a[sortCol])
        const bv = getCellText(b[sortCol])
        const an = parseFloat(av.replace(',', '.'))
        const bn = parseFloat(bv.replace(',', '.'))
        if (!isNaN(an) && !isNaN(bn)) return sortAsc ? an - bn : bn - an
        return sortAsc ? av.localeCompare(bv, 'de') : bv.localeCompare(av, 'de')
      })
    }
    return result
  }, [rows, filter, sortCol, sortAsc])

  // ── Early return after all hooks ─────────────────────────────
  if (!headers.length && !rows.length) return null

  const isIndexCol  = ['#', 'Nr', 'Level', 'Stufe'].includes(headers[0])
  const showFilter  = rows.length > 8 || viewMode === 'grid'
  const showScroll  = rows.length > 25

  const handleSort = (ci: number) => {
    if (imgCols.has(ci)) return
    if (sortCol === ci) {
      if (!sortAsc) { setSortCol(null); setSortAsc(true) }
      else setSortAsc(false)
    } else { setSortCol(ci); setSortAsc(true) }
  }

  return (
    <div className="mb-6 scroll-reveal">

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2 mb-2">

        {/* View toggle (only when images present) */}
        {hasImages && (
          <div className="flex gap-1 shrink-0">
            <button type="button" title="Masonry-Ansicht"
              onClick={() => setViewMode('masonry')}
              className={cn('mc-icon-btn text-base leading-none',
                viewMode === 'masonry' && 'brightness-125 ring-1 ring-primary/60')}>
              ≋
            </button>
            <button type="button" title="Kachelansicht"
              onClick={() => setViewMode('grid')}
              className={cn('mc-icon-btn text-base leading-none',
                viewMode === 'grid' && 'brightness-125 ring-1 ring-primary/60')}>
              ▦
            </button>
            <button type="button" title="Tabellenansicht"
              onClick={() => setViewMode('table')}
              className={cn('mc-icon-btn text-base leading-none',
                viewMode === 'table' && 'brightness-125 ring-1 ring-primary/60')}>
              ☰
            </button>
          </div>
        )}

        {/* Filter input */}
        {showFilter && (
          <>
            <div className="mc-slot flex items-center gap-2 h-8 px-3 flex-1 max-w-xs">
              <Search className="h-3 w-3 text-muted-foreground/60 shrink-0" />
              <input
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder="Filtern…"
                className="flex-1 bg-transparent text-xs font-mono outline-none placeholder:text-muted-foreground/40 min-w-0"
              />
              {filter && (
                <button type="button" title="Filter leeren" onClick={() => setFilter('')}
                  className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground/50 font-mono shrink-0">
              {filter ? `${filteredSorted.length} / ${rows.length}` : rows.length} Eintr.
            </span>
          </>
        )}

        {/* Sort reset (table view only) */}
        {viewMode === 'table' && sortCol !== null && (
          <button type="button"
            onClick={() => { setSortCol(null); setSortAsc(true) }}
            className="text-[11px] text-muted-foreground/50 hover:text-foreground font-mono flex items-center gap-1 transition-colors">
            <X className="h-2.5 w-2.5" /> Sortierung aufheben
          </button>
        )}
      </div>

      {/* ── Grid view ── */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
          {filteredSorted.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground/50 italic text-sm">
              Keine Ergebnisse für „{filter}"
            </div>
          ) : filteredSorted.map((row, ri) => {
            const imgCell = imgColIdx >= 0 ? row[imgColIdx] : undefined
            const nameCell = nameColIdx >= 0
              ? row[nameColIdx]
              : row.find(c => typeof c === 'string' && String(c).trim().length > 0)
            const name = getCellText(nameCell)

            return (
              <button
                key={ri}
                type="button"
                onClick={() => setSelectedRow(row)}
                title={name}
                className="mc-slot flex flex-col items-start justify-start gap-2 p-3 min-h-[120px] cursor-pointer hover:brightness-125 active:brightness-90 transition-all group"
              >
                <div className="w-full flex items-center justify-center mb-2">
                  {imgCell && typeof imgCell === 'object' && 'img' in imgCell ? (
                    <img
                      src={imgCell.img}
                      alt={imgCell.alt}
                      loading="lazy"
                      className="w-16 h-16 object-contain img-pixel group-hover:scale-110 transition-transform"
                    />
                  ) : (
                    <span className="text-3xl opacity-30 group-hover:opacity-60 transition-opacity">📦</span>
                  )}
                </div>
                <span className="text-sm font-mono text-muted-foreground/80 leading-snug line-clamp-3 text-left w-full">
                  {name}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Masonry view ── */}
      {viewMode === 'masonry' && (
        <div className="masonry">
          {filteredSorted.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground/50 italic text-sm">
              Keine Ergebnisse für „{filter}"
            </div>
          ) : filteredSorted.map((row, ri) => {
            const imgCell = imgColIdx >= 0 ? row[imgColIdx] : undefined
            const nameCell = nameColIdx >= 0
              ? row[nameColIdx]
              : row.find(c => typeof c === 'string' && String(c).trim().length > 0)
            const name = getCellText(nameCell)

            return (
              <button
                key={ri}
                type="button"
                onClick={() => setSelectedRow(row)}
                title={name}
                className="masonry-item mc-slot p-3 group"
              >
                {imgCell && typeof imgCell === 'object' && 'img' in imgCell ? (
                  <img
                    src={imgCell.img}
                    alt={imgCell.alt}
                    loading="lazy"
                    className="masonry-img img-pixel mx-auto"
                  />
                ) : (
                  <div className="w-full text-center text-3xl opacity-30 group-hover:opacity-60">📦</div>
                )}
                <div className="masonry-title font-heading font-semibold text-center mt-2">{name}</div>
                <div className="text-xs text-muted-foreground/60 text-center mt-1 line-clamp-3">
                  {/* try to show a short excerpt from first text cell */}
                  {row.map(c => typeof c === 'string' ? c : '')[0]}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Table view ── */}
      {viewMode === 'table' && (
        <div className={cn('wiki-table-wrap', showScroll && 'max-h-[58vh] overflow-y-auto')}>
          <table className="wiki-table">
            {headers.length > 0 && (
              <thead className={cn(showScroll && 'sticky top-0 z-10')}>
                <tr>
                  {headers.map((h, i) => (
                    <th
                      key={i}
                      onClick={() => handleSort(i)}
                      className={cn(
                        isIndexCol && i === 0 && 'w-12 text-center',
                        imgCols.has(i)
                          ? 'w-14 text-center cursor-default'
                          : 'cursor-pointer select-none hover:text-foreground transition-colors'
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        {h}
                        {!imgCols.has(i) && (
                          sortCol === i
                            ? <span className="text-primary text-[10px]">{sortAsc ? '↑' : '↓'}</span>
                            : <ArrowUpDown className="h-2.5 w-2.5 opacity-20" />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {filteredSorted.length === 0 ? (
                <tr>
                  <td colSpan={headers.length || 1}
                    className="text-center py-8 text-muted-foreground/50 italic text-sm">
                    Keine Ergebnisse für „{filter}"
                  </td>
                </tr>
              ) : filteredSorted.map((row, ri) => (
                <tr
                  key={ri}
                  className="cursor-pointer hover:bg-white/[0.04] transition-colors"
                  onClick={() => setSelectedRow(row)}
                >
                  {row.map((cell, ci) => (
                    <td key={ci} className={cn(
                      isIndexCol && ci === 0 && 'text-center font-mono text-xs text-muted-foreground',
                      imgCols.has(ci) && 'text-center align-middle py-1.5',
                      typeof cell === 'string' &&
                        /^[\d.,\s]+(k|m|b|t|aa|ab|ac|ad|ae|af|ag|ah|ai|aj|ak|al|am|an|ao|ap|aq|ar|as|at|au|av|aw|ax|ay|az|ba|bb|bq)?$/i.test(cell.trim()) && 'font-mono text-xs'
                    )}>
                      <CellContent cell={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Detail modal ── */}
      {selectedRow && (
        <ItemDetailModal
          headers={headers}
          row={selectedRow}
          onClose={() => setSelectedRow(null)}
        />
      )}
    </div>
  )
}

function ImageBlock({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false)
  if (error) return null
  return (
    <figure className="my-5 scroll-reveal">
      <a href={src} target="_blank" rel="noopener noreferrer" className="block">
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setError(true)}
          className="rounded-xl border border-border max-w-full shadow-sm hover:shadow-md transition-shadow cursor-zoom-in"
        />
      </a>
      {alt && (
        <figcaption className="mt-2 text-xs text-muted-foreground text-center italic">
          {alt}
        </figcaption>
      )}
    </figure>
  )
}

function BlockRenderer({ block, index }: { block: ContentBlock; index: number }) {
  switch (block.type) {
    case 'heading': {
      // Append index so the id is unique even when heading text repeats across blocks
      const hid = `${slugify(block.content)}-${index}`
      const rev = index > 2 ? ' scroll-reveal' : ''
      const lvl = block.level === 2 ? 2 : block.level === 3 ? 3 : 4
      const cls = lvl === 2 ? `wiki-prose-h2${rev}` : lvl === 3 ? `wiki-prose-h3${rev}` : `wiki-prose-h4${rev}`
      // Single element — dynamic tag silences the "multiple id" lint hint
      const Tag = `h${lvl}` as 'h2' | 'h3' | 'h4'
      return <Tag id={hid} className={cls}>{block.content}</Tag>
    }
    case 'paragraph':
      return <ParagraphBlock content={block.content} />
    case 'table':
      return <TableBlock headers={block.headers} rows={block.rows} />
    case 'list':
      if (block.ordered) {
        return (
          <ol className="wiki-prose ol mb-4 space-y-1.5 pl-0">
            {block.items.map((item, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-foreground/90">
                <span className="flex items-center justify-center w-5 h-5 mt-0.5 rounded-full bg-primary/15 text-primary text-[11px] font-bold shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1">{item}</span>
              </li>
            ))}
          </ol>
        )
      }
      return (
        <ul className="wiki-prose ul mb-4 space-y-1.5 pl-0">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-foreground/90">
              <span className="text-primary mt-1 shrink-0 text-xs">▸</span>
              <span className="flex-1">{item}</span>
            </li>
          ))}
        </ul>
      )
    case 'image':
      return <ImageBlock src={block.src} alt={block.alt} />
    default:
      return null
  }
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-8 space-y-4 fade-in">
      <Skeleton className="h-4 w-40 mb-6" />
      <Skeleton className="h-9 w-3/4" />
      <Skeleton className="h-5 w-1/3" />
      <div className="space-y-3 mt-8">
        {[1, 0.9, 0.8, 0.95, 0.7].map((w, i) => (
          <Skeleton key={i} className="h-4" style={{ width: `${w * 100}%` } as React.CSSProperties} />
        ))}
        <Skeleton className="h-40 w-full mt-6 rounded-xl" />
        {[0.85, 0.9, 0.75].map((w, i) => (
          <Skeleton key={i + 10} className="h-4" style={{ width: `${w * 100}%` } as React.CSSProperties} />
        ))}
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export function WikiContent({ wikiData, loading }: WikiContentProps) {
  const params = useParams()
  const slug = params['*'] || ''

  const page = wikiData?.pages.find(p => p.slug === slug)
  const pageLink = ALL_PAGES.find(p => p.slug === slug)
  const category = WIKI_CATEGORIES.find(c => c.pages.some(p => p.slug === slug))

  const allPages = ALL_PAGES
  const currentIndex = allPages.findIndex(p => p.slug === slug)
  const prevPage = currentIndex > 0 ? allPages[currentIndex - 1] : null
  const nextPage = currentIndex < allPages.length - 1 ? allPages[currentIndex + 1] : null

  const articleRef = useRef<HTMLElement>(null)

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [slug])

  // IntersectionObserver: reveal elements with .scroll-reveal when they enter viewport
  useEffect(() => {
    const container = articleRef.current
    if (!container) return
    const elements = container.querySelectorAll('.scroll-reveal')
    if (!elements.length) return
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible')
          observer.unobserve(e.target)
        }
      }),
      { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
    )
    elements.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [page?.slug])

  if (loading) return <LoadingSkeleton />

  // Not scraped yet
  if (!page && wikiData) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-20 text-center fade-in">
        <div className="text-5xl mb-4">🌵</div>
        <h2 className="font-heading font-bold text-xl mb-2">Seite noch nicht gescrapt</h2>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          Diese Seite ist in der Struktur vorhanden, wurde aber noch nicht geladen.
          {pageLink && (
            <> Sieh dir die{' '}
              <a href={pageLink.url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                Originalseite
              </a>
              {' '}an oder führe den Scraper erneut aus.</>
          )}
        </p>
        <code className="block text-sm bg-muted border border-border px-4 py-3 rounded-xl font-mono text-center inline-block">
          npm run scrape
        </code>
      </div>
    )
  }

  // No data at all
  if (!wikiData) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-20 text-center fade-in">
        <div className="text-5xl mb-4">🌵</div>
        <h2 className="font-heading font-bold text-xl mb-2">Wiki-Daten nicht gefunden</h2>
        <p className="text-muted-foreground text-sm mb-6">Bitte führe zuerst den Scraper aus.</p>
        <div className="inline-block text-left bg-muted border border-border rounded-xl p-4 font-mono text-sm space-y-1">
          <div><span className="text-muted-foreground"># Wiki-Daten laden:</span></div>
          <div className="text-primary">npm run scrape</div>
          <div className="mt-2"><span className="text-muted-foreground"># Server starten:</span></div>
          <div className="text-primary">npm run dev</div>
        </div>
      </div>
    )
  }

  if (!page) return null

  // Map category id → text colour class (matches sidebar / category page)
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
  const catTextCls = CAT_TEXT[category?.id ?? ''] ?? 'text-primary'

  return (
    <div className="fade-in flex gap-8 max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* ── Main article ────────────────────────────────────────────── */}
      <article ref={articleRef} className="flex-1 min-w-0">

        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground mb-5 font-mono" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-foreground transition-colors">Wiki</Link>
          <span className="opacity-40">/</span>
          {category && (
            <>
              <Link to={`/category/${category.id}`} className={cn('hover:text-foreground transition-colors', catTextCls)}>
                {category.emoji} {category.title}
              </Link>
              <span className="opacity-40">/</span>
            </>
          )}
          <span className="text-foreground truncate max-w-[200px]">{page.title}</span>
        </nav>

        {/* Title panel */}
        <div className="mc-panel overflow-hidden mb-7">
          {/* Category accent strip — same pattern as category cards */}
          <div className={`cat-bar cat-bar-${category?.id ?? 'allgemeines'}`} />
          <div className="p-5">
            <h1 className="font-heading text-3xl sm:text-4xl text-foreground leading-tight mb-3">
              {page.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-muted-foreground">
              {category && (
                <span className={cn('flex items-center gap-1', catTextCls)}>
                  {category.emoji} {category.title}
                </span>
              )}
              {page.error && (
                <span className="flex items-center gap-1 text-red-400">
                  <AlertTriangle className="h-3 w-3" /> Ladefehler
                </span>
              )}
              <span className="ml-auto opacity-60">
                Stand: {new Date(page.scrapedAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────────────── */}
        <div className="wiki-prose">
          {page.blocks.length === 0 ? (
            <p className="text-muted-foreground italic text-sm">Kein Inhalt verfügbar.</p>
          ) : (
            page.blocks.map((block, i) => <BlockRenderer key={i} block={block} index={i} />)
          )}
        </div>

        {/* Source link */}
        <div className="mt-10 pt-6 border-t border-border/50">
          <a href={page.url} target="_blank" rel="noopener noreferrer"
            className="mc-btn mc-btn-stone">
            <ExternalLink className="h-3.5 w-3.5" />
            Auf PlayLegend.net ansehen
          </a>
        </div>

        {/* Prev / Next */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {prevPage ? (
            <Link
              to={`/page/${prevPage.slug}`}
              className="mc-slot group flex items-center gap-3 p-4 hover:brightness-110 transition-all"
            >
              <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground/60 group-hover:text-primary transition-colors" />
              <div className="min-w-0">
                <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wide font-mono mb-0.5">← Zurück</div>
                <div className="font-heading text-base text-foreground truncate group-hover:text-primary transition-colors">
                  {prevPage.title}
                </div>
              </div>
            </Link>
          ) : <div />}
          {nextPage ? (
            <Link
              to={`/page/${nextPage.slug}`}
              className="mc-slot group flex items-center gap-3 p-4 text-right justify-end hover:brightness-110 transition-all"
            >
              <div className="min-w-0">
                <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wide font-mono mb-0.5">Weiter →</div>
                <div className="font-heading text-base text-foreground truncate group-hover:text-primary transition-colors">
                  {nextPage.title}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60 group-hover:text-primary transition-colors" />
            </Link>
          ) : <div />}
        </div>
      </article>

      {/* ── Table of Contents ─────────────────────────────────────── */}
      <TableOfContents blocks={page.blocks} />
    </div>
  )
}
