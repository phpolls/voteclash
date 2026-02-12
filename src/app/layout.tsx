import type { Metadata, Viewport } from 'next'
import './globals.css'

const SITE_NAME = 'Arena2H'
const SITE_URL = 'https://arena2h.vercel.app' // <-- change this to your real domain
const OG_IMAGE = `${SITE_URL}/og.jpg`      // <-- put og.jpg inside /public

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s • ${SITE_NAME}`,
  },
  description: 'Head-to-head voting battles.',
  metadataBase: new URL(SITE_URL),

  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: 'Head-to-head voting battles.',
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} preview`,
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: 'Head-to-head voting battles.',
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
