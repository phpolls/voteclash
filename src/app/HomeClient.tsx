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
  const title = isPres ? 'CHOOSE YOUR NEXT PRESIDENT' : 'Shallow Or Follow'
  const notice = isPres ? 'ONE VOTE ONLY' : null

  return (
    <main className="min-h-screen bg-transparent">
      {/* ================= MOBILE ================= */}
      <div className="lg:hidden px-4 pt-4 pb-4 space-y-3">
        <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-white/6 px-5 py-5 backdrop-blur">
          {/* subtle top sheen */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent" />

          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div
                className={[
                  'text-white font-extrabold uppercase',
                  'tracking-[-0.02em] leading-[0.96]',
                  isPres ? 'text-[26px]' : 'text-[24px]',
                ].join(' ')}
              >
                {title}
              </div>

              {notice ? (
                <div className="mt-3 inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-white" />
                  <span className="text-white font-extrabold tracking-[0.22em] text-[11px] uppercase">
                    {notice}
                  </span>
                  <span className="h-2 w-2 rounded-full bg-white/50" />
                </div>
              ) : null}
            </div>

            {/* share slot (empty, no icon yet) */}
            <div
              aria-label="Share slot"
              className="h-10 w-10 rounded-2xl border border-white/10 bg-black/15"
            />
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
              {/* Title card */}
              <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-white/6 px-7 py-6 shadow-lg backdrop-blur">
                {/* cinematic glow bands (subtle, not cheesy) */}
                <div className="pointer-events-none absolute -top-24 left-0 right-0 h-48 bg-gradient-to-b from-white/12 via-transparent to-transparent" />
                <div className="pointer-events-none absolute -bottom-24 left-0 right-0 h-48 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

                <div className="relative flex items-start justify-between gap-6">
                  <div className="min-w-0 flex-1">
                    <h1
                      className={[
                        'text-white font-extrabold uppercase',
                        'leading-[0.92] tracking-[-0.03em]',
                        isPres ? 'text-[54px]' : 'text-[46px]',
                      ].join(' ')}
                    >
                      {title}
                    </h1>

                    {notice ? (
                      <div className="mt-4 flex items-center gap-3">
                        <div className="inline-flex items-center gap-3 rounded-full border border-white/18 bg-black/25 px-5 py-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-white" />
                          <span className="text-white font-extrabold tracking-[0.30em] text-[12px] uppercase">
                            {notice}
                          </span>
                          <span className="h-2.5 w-2.5 rounded-full bg-white/40" />
                        </div>
                        <div className="text-white/55 text-sm font-semibold">
                          Choose carefully.
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* share slot (empty, no icon yet) */}
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
