'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function Header() {
  const pathname = usePathname()
  const [hoveredLink, setHoveredLink] = useState<string | null>(null)

  const isActive = (path: string) => pathname === path
  const isHovered = (path: string) => hoveredLink === path

  const navItems = [
    { href: '/operateur', label: 'Formulaire', aria: 'Acceder au formulaire de triage' },
    { href: '/hopitaux', label: 'Hopitaux', aria: "Acceder a la liste des hopitaux" },
    { href: '/history', label: 'History', aria: 'Acceder a la page history (a venir)' },
  ]

  return (
    <header className="fixed bottom-0 left-0 right-0 md:top-0 md:left-0 md:bottom-0 md:right-auto bg-white shadow-lg z-[9999] md:w-64">
      <nav className="h-full">
        <ul className="flex md:flex-col justify-around md:justify-start items-center h-full md:py-8 py-3 gap-2 md:gap-6">
          {navItems.map((item) => (
            <li key={item.href} className="w-full flex md:block items-center justify-center">
              <Link
                href={item.href}
                aria-label={item.aria}
                onMouseEnter={() => setHoveredLink(item.href)}
                onMouseLeave={() => setHoveredLink(null)}
                className={`flex flex-row items-center justify-center md:justify-start gap-2 md:gap-4 px-4 py-3 transition-all duration-200 w-fit md:w-auto md:mx-4 focus:outline-none focus:ring-4 focus:ring-slate-500 rounded-full ${
                  isActive(item.href) || isHovered(item.href)
                    ? 'bg-black text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-sm md:text-base font-bold transition-colors">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}

