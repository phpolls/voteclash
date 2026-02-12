'use client'

import { useEffect, useState } from 'react'
import VotingGrid from '@/components/VotingGrid'
import ChatBox from '@/components/chat/ChatBox'

type PresidentableUI = { id: string; name: string; imgUrl: string; total_votes: number }
type SidebarRow = { id: string; name: string; imgUrl?: string | null; votes: number }

const LS_KEY = 'voteclash_pres_voted'

function formatVotes(v: number) {
  return Number(v || 0).toLocaleString('en-US')
}

function ShareButton() {
  return (
    <button
      type="button"
      aria-label="Share on Facebook"
      title="Share on Facebook"
      className="h-10 w-10 rounded-2xl border border-white/10 bg-black/20 flex items-center justify-center hover:bg-white/10 transition"
      onClick={() => {
        // Placeholder (you can wire a real share link later)
        // Example later: window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}`, '_blank')
      }}
    >
      {/* Minimal FB-ish glyph */}
      <span className="text-white/80 font-extrabold text-lg leading-none">f</span>
    </button>
  )
}

export default function HomeClient({
  presidentables,
  creatorsTop,
  presidentiablesTop,
}: {
  presidentables: PresidentableUI[]
  creatorsTop: SidebarRow[]
  presidentiablesTop: SidebarRow[]
}) {
  const [hydrated, setHydrated] = useState(false)
  const [showCreators, setShowCreators] = useState(false)

  useEffect(() => {
    setHydrated(true)
    try {
      setShowCreators(localStorage.getItem(LS_KEY) === '1')
    } catch {
      setShowCreators(false)
    }
  }, [])

  function handlePresidentVoted() {
    try {
      localStorage.setItem(LS_KEY, '1')
    } catch {}
    setShowCreators(true)
  }

  if (!hydrated) return null

  const title = showCreators ? 'Shallow Or Follow' : 'CHOOSE YOUR NEXT PRESIDENT'
  const notice = showCreators ? null : 'One vote only'

  return (
    <main className="min-h-screen bg-transparent">
      {/* ================= MOBILE ================= */}
      <div className="lg:hidden px-4 pt-4 pb-4 space-y-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-white font-extrabold text-[22px] leading-[1.05] tracking-tight">
                {title}
              </div>
              {notice ? (
                <div className="mt-2 text-white/70 text-xs font-semibold">{notice}</div>
              ) : null}
            </div>

            {/* Small FB share space */}
            <ShareButton />
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-3 backdrop-blur">
          <VotingGrid presidentables={presidentables} onPresidentVoted={handlePresidentVoted} />
        </div>

        {showCreators ? (
          <a
            href="/leaderboards"
            className="block w-full text-center py-4 rounded-2xl bg-white text-black font-extrabold"
          >
            Show Results
          </a>
        ) : null}
      </div>

      {/* ================= DESKTOP ================= */}
      <div className="hidden lg:block">
        <div className="mx-auto max-w-[1600px] px-6 pt-6 pb-10">
          <div
            className={[
              'grid gap-10 lg:items-start',
              showCreators ? 'grid-cols-[230px_1fr_230px]' : 'grid-cols-1',
            ].join(' ')}
          >
            {showCreators ? (
              <div className="lg:sticky lg:top-6 self-start">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur">
                  <div className="text-white font-extrabold tracking-tight mb-2">
                    Presidentiables Ranking
                  </div>
                  <div className="space-y-2">
                    {presidentiablesTop.slice(0, 20).map((p, idx) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 text-white/70 font-extrabold tabular-nums">
                            {idx + 1}
                          </div>
                          <div className="text-white font-semibold truncate">{p.name}</div>
                        </div>
                        <div className="text-white/70 font-bold tabular-nums whitespace-nowrap">
                          {formatVotes(p.votes)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-6">
              {/* Page title card */}
              <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-lg backdrop-blur">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-[2] min-w-0">
                    <h1 className="text-white font-extrabold tracking-tight leading-[1.02] text-[42px]">
                      {title}
                    </h1>

                    {notice ? (
                      <div className="mt-2 text-white/70 text-sm font-semibold">
                        {notice}
                      </div>
                    ) : null}
                  </div>

                  {/* Right: FB share + ADS space (unchanged layout) */}
                  <div className="flex items-start gap-3 flex-[1] min-w-[260px] justify-end">
                    <ShareButton />

                    <div className="h-[70px] flex-1 rounded-2xl border border-white/10 bg-black/20 flex items-center justify-center">
                      <div className="text-white/60 font-extrabold tracking-[0.35em] text-xs uppercase">
                        ADS
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-lg backdrop-blur">
                <VotingGrid presidentables={presidentables} onPresidentVoted={handlePresidentVoted} />
              </div>

              {/* ✅ CHAT ONLY AFTER PRESIDENT VOTE */}
              {showCreators ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur flex flex-col min-h-[280px]">
                  <div className="text-white font-extrabold tracking-tight">CHAT</div>
                  <ChatBox />
                </div>
              ) : null}
            </div>

            {showCreators ? (
              <div className="lg:sticky lg:top-6 self-start">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur">
                  <div className="text-white font-extrabold tracking-tight mb-2">
                    Creators Ranking
                  </div>
                  <div className="space-y-2">
                    {creatorsTop.slice(0, 20).map((c, idx) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 text-white/70 font-extrabold tabular-nums">
                            {idx + 1}
                          </div>
                          <div className="text-white font-semibold truncate">{c.name}</div>
                        </div>
                        <div className="text-white/70 font-bold tabular-nums whitespace-nowrap">
                          {formatVotes(c.votes)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  )
}
