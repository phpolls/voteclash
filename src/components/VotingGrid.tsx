'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

type Side = 'A' | 'B'

type CreatorRow = {
  id: string
  name: string
  quote: string | null
  total_votes: number | null
  img_path: string | null
  side: Side | null
}

type Creator = {
  id: string
  name: string
  quote: string | null
  total_votes: number
  imgUrl: string | null
  side: Side
}

type PresidentableDb = {
  id: string
  name: string
  imgUrl: string
  total_votes: number
}

type PresidentableUI = {
  id: string
  name: string
  imgUrl: string
  total_votes: number
  age: number
  role: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !anonKey) {
  throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

const supabase = createClient(supabaseUrl, anonKey)
const BUCKET = 'cards'
const LS_PRES_KEY = 'voteclash_pres_voted'

const PRES_META: Record<string, { age: number; role: string }> = {
  'duterte-sara': { age: 47, role: 'Vice President of the Philippines' },
  'hontiveros-risa': { age: 59, role: 'Senator of the Philippines' },
  'pacquiao-manny': { age: 47, role: 'Boxing Legend and Former Senator' },
  'poe-grace': { age: 57, role: 'Former Senator of the Philippines' },
  'remulla-jonvic': { age: 58, role: 'Secretary of the Interior and Local Government' },
  'robredo-leni': { age: 60, role: 'Mayor, Naga City' },
  'romualdez-martin': { age: 62, role: 'Former Speaker of the House' },
  'tulfo-raffy': { age: 65, role: 'Senator of the Philippines' },
}

const DEFAULT_PRESIDENTABLES: PresidentableUI[] = []

function safeImg(src?: string) {
  if (!src) return 'data:image/gif;base64,R0lGODlhAQABAAAAACw='
  return src
}

function formatVotes(v: number | null | undefined) {
  return Number(v || 0).toLocaleString('en-US')
}

function toCreator(row: CreatorRow): Creator | null {
  const side = row.side === 'A' || row.side === 'B' ? row.side : null
  if (!side) return null

  const raw = row.img_path?.trim() || ''
  const imgUrl = raw
    ? raw.startsWith('http')
      ? raw
      : supabase.storage.from(BUCKET).getPublicUrl(raw).data.publicUrl
    : null

  return {
    id: row.id,
    name: row.name,
    quote: row.quote,
    total_votes: Number(row.total_votes ?? 0),
    imgUrl,
    side,
  }
}

/* -------------------- Creator Card -------------------- */

function Media({ src, alt }: { src: string | null; alt: string }) {
  return (
    <img
      src={safeImg(src || '')}
      alt={alt}
      className="absolute inset-0 h-full w-full object-cover"
    />
  )
}

function CreatorCard({ c, onVote, voting }: { c: Creator; onVote: () => void; voting: boolean }) {
  return (
    <div className="relative h-[320px] sm:h-[420px] lg:h-[520px] rounded-3xl overflow-hidden bg-black shadow-xl border border-black/10">
      <Media src={c.imgUrl} alt={c.name} />

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />

      <div className="absolute inset-0 flex flex-col justify-end p-5 pt-24">
        <h2 className="text-xl font-extrabold text-white">{c.name}</h2>

        <button
          disabled={voting}
          onClick={onVote}
          className="mt-3 w-full py-3 rounded-2xl bg-white text-black font-extrabold"
        >
          {voting ? 'VOTING...' : 'VOTE'}
        </button>
      </div>
    </div>
  )
}

/* -------------------- Presidentables -------------------- */

function Presidentables({
  presidentables,
  onPick,
  pending,
  selectedId,
}: {
  presidentables?: PresidentableDb[]
  onPick: (id: string) => void
  pending: boolean
  selectedId: string | null
}) {
  const merged: PresidentableUI[] = useMemo(() => {
    const list =
      Array.isArray(presidentables) && presidentables.length > 0
        ? presidentables
        : DEFAULT_PRESIDENTABLES

    return list.map((p) => {
      const meta = PRES_META[p.id] ?? { age: 0, role: '' }
      return {
        id: p.id,
        name: p.name,
        imgUrl: p.imgUrl,
        total_votes: Number(p.total_votes ?? 0),
        age: meta.age,
        role: meta.role,
      }
    })
  }, [presidentables])

  return (
    <section className="mb-2">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {merged.map((p) => {
          const isSelected = selectedId === p.id

          return (
            <button
              key={p.id}
              onClick={() => onPick(p.id)}
              disabled={pending}
              className={[
                'relative overflow-hidden rounded-3xl border bg-white shadow-sm',
                isSelected ? 'ring-2 ring-neutral-900/30' : 'border-neutral-200',
                // 🔥 FIX: TRUE 4:5 aspect ratio on desktop
                'h-[18vh] min-h-[120px] max-h-[160px] lg:h-auto lg:aspect-[4/5]',
              ].join(' ')}
            >
              <div className="absolute inset-0">
                {/* FULL BLEED — NO SHRINK */}
                <img
                  src={safeImg(p.imgUrl)}
                  alt={p.name}
                  className="h-full w-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              </div>

              <div className="relative flex h-full flex-col justify-end p-3">
                <div className="text-white font-semibold text-sm">
                  {p.name}, {p.age}
                </div>
                <div className="text-white/70 text-xs">
                  {p.role}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

/* -------------------- Main -------------------- */

export default function VotingGrid({
  presidentables,
  onPresidentVoted,
}: {
  presidentables?: PresidentableDb[]
  onPresidentVoted?: () => void
}) {
  const router = useRouter()

  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])

  const [presVoteDone, setPresVoteDone] = useState(false)
  const [presVotePending, setPresVotePending] = useState(false)
  const [selectedPresidentId, setSelectedPresidentId] = useState<string | null>(null)

  const [left, setLeft] = useState<Creator | null>(null)
  const [right, setRight] = useState<Creator | null>(null)

  if (!hydrated) return null

  if (!presVoteDone) {
    return (
      <Presidentables
        presidentables={presidentables}
        onPick={(id) => {
          setSelectedPresidentId(id)
          setPresVoteDone(true)
          onPresidentVoted?.()
        }}
        pending={presVotePending}
        selectedId={selectedPresidentId}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {left && <CreatorCard c={left} voting={false} onVote={() => {}} />}
      {right && <CreatorCard c={right} voting={false} onVote={() => {}} />}
    </div>
  )
}
