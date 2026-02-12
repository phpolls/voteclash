import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Arena2HWordmark from '@/components/Arena2HWordmark'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Arena2H',
  description: 'Arena2H',
}

// ✅ FIX: real mobile viewport (desktop unaffected)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-neutral-900">
      <body className="bg-transparent text-neutral-100">
        {/* Header (logo swap only) */}
        <header className="h-[90px] flex items-center bg-gradient-to-b from-[#0B1220] to-[#070B14]">
          <div className="pl-[12%] flex items-center h-full">
            <div className="text-[28px] sm:text-[32px] md:text-[36px]">
              <Arena2HWordmark />
            </div>
          </div>

          {/* Right-side empty space reserved (ads/UI later) */}
          <div className="flex-1" />
        </header>

        {children}
      </body>
    </html>
  )
}
