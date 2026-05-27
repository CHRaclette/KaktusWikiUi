import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { ContentBlock } from '@/types/wiki'

interface TocEntry {
  id: string
  text: string
  level: 2 | 3
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[äöü]/g, c => ({ ä: 'ae', ö: 'oe', ü: 'ue' }[c] ?? c))
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildToc(blocks: ContentBlock[]): TocEntry[] {
  return blocks
    .map((b, i) => ({ b, i }))
    .filter((entry): entry is { b: Extract<ContentBlock, { type: 'heading' }>; i: number } =>
      entry.b.type === 'heading' && (entry.b.level === 2 || entry.b.level === 3)
    )
    // Use the same index-suffixed id scheme as BlockRenderer
    .map(({ b, i }) => ({
      id: `${slugify(b.content)}-${i}`,
      text: b.content,
      level: b.level as 2 | 3,
    }))
}

interface TableOfContentsProps {
  blocks: ContentBlock[]
}

export function TableOfContents({ blocks }: TableOfContentsProps) {
  const toc = buildToc(blocks)
  const [active, setActive] = useState<string>('')

  useEffect(() => {
    if (toc.length === 0) return

    const observer = new IntersectionObserver(
      entries => {
        // Find the topmost visible heading
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) setActive(visible[0].target.id)
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )

    toc.forEach(h => {
      const el = document.getElementById(h.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks])

  if (toc.length < 3) return null

  return (
    <aside className="hidden xl:block w-56 shrink-0">
      <div className="sticky top-20 max-h-[calc(100vh-100px)] overflow-y-auto">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-2">
          Inhalt
        </p>
        <nav className="space-y-0.5">
          {toc.map(h => (
            <a
              key={h.id}
              href={`#${h.id}`}
              className={cn(
                'block text-xs leading-snug px-2 py-1 rounded transition-colors truncate',
                h.level === 3 && 'pl-4 text-[11px]',
                active === h.id
                  ? 'text-primary font-medium bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {h.text}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  )
}
