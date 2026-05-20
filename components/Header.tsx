'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabaseBrowser'

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [hoveredLink, setHoveredLink] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  const isActive = (path: string) => pathname === path
  const isHovered = (path: string) => hoveredLink === path

  const navItems = [
    { href: '/operateur', label: 'Formulaire', aria: 'Acceder au formulaire de triage' },
    { href: '/history', label: 'Historique', aria: 'Acceder a l historique des dossiers' },
  ]

  async function handleSignOut() {
    setSigningOut(true)
    try {
      const sb = getSupabaseBrowser()
      await sb.auth.signOut()
    } finally {
      setSigningOut(false)
      router.replace('/login')
    }
  }

  return (
    <header className="fixed bottom-0 left-0 right-0 md:top-0 md:left-0 md:bottom-0 md:right-auto bg-[var(--bg-frame)] border-t md:border-t-0 md:border-r border-[var(--border-color)] shadow-[var(--shadow-sm)] z-[9999] md:w-64 flex flex-col">
      <div className="hidden md:flex items-center gap-2.5 px-6 py-6 border-b border-[var(--border-color)]">
        <span className="bg-[var(--primary-light)] text-[var(--primary)] w-9 h-9 rounded-xl flex items-center justify-center shadow-sm">
          <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </span>
        <div>
          <h1 className="text-base font-extrabold text-[var(--text-main)] tracking-tight">
            QuelleUrgence
          </h1>
          <span className="text-[9px] text-[var(--success)] font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-ping" /> LIVE API UPDATES
          </span>
        </div>
      </div>

      <nav className="flex-1 py-3 md:py-6">
        <ul className="flex md:flex-col justify-around md:justify-start h-full px-2 md:px-3 gap-2">
          {navItems.map((item) => {
            const active = isActive(item.href)
            const hovered = isHovered(item.href)
            return (
              <li key={item.href} className="w-full flex md:block items-center justify-center">
                <Link
                  href={item.href}
                  aria-label={item.aria}
                  onMouseEnter={() => setHoveredLink(item.href)}
                  onMouseLeave={() => setHoveredLink(null)}
                  className={`flex items-center gap-3 px-4 py-2.5 transition-all duration-200 w-fit md:w-full focus:outline-none rounded-xl font-bold text-sm ${
                    active
                      ? 'bg-[var(--primary)] text-white shadow-sm'
                      : hovered
                      ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <span className="transition-colors">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="hidden md:block px-3 pb-4">
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--primary-light)] transition-all disabled:opacity-60"
        >
          {signingOut ? 'Deconnexion...' : 'Deconnexion'}
        </button>
      </div>
    </header>
  )
}
