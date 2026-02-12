'use client'

import { useEffect, useState } from 'react'

export default function ShareFacebookButton({
  url,
  label = 'Share',
  className = '',
  title = 'Choose Your Next President',
  text = 'Vote head-to-head and see the rankings.',
}: {
  url?: string
  label?: string
  className?: string
  title?: string
  text?: string
}) {
  const [shareUrl, setShareUrl] = useState(url ?? '')

  useEffect(() => {
    if (url) return
    try {
      setShareUrl(window.location.href)
    } catch {
      setShareUrl('')
    }
  }, [url])

  async function onShare() {
    const u = (url || shareUrl || '').trim()
    if (!u) return

    const isMobile =
      typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '')

    // ✅ MOBILE: use native share sheet only (best chance to open FB app, no Chrome login)
    if (isMobile && typeof (navigator as any).share === 'function') {
      try {
        await (navigator as any).share({ title, text, url: u })
      } catch {
        // user cancelled -> do nothing
      }
      return
    }

    // ✅ DESKTOP: open FB sharer in new tab
    const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`
    window.open(fb, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      type="button"
      onClick={onShare}
      className={[
        'inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-2',
        'text-white font-extrabold tracking-tight hover:bg-white/15 transition',
        'backdrop-blur',
        className,
      ].join(' ')}
      aria-label="Share"
    >
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-white/10 border border-white/10">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M14 8.5V6.8c0-.8.5-1.3 1.4-1.3H17V2h-2.3C12 2 10 3.8 10 6.7V8.5H8v3.2h2V22h4v-10.3h2.7L17 8.5H14z"
            fill="currentColor"
            opacity="0.95"
          />
        </svg>
      </span>
      <span className="text-sm">{label}</span>
    </button>
  )
}
