'use client'

import { useEffect, useState } from 'react'
import VotingGrid from '@/components/VotingGrid'

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

  return (
    <main className="min-h-screen bg-transparent">
      {/* ================= MOBILE (Voting only + Show Results button) ================= */}
      <div className="lg:hidden px-4 pt-4 pb-4 space-y-3">
        {/* Website name + title */}
        <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
          <div className="text-white font-extrabold text-2xl leading-none">VoteClash</div>
          <div className="mt-1 text-white/70 text-sm">Head-to-head creator battles</div>
        </div>

        {/* Voting */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-3 backdrop-blur">
          <VotingGrid presidentables={presidentables} onPresidentVoted={handlePresidentVoted} />
        </div>

        {/* After president vote: show results button (no chat on home) */}
        {showCreators ? (
          <a
            href="/leaderboards"
            className="block w-full text-center py-4 rounded-2xl bg-white text-black font-extrabold"
          >
            Show Results
          </a>
        ) : null}
      </div>

      {/* ================= DESKTOP (UNCHANGED: your exact block) ================= */}
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
              <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-lg backdrop-blur">
                <div className="flex items-center gap-6">
                  <div className="flex-[2] min-w-0">
                    <h1 className="text-4xl font-extrabold tracking-tight text-white leading-none">
                      VoteClash
                    </h1>
                    <p className="mt-2 text-white/70">Head-to-head creator battles</p>
                  </div>

                  <div className="flex-[1] min-w-[260px]">
                    <div className="h-[70px] rounded-2xl border border-white/10 bg-black/20 flex items-center justify-center">
                      <div className="text-white/60 font-extrabold tracking-[0.35em] text-xs uppercase">
                        ADS
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-lg backdrop-blur">
                <VotingGrid
                  presidentables={presidentables}
                  onPresidentVoted={handlePresidentVoted}
                />
              </div>

              {showCreators ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur flex flex-col min-h-[280px]">
                  <div className="text-white font-extrabold tracking-tight">CHAT</div>
                  <div className="mt-3 flex-1 min-h-0 overflow-auto rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="text-white/35 text-xs">No messages yet.</div>
                  </div>
                  <div className="mt-3 flex-shrink-0 flex items-center gap-2">
                    <input
                      className="flex-1 min-w-0 h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-white/35 outline-none"
                      placeholder="Type your message…"
                      disabled
                    />
                    <button
                      className="h-11 px-5 rounded-2xl bg-white text-black font-extrabold disabled:opacity-60"
                      disabled
                    >
                      Send
                    </button>
                  </div>
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
