'use client'

import { useEffect, useState } from 'react'
import ChatBox from '@/components/chat/ChatBox'

type SidebarRow = { id: string; name: string; imgUrl?: string | null; votes: number }

function formatVotes(v: number) {
  return Number(v || 0).toLocaleString('en-US')
}

function RankList({
  title,
  items,
  limit,
}: {
  title: string
  items: SidebarRow[]
  limit: number
}) {
  const list = (items ?? []).slice(0, limit)

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      <div className="text-white font-extrabold tracking-tight">{title}</div>

      <div className="mt-3 space-y-2">
        {list.map((x, idx) => (
          <div
            key={x.id}
            className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2"
          >
            <div className="w-7 text-white/80 font-extrabold tabular-nums leading-6">
              {idx + 1}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-[13px] leading-5 break-words whitespace-normal">
                {x.name}
              </div>
            </div>

            <div className="text-white/80 font-extrabold tabular-nums whitespace-nowrap text-[12px] leading-6">
              {formatVotes(x.votes)}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function LeaderboardsClient({
  creatorsTop,
  presidentiablesTop,
}: {
  creatorsTop: SidebarRow[]
  presidentiablesTop: SidebarRow[]
}) {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  if (!hydrated) return null

  return (
    <main className="min-h-screen bg-transparent">
      <div className="px-4 pt-4 pb-6 space-y-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
          <div className="text-white font-extrabold text-2xl leading-none">VoteClash</div>
          <div className="mt-1 text-white/70 text-sm">Results</div>
        </div>

        {/* ✅ Removed "(Top 8)" */}
        <RankList title="Presidentiables" items={presidentiablesTop} limit={8} />

        {/* ✅ Changed title to "Top Follows" */}
        <RankList title="Top Follows" items={creatorsTop} limit={20} />

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur flex flex-col min-h-[320px]">
          <div className="text-white font-extrabold tracking-tight">CHAT</div>
          <ChatBox />
        </div>

        <a
          href="/"
          className="block w-full text-center py-4 rounded-2xl bg-white/10 text-white font-extrabold border border-white/10"
        >
          Back to Voting
        </a>
      </div>
    </main>
  )
}
