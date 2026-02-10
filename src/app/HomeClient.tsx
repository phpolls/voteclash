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
    <main className="min-h-screen bg-transparent overflow-x-auto">
      <div className="mx-auto min-h-screen max-w-[1600px] px-6 py-6 min-w-[1200px]">
        <div className="min-h-screen grid gap-10 items-start grid-cols-[230px_1fr_230px]">
          {/* LEFT: flush top */}
          <div className="min-h-0 flex flex-col gap-6">
            {showCreators ? (
              <>
                <div className="flex-shrink-0">
                  <LeaderboardSidebar
                    title="Presidentiables Ranking"
                    items={presidentiablesTop.map((p) => ({
                      id: p.id,
                      name: p.name,
                      imgUrl: p.imgUrl ?? null,
                      votes: p.votes,
                    }))}
                    limit={20}
                  />
                </div>

                {/* CHAT: fills remaining height */}
                <div className="flex-1 min-h-0 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur flex flex-col">
                  <div className="flex-shrink-0">
                    <div className="text-white font-extrabold tracking-tight">CHAT WARS</div>
                    <div className="mt-1 text-white/60 text-xs">
                      Realtime trash talk (placeholder)
                    </div>
                  </div>

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
              </>
            ) : (
              <div className="flex-1 min-h-0" />
            )}
          </div>

          {/* CENTER: title + ads ONLY above voting */}
          <div className="min-h-0 flex flex-col gap-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-lg backdrop-blur">
              <div className="flex items-center gap-6">
                <div className="flex-[2] min-w-0">
                  <h1 className="text-4xl font-extrabold tracking-tight text-white leading-none">
                    VoteClash
                  </h1>
                  <p className="mt-2 text-white/70">Head-to-head creator battles</p>
                </div>

                {/* Adsense reserved space (center column only) */}
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
          </div>

          {/* RIGHT: flush top */}
          <div className="min-h-0 flex flex-col gap-6">
            {showCreators ? (
              <div className="flex-shrink-0">
                <LeaderboardSidebar
                  title="Creators Ranking"
                  items={creatorsTop.map((c) => ({
                    id: c.id,
                    name: c.name,
                    imgUrl: c.imgUrl ?? null,
                    votes: c.votes,
                  }))}
                  limit={20}
                />
              </div>
            ) : null}

            <div className="flex-1 min-h-0" />
          </div>
        </div>
      </div>
    </main>
  )
}
