import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Header } from '@/components/Header'
import { Sidebar } from '@/components/Sidebar'
import { WikiContent } from '@/components/WikiContent'
import { HomePage } from '@/components/HomePage'
import { SearchPage } from '@/components/SearchPage'
import { CategoryPage } from '@/components/CategoryPage'
import { LoadingScreen } from '@/components/LoadingScreen'
import type { WikiData } from '@/types/wiki'

export default function App() {
  const [wikiData, setWikiData] = useState<WikiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    fetch('/wiki-data.json')
      .then(r => { if (!r.ok) throw new Error('not found'); return r.json() })
      .then((d: WikiData) => setWikiData(d))
      .catch(() => setWikiData(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
    <LoadingScreen loading={loading} />
    <div className="flex flex-col min-h-screen bg-background font-sans">
      <Header
        wikiData={wikiData}
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(d => !d)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-60 xl:w-64 shrink-0 border-r border-border/50 sticky top-14 h-[calc(100vh-3.5rem)] overflow-hidden bg-background/80">
          <Sidebar wikiData={wikiData} />
        </aside>

        {/* Page content */}
        <main className="flex-1 min-w-0 overflow-y-auto h-[calc(100vh-3.5rem)]">
          <Routes>
            <Route path="/"                element={<HomePage     wikiData={wikiData} loading={loading} />} />
            <Route path="/category/:id"   element={<CategoryPage wikiData={wikiData} />} />
            <Route path="/page/*"         element={<WikiContent  wikiData={wikiData} loading={loading} />} />
            <Route path="/search"         element={<SearchPage   wikiData={wikiData} loading={loading} />} />
          </Routes>
        </main>
      </div>
    </div>
    </>
  )
}
