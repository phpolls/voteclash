'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import VotingGrid from '@/components/VotingGrid'
import ChatBox from '@/components/chat/ChatBox'
import ShareFacebookButton from '@/components/ShareFacebookButton'

type PresidentableUI = { id: string; name: string; imgUrl: string; total_votes: number }
type SidebarRow = { id: string; name: string; imgUrl?: string | null; votes: number }

const LS_KEY = 'voteclash_pres_voted'

function formatVotes(v: any) {
  const n = typeof v === 'number' ? v : Number(v ?? 0)
  return Number.isFinite(n) ? n.toLocaleString('en-US') : '0'
}

function RankRow({ idx, name, votes }: { idx: number; name: string; votes: number }) {
  return (
    <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-black/20 px-2.5 py-2">
      <span className="text-white/70 font-extrabold tabular-nums text-[12px] xl:text-[13px]">
        {idx}
      </span>

      <span
        title={name}
        className="flex-1 min-w-0 text-white font-semibold whitespace-nowrap overflow-hidden text-[12px] xl:text-[13px] tracking-tight"
      >
        {name}
      </span>

      <span className="text-right text-[12px] xl:text-[13px] font-extrabold tabular-nums text-white/85 whitespace-nowrap">
        {formatVotes(votes)}
      </span>
    </div>
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
  const router = useRouter()
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

    // ✅ force fresh server props (prod-safe if page is force-dynamic/noStore)
    router.refresh()
  }

  if (!hydrated) return null

  const isPres = !showCreators

  return (
    <main className="min-h-screen bg-transparent">
      {/* ================= MOBILE ================= */}
      <div className="lg:hidden px-4 pt-4 pb-4 space-y-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {isPres ? (
                <>
                  <div className="text-white font-extrabold uppercase tracking-[-0.03em] leading-[0.95] text-[18px]">
                    CHOOSE YOUR NEXT PRESIDENT
                  </div>
                  <div className="mt-2 inline-flex items-center rounded-full border border-white/15 bg-black/25 px-3 py-1">
                    <span className="text-white font-extrabold tracking-[0.26em] text-[10px] uppercase">
                      ONE VOTE ONLY
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-white font-black tracking-[-0.04em] leading-[0.92] text-[28px]">
                  <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
                    Shallow
                  </span>
                  <span className="text-white/55"> Or </span>
                  <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
                    Follow
                  </span>
                </div>
              )}
            </div>

            <div className="shrink-0">
              <ShareFacebookButton className="px-3 py-2" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-3 backdrop-blur">
          <VotingGrid presidentables={presidentables} onPresidentVoted={handlePresidentVoted} />
        </div>

        {showCreators ? (
          <button
            type="button"
            onClick={() => {
              // ✅ cache-bust navigation (fixes prod stale /leaderboards)
              window.location.assign(`/leaderboards?ts=${Date.now()}`)
            }}
            className="block w-full text-center py-4 rounded-2xl bg-white text-black font-extrabold"
          >
            Show Results
          </button>
        ) : null}
      </div>

      {/* ================= DESKTOP ================= */}
      <div className="hidden lg:block">
        <div className="mx-auto max-w-[1600px] px-6 pt-4 pb-6">
          <div
            className={[
              'grid lg:items-start',
              'gap-6 xl:gap-7',
              showCreators
                ? 'grid-cols-[clamp(280px,20vw,340px)_minmax(0,1fr)_clamp(280px,20vw,340px)]'
                : 'grid-cols-1',
            ].join(' ')}
          >
            {showCreators ? (
              <div className="lg:sticky lg:top-4 self-start">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur">
                  <div className="text-white font-extrabold tracking-tight mb-3">
                    Presidentiables Ranking
                  </div>
                  <div className="space-y-2">
                    {presidentiablesTop.slice(0, 20).map((p, i) => (
                      <RankRow key={p.id} idx={i + 1} name={p.name} votes={p.votes} />
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-2 shadow-lg backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    {isPres ? (
                      <>
                        <h1 className="text-white font-extrabold uppercase tracking-[-0.03em] leading-[0.90] text-[24px]">
                          CHOOSE YOUR NEXT PRESIDENT
                        </h1>
                        <div className="mt-2 inline-flex items-center rounded-full border border-white/15 bg-black/25 px-3 py-1">
                          <span className="text-white font-extrabold tracking-[0.28em] text-[10px] uppercase">
                            ONE VOTE ONLY
                          </span>
                        </div>
                      </>
                    ) : (
                      <h1 className="text-white font-black tracking-[-0.04em] leading-[0.90] text-[42px]">
                        <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
                          Shallow
                        </span>
                        <span className="text-white/55"> Or </span>
                        <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
                          Follow
                        </span>
                      </h1>
                    )}
                  </div>

                  <div className="shrink-0 pt-1">
                    <ShareFacebookButton />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur">
                <VotingGrid presidentables={presidentables} onPresidentVoted={handlePresidentVoted} />
              </div>

              {showCreators ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur flex flex-col min-h-[280px]">
                  <div className="text-white font-extrabold tracking-tight">CHAT</div>
                  <ChatBox />
                </div>
              ) : null}
            </div>

            {showCreators ? (
              <div className="lg:sticky lg:top-4 self-start">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur">
                  <div className="text-white font-extrabold tracking-tight mb-3">Leaderboard</div>
                  <div className="space-y-2">
                    {creatorsTop.slice(0, 20).map((c, i) => (
                      <RankRow key={c.id} idx={i + 1} name={c.name} votes={c.votes} />
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
