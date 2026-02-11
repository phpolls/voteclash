'use client'

import { useEffect, useState } from 'react'
import LeaderboardSidebar from '@/components/LeaderboardSidebar'
import VotingGrid from '@/components/VotingGrid'

type PresidentableUI = { id: string; name: string; imgUrl: string; total_votes: number }
type SidebarRow = { id: string; name: string; imgUrl?: string | null; votes: number }

const LS_KEY = 'voteclash_pres_voted'

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
      <div className="mx-auto max-w-[1600px] px-6 pt-6 pb-10">
        <div
          className={[
            'grid gap-10 lg:items-start',
            showCreators ? 'grid-cols-1 lg:grid-cols-[230px_1fr_230px]' : 'grid-cols-1',
          ].join(' ')}
        >
          {/* ================= LEFT (desktop only) ================= */}
          {showCreators && (
            <div className="hidden lg:flex lg:flex-col gap-6 lg:sticky lg:top-6 h-[calc(100vh-48px)] min-h-0">
              {/* president leaderboard (scrollable, capped height) */}
              <div className="h-[55vh] min-h-0">
                <LeaderboardSidebar
                  title="Presidentiables Ranking"
                  items={presidentiablesTop.map((p) => ({
                    id: p.id,
                    name: p.name,
                    imgUrl: p.imgUrl ?? null,
                    votes: p.votes,
                  }))}
                  className="h-full"
                />
              </div>

              {/* ads under leaderboard */}
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur">
                <div className="h-[140px] rounded-2xl border border-white/10 bg-black/20 flex items-center justify-center">
                  <span className="text-white/60 text-xs font-bold tracking-widest">
                    ADS
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ================= CENTER ================= */}
          <div className="flex flex-col gap-6">

            {/* title */}
            <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-lg backdrop-blur">
              <h1 className="text-4xl font-extrabold text-white">VoteClash</h1>
              <p className="mt-2 text-white/70">Head-to-head creator battles</p>
            </div>

            {/* voting */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-lg backdrop-blur">
              <VotingGrid
                presidentables={presidentables}
                onPresidentVoted={handlePresidentVoted}
              />
            </div>

            {/* ================= CHAT (ONLY after entering battles) ================= */}
            {showCreators && (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur flex flex-col min-h-[280px]">
                <div className="font-extrabold text-white mb-2">CHAT</div>

                <div className="flex-1 overflow-auto text-white/40 text-sm">
                  No messages yet.
                </div>

                <div className="mt-3 flex gap-2">
                  <input
                    disabled
                    placeholder="Type message…"
                    className="flex-1 rounded-xl px-3 py-2 bg-black/30 text-white"
                  />
                  <button disabled className="px-4 rounded-xl bg-white text-black font-bold">
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ================= RIGHT (desktop only) ================= */}
          {showCreators && (
            <div className="hidden lg:block lg:sticky lg:top-6 h-[calc(100vh-48px)] min-h-0">
              <LeaderboardSidebar
                title="Creators Ranking"
                items={creatorsTop.map((c) => ({
                  id: c.id,
                  name: c.name,
                  imgUrl: c.imgUrl ?? null,
                  votes: c.votes,
                }))}
                className="h-full"
              />
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
