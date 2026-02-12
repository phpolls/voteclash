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

  return (
    <main className="min-h-screen bg-transparent">
      {/* ================= MOBILE ================= */}
      <div className="lg:hidden px-4 pt-4 pb-4 space-y-3">
        {/* keep mobile as-is for now; III will handle mobile creators header */}
        <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur">
          <div className="text-white font-extrabold text-2xl leading-none">
            {isPres ? 'CHOOSE YOUR NEXT PRESIDENT' : 'Shallow Or Follow'}
          </div>
          {isPres ? (
            <div className="mt-2 inline-flex items-center rounded-full border border-white/15 bg-black/25 px-3 py-1">
              <span className="text-white font-extrabold tracking-[0.26em] text-[10px] uppercase">ONE VOTE ONLY</span>
            </div>
          ) : null}
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
              showCreators ? 'grid-cols-[260px_1fr_260px]' : 'grid-cols-1',
            ].join(' ')}
          >
            {/* LEFT SIDEBAR (WEB creators only) */}
            {showCreators ? (
              <div className="lg:sticky lg:top-6 self-start">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur">
                  <div className="text-white font-extrabold tracking-tight mb-3">
                    Presidentiables Ranking
                  </div>

                  <div className="space-y-2">
                    {presidentiablesTop.slice(0, 20).map((p, idx) => (
                      <div
                        key={p.id}
                        className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2"
                      >
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <div className="w-6 shrink-0 text-white/70 font-extrabold tabular-nums">
                            {idx + 1}
                          </div>

                          {/* ✅ no truncate, wrap fully */}
                          <div className="min-w-0 flex-1 text-[12px] leading-snug text-white font-semibold whitespace-normal break-words">
                            {p.name}
                          </div>
                        </div>

                        {/* ✅ fixed vote column, supports millions */}
                        <div className="shrink-0 w-[96px] text-right text-[12px] leading-snug text-white/75 font-extrabold tabular-nums whitespace-nowrap">
                          {formatVotes(p.votes)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {/* CENTER */}
            <div className="flex flex-col gap-4">
              {/* ✅ WEB HEADER (no ADS box) */}
              <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 shadow-lg backdrop-blur">
                {isPres ? (
                  <>
                    <div className="text-white font-extrabold uppercase tracking-[-0.03em] leading-[0.92] text-[34px]">
                      CHOOSE YOUR NEXT PRESIDENT
                    </div>
                    <div className="mt-2 inline-flex items-center rounded-full border border-white/15 bg-black/25 px-4 py-1.5">
                      <span className="text-white font-extrabold tracking-[0.28em] text-[11px] uppercase">
                        ONE VOTE ONLY
                      </span>
                    </div>

                    {/* share slot (empty) */}
                    <div className="mt-3 h-[44px] w-[44px] rounded-2xl border border-white/10 bg-black/15" />
                  </>
                ) : (
                  <>
                    {/* ✅ II.A.2: Creators contest title (WEB only) */}
                    <div className="flex items-start justify-between gap-6">
                      <div className="min-w-0 flex-1">
                        <div className="text-white/70 text-[12px] font-extrabold tracking-[0.35em] uppercase">
                          Creators Contest
                        </div>

                        <h1 className="mt-1 text-white font-black tracking-[-0.035em] leading-[0.88] text-[48px]">
                          <span className="bg-gradient-to-r from-white via-white to-white/65 bg-clip-text text-transparent">
                            Shallow
                          </span>
                          <span className="text-white/55"> Or </span>
                          <span className="bg-gradient-to-r from-white via-white to-white/65 bg-clip-text text-transparent">
                            Follow
                          </span>
                        </h1>

                        <div className="mt-2 text-white/70 text-sm">
                          Pick who you&apos;d <span className="text-white font-bold">FOLLOW</span>.
                        </div>
                      </div>

                      {/* share slot (empty, no icon yet) */}
                      <div className="shrink-0">
                        <div className="h-[48px] w-[48px] rounded-2xl border border-white/10 bg-black/15" />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
                <VotingGrid presidentables={presidentables} onPresidentVoted={handlePresidentVoted} />
              </div>

              {/* ✅ CHAT ONLY AFTER PRESIDENT VOTE (your rule) */}
              {showCreators ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur flex flex-col min-h-[280px]">
                  <div className="text-white font-extrabold tracking-tight">CHAT</div>
                  <ChatBox />
                </div>
              ) : null}
            </div>

            {/* RIGHT SIDEBAR (WEB creators only) */}
            {showCreators ? (
              <div className="lg:sticky lg:top-6 self-start">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur">
                  <div className="text-white font-extrabold tracking-tight mb-3">
                    Creators Ranking
                  </div>

                  <div className="space-y-2">
                    {creatorsTop.slice(0, 20).map((c, idx) => (
                      <div
                        key={c.id}
                        className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2"
                      >
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <div className="w-6 shrink-0 text-white/70 font-extrabold tabular-nums">
                            {idx + 1}
                          </div>

                          {/* ✅ no truncate, wrap fully */}
                          <div className="min-w-0 flex-1 text-[12px] leading-snug text-white font-semibold whitespace-normal break-words">
                            {c.name}
                          </div>
                        </div>

                        {/* ✅ fixed vote column, supports millions */}
                        <div className="shrink-0 w-[96px] text-right text-[12px] leading-snug text-white/75 font-extrabold tabular-nums whitespace-nowrap">
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
