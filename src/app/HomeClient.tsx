// src/app/HomeClient.tsx
'use client'

import { useEffect, useState } from 'react'
import VotingGrid from '@/components/VotingGrid'
import ChatBox from '@/components/chat/ChatBox'
import Arena2HWordmark from '@/components/Arena2HWordmark'

type PresidentableUI = { id: string; name: string; imgUrl: string; total_votes: number }
type SidebarRow = { id: string; name: string; imgUrl?: string | null; votes: number }

const LS_KEY = 'voteclash_pres_voted'

function formatVotes(v: number) {
  return Number(v || 0).toLocaleString('en-US')
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

  const isPres = !showCreators
  const title = isPres ? 'CHOOSE YOUR NEXT PRESIDENT' : 'SHALLOW OR FOLLOW'
  const showOneVote = isPres

  return (
    <main className="min-h-screen bg-transparent">
      {/* ================= MOBILE ================= */}
      <div className="lg:hidden px-4 pt-4 pb-4 space-y-3">
        {/* ✅ single compact hero: Arena2H + contest title + one-vote badge + share slot */}
        <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-white/6 px-4 py-4 backdrop-blur">
          {/* subtle sheen (doesn't add height) */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent" />

          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              {/* Arena2H (small, crisp) */}
              <div className="leading-none">
                <div className="scale-[0.88] origin-left">
                  <Arena2HWordmark />
                </div>
              </div>

              {/* Title (stylized, not boring) */}
              <div
                className={[
                  'mt-2 uppercase font-extrabold',
                  'tracking-[-0.03em] leading-[0.92]',
                  'text-[22px]',
                ].join(' ')}
              >
                <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
                  {title}
                </span>
              </div>

              {showOneVote ? (
                <div className="mt-2 inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-white" />
                  <span className="text-white font-extrabold tracking-[0.28em] text-[11px] uppercase">
                    ONE VOTE ONLY
                  </span>
                  <span className="h-2 w-2 rounded-full bg-white/40" />
                </div>
              ) : null}
            </div>

            {/* Share slot (empty, no icon yet) */}
            <div className="shrink-0">
              <div className="h-10 w-10 rounded-2xl border border-white/10 bg-black/15" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-3 backdrop-blur">
          <VotingGrid presidentables={presidentables} onPresidentVoted={handlePresidentVoted} />
        </div>

        {showCreators ? (
          <a href="/leaderboards" className="block w-full text-center py-4 rounded-2xl bg-white text-black font-extrabold">
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
                  <div className="text-white font-extrabold tracking-tight mb-2">Presidentiables Ranking</div>
                  <div className="space-y-2">
                    {presidentiablesTop.slice(0, 20).map((p, idx) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 text-white/70 font-extrabold tabular-nums">{idx + 1}</div>
                          <div className="text-white font-semibold truncate">{p.name}</div>
                        </div>
                        <div className="text-white/70 font-bold tabular-nums whitespace-nowrap">{formatVotes(p.votes)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-5">
              {/* ✅ single compact hero (no ADS, no extra header, pulls cards up) */}
              <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-white/6 px-6 py-5 shadow-lg backdrop-blur">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent" />

                <div className="relative flex items-start justify-between gap-6">
                  <div className="min-w-0 flex-1">
                    {/* Arena2H */}
                    <div className="leading-none">
                      <div className="scale-[0.92] origin-left">
                        <Arena2HWordmark />
                      </div>
                    </div>

                    {/* Title (cinematic) */}
                    <h1
                      className={[
                        'mt-2 uppercase font-extrabold',
                        'tracking-[-0.04em] leading-[0.90]',
                        isPres ? 'text-[44px]' : 'text-[40px]',
                      ].join(' ')}
                    >
                      <span className="bg-gradient-to-r from-white via-white to-white/65 bg-clip-text text-transparent">
                        {title}
                      </span>
                    </h1>

                    {showOneVote ? (
                      <div className="mt-3">
                        <div className="inline-flex items-center gap-3 rounded-full border border-white/16 bg-black/25 px-5 py-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-white" />
                          <span className="text-white font-extrabold tracking-[0.32em] text-[12px] uppercase">
                            ONE VOTE ONLY
                          </span>
                          <span className="h-2.5 w-2.5 rounded-full bg-white/35" />
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Share slot (empty) */}
                  <div className="shrink-0">
                    <div className="h-[52px] w-[52px] rounded-2xl border border-white/10 bg-black/15" />
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
                  <div className="text-white font-extrabold tracking-tight mb-2">Creators Ranking</div>
                  <div className="space-y-2">
                    {creatorsTop.slice(0, 20).map((c, idx) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 text-white/70 font-extrabold tabular-nums">{idx + 1}</div>
                          <div className="text-white font-semibold truncate">{c.name}</div>
                        </div>
                        <div className="text-white/70 font-bold tabular-nums whitespace-nowrap">{formatVotes(c.votes)}</div>
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
