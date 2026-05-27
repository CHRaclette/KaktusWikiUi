import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface LoadingScreenProps {
  loading: boolean
}

export function LoadingScreen({ loading }: LoadingScreenProps) {
  const [progress, setProgress] = useState(8)
  const [visible, setVisible]   = useState(true)   // opacity
  const [mounted, setMounted]   = useState(true)   // DOM presence

  useEffect(() => {
    if (loading) {
      // Animate bar to ~82 % while waiting
      setProgress(8)
      setVisible(true)
      setMounted(true)
      const iv = setInterval(() => {
        setProgress(p => Math.min(82, p + Math.random() * 9 + 2))
      }, 260)
      return () => clearInterval(iv)
    } else {
      // Complete and fade out
      setProgress(100)
      const t1 = setTimeout(() => setVisible(false), 450)
      const t2 = setTimeout(() => setMounted(false), 1000)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
  }, [loading])

  if (!mounted) return null

  return (
    <div className={cn(
      'fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background',
      'transition-opacity duration-500',
      visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
    )}>
      {/* Dot grid background */}
      <div className="cat-hero-dots absolute inset-0" />

      <div className="relative flex flex-col items-center gap-4 text-center px-6">
        {/* Cactus */}
        <span className="text-8xl select-none mc-cactus-glow" role="img" aria-label="Kaktus">
          🌵
        </span>

        {/* Title */}
        <h1 className="font-pixel text-xl sm:text-2xl text-primary hero-title leading-tight">
          KaktusWiki
        </h1>
        <p className="text-muted-foreground/60 text-xs font-mono -mt-2">
          Cactus Clicker Wiki
        </p>

        {/* Progress bar */}
        <div className="mt-5 w-72 sm:w-80">
          <div className="mc-progress-track">
            {/* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */}
            <div
              className="mc-progress-fill progress-bar transition-all duration-300"
              {...({ style: { '--bar-width': `${progress}%` } } as React.HTMLAttributes<HTMLDivElement>)}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground/50 font-mono">
            <span>Wird geladen…</span>
            <span>{Math.min(100, Math.round(progress))}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
