import type { Metadata, Viewport } from 'next'
import './globals.css'

const SITE_NAME = 'Arena2H'
const SITE_URL = 'https://arena2h.vercel.app' // <-- CHANGE to your real domain
const OG_IMAGE = '/og.jpg' // place og.jpg inside /public

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: SITE_NAME,
    template: `%s • ${SITE_NAME}`,
  },

  description: 'Vote head-to-head and see real-time rankings.',

  openGraph: {
    type: 'website',
    title: 'Choose Your Next President',
    description: 'Vote head-to-head and see real-time rankings.',
    siteName: SITE_NAME,
    url: SITE_URL,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Arena2H Preview',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Choose Your Next President',
    description: 'Vote head-to-head and see real-time rankings.',
    images: [OG_IMAGE],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-neutral-900">
      <body className="bg-transparent text-neutral-100">{children}</body>
    </html>
  )
}
