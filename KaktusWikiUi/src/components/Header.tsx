import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Menu, ExternalLink, X, Clock } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Sidebar } from '@/components/Sidebar'
import { cn } from '@/lib/utils'
import type { WikiData } from '@/types/wiki'
import { ALL_PAGES } from '@/data/wikiStructure'

interface HeaderProps {
  wikiData: WikiData | null
  darkMode: boolean
  toggleDarkMode: () => void
}

export function Header({ wikiData }: HeaderProps) {
  const [query, setQuery]         = useState('')
  const [focused, setFocused]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [recent, setRecent]       = useState<string[]>([])
  const inputRef                  = useRef<HTMLInputElement>(null)
  const navigate                  = useNavigate()

  useEffect(() => {
    try { setRecent(JSON.parse(localStorage.getItem('wiki-recent') || '[]')) }
    catch { setRecent([]) }
  }, [])

  const suggestions = query.trim().length >= 1
    ? ALL_PAGES.filter(p => p.title.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : []

  const handleSearch = (q: string) => {
    if (!q.trim()) return
    const updated = [q, ...recent.filter(r => r !== q)].slice(0, 5)
    localStorage.setItem('wiki-recent', JSON.stringify(updated))
    setRecent(updated)
    setQuery('')
    setFocused(false)
    navigate(`/search?q=${encodeURIComponent(q.trim())}`)
  }

  const navigateTo = (slug: string) => {
    setQuery('')
    setFocused(false)
    navigate(`/page/${slug}`)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); inputRef.current?.focus() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const showDropdown = focused && (suggestions.length > 0 || (query.length === 0 && recent.length > 0))

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Minecraft grass / dirt accent strips */}
      <div className="mc-grass-bar" />
      <div className="mc-dirt-bar" />

      {/* Main bar */}
      <div className="mc-panel border-x-0 border-t-0">
        <div className="flex h-14 items-center gap-3 px-3 sm:px-5">

          {/* ── Mobile nav ── */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button type="button" title="Navigation öffnen" className="mc-icon-btn lg:hidden shrink-0">
                <Menu className="h-4 w-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 flex flex-col bg-background">
              <SheetHeader className="px-4 py-3 border-b border-border mc-panel">
                <SheetTitle className="flex items-center gap-2 font-pixel text-[10px] text-primary">
                  <span className="text-xl">🌵</span> KaktusWiki
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-hidden">
                <Sidebar wikiData={wikiData} onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 hover:opacity-90 transition-opacity">
            <span className="text-2xl leading-none select-none">🌵</span>
            <div className="hidden sm:block">
              <div className="font-pixel text-[10px] text-primary leading-tight tracking-wide">KaktusWiki</div>
              <div className="text-[9px] text-muted-foreground/60 font-mono leading-tight mt-0.5">Cactus Clicker</div>
            </div>
          </Link>

          <div className="hidden sm:block h-5 w-px bg-border/50 mx-1 shrink-0" />

          {/* ── Search ── */}
          <div className="flex-1 max-w-xl relative">
            <form onSubmit={e => { e.preventDefault(); handleSearch(query) }}>
              <div className={cn(
                'mc-slot flex items-center gap-2 h-9 px-3 transition-all duration-150',
                focused && 'ring-1 ring-primary/40'
              )}>
                <Search className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setTimeout(() => setFocused(false), 150)}
                  placeholder="Suchen… [Ctrl+K]"
                  className="flex-1 bg-transparent text-[13px] font-mono outline-none placeholder:text-muted-foreground/40 min-w-0"
                />
                {query && (
                  <button type="button" title="Suche leeren" onClick={() => setQuery('')}
                    className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </form>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 mc-panel border border-border shadow-2xl overflow-hidden z-50">

                {query.length === 0 && recent.length > 0 && (
                  <>
                    <div className="px-3 py-1.5 text-[11px] font-heading mc-gold border-b border-border/50 flex items-center gap-1.5">
                      <Clock className="h-3 w-3" /> Zuletzt gesucht
                    </div>
                    {recent.map(r => (
                      <button key={r} type="button" onMouseDown={() => handleSearch(r)}
                        className="w-full text-left px-3 py-2 hover:bg-primary/10 transition-colors flex items-center gap-2">
                        <Search className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="font-mono text-[13px]">{r}</span>
                      </button>
                    ))}
                  </>
                )}

                {suggestions.length > 0 && (
                  <>
                    {query && (
                      <div className="px-3 py-1.5 text-[11px] font-heading text-primary border-b border-border/50">
                        Vorschläge
                      </div>
                    )}
                    {suggestions.map(p => (
                      <button key={p.slug} type="button" onMouseDown={() => navigateTo(p.slug)}
                        className="w-full text-left px-3 py-2 hover:bg-primary/10 transition-colors flex items-center gap-2 group">
                        <span className="text-base leading-none shrink-0">{p.categoryEmoji}</span>
                        <span className="flex-1 min-w-0 truncate font-mono text-[13px] group-hover:text-primary transition-colors">{p.title}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{p.category}</span>
                      </button>
                    ))}
                  </>
                )}

              </div>
            )}
          </div>

          {/* ── Right actions ── */}
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <a href="https://playlegend.net/cactusclicker-wiki/" target="_blank" rel="noopener noreferrer"
              className="mc-btn mc-btn-stone hidden md:inline-flex">
              <ExternalLink className="h-3 w-3" />
              Original
            </a>
          </div>

        </div>
      </div>
    </header>
  )
}
