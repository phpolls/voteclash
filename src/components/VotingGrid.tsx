'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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

const BUCKET = 'cards'
const LS_PRES_KEY = 'voteclash_pres_voted'

// ✅ Hardcoded age/role
const PRES_META: Record<string, { age: number; role: string }> = {
  'duterte-sara': { age: 47, role: 'Vice President of the Philippines' },
  'hontiveros-risa': { age: 59, role: 'Senator of the Philippines' },
  'pacquiao-manny': { age: 47, role: 'Boxing Legend and Former Senator' },
  'poe-grace': { age: 57, role: 'Former Senator of the Philippines' },
  'remulla-jonvic': { age: 58, role: 'Secretary of the Interior and Local Government' },
  'robredo-leni': { age: 60, role: 'Mayor, Naga City' },
  'romualdez-martin': { age: 62, role: 'Former Speaker of the House' },
  'tulfo-raffy': { age: 65, role: 'Senator of the Philippines' },
  'jonvic-remulla': { age: 58, role: 'Secretary of the Interior and Local Government' },
}

const DEFAULT_PRESIDENTABLES: PresidentableUI[] = [
  { id: 'duterte-sara', name: 'Sara Duterte', age: 47, role: 'Vice President of the Philippines', imgUrl: '', total_votes: 0 },
  { id: 'hontiveros-risa', name: 'Risa Hontiveros', age: 59, role: 'Senator of the Philippines', imgUrl: '', total_votes: 0 },
  { id: 'pacquiao-manny', name: 'Manny Pacquiao', age: 47, role: 'Boxing Legend and Former Senator', imgUrl: '', total_votes: 0 },
  { id: 'poe-grace', name: 'Grace Poe', age: 57, role: 'Former Senator of the Philippines', imgUrl: '', total_votes: 0 },
  { id: 'remulla-jonvic', name: 'Jonvic Remulla', age: 58, role: 'Secretary of the Interior and Local Government', imgUrl: '', total_votes: 0 },
  { id: 'robredo-leni', name: 'Leni Robredo', age: 60, role: 'Mayor, Naga City', imgUrl: '', total_votes: 0 },
  { id: 'romualdez-martin', name: 'Martin Romualdez', age: 62, role: 'Former Speaker of the House', imgUrl: '', total_votes: 0 },
  { id: 'tulfo-raffy', name: 'Raffy Tulfo', age: 65, role: 'Senator of the Philippines', imgUrl: '', total_votes: 0 },
]

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
    quote: row.quote && row.quote.trim().length ? row.quote.trim() : null,
    total_votes: Number(row.total_votes ?? 0),
    imgUrl,
    side,
  }
}

/* -------------------- Creator UI -------------------- */

function Media({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 to-black flex items-center justify-center">
        <div className="text-white/25 text-xs tracking-[0.35em] uppercase">Image pending</div>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className="absolute inset-0 h-full w-full object-cover"
      onError={(e) => {
        e.currentTarget.style.display = 'none'
      }}
    />
  )
}

function AutoFitQuote({ text, maxPx = 22, minPx = 12 }: { text: string; maxPx?: number; minPx?: number }) {
  const boxRef = useRef<HTMLDivElement | null>(null)
  const pRef = useRef<HTMLParagraphElement | null>(null)

  const [fontPx, setFontPx] = useState(maxPx)
  const [scrollable, setScrollable] = useState(false)

  useLayoutEffect(() => {
    const box = boxRef.current
    const p = pRef.current
    if (!box || !p) return

    const SAFE_PX = 10
    setScrollable(false)
    p.style.lineHeight = '1.25'

    const fitsAt = (px: number) => {
      p.style.fontSize = `${px}px`
      const pH = p.getBoundingClientRect().height
      const boxH = box.clientHeight
      return pH <= boxH - SAFE_PX
    }

    let lo = minPx
    let hi = maxPx
    let best = minPx

    for (let i = 0; i < 12; i++) {
      const mid = Math.floor((lo + hi) / 2)
      if (fitsAt(mid)) {
        best = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }

    best = Math.max(minPx, best - 1)
    p.style.fontSize = `${best}px`
    setFontPx(best)

    p.style.fontSize = `${minPx}px`
    const minFits = fitsAt(minPx)
    if (!minFits) {
      p.style.fontSize = `${best}px`
      setScrollable(true)
    } else {
      p.style.fontSize = `${best}px`
      setScrollable(false)
    }
  }, [text, maxPx, minPx])

  return (
    <div
      ref={boxRef}
      className={[
        'mt-2 px-4 py-3 rounded-2xl bg-black/30 border border-white/10 h-[96px] sm:h-[120px] md:h-[178px]',
        scrollable ? 'overflow-auto' : 'overflow-hidden',
      ].join(' ')}
    >
      <p
        ref={pRef}
        className="m-0 font-semibold italic text-cyan-300 text-left whitespace-normal break-words"
        style={{ fontSize: `${fontPx}px`, lineHeight: 1.25 as any }}
      >
        “{text}”
      </p>
    </div>
  )
}

function QuoteBlock({ quote }: { quote: string | null }) {
  if (!quote) {
    return (
      <div className="mt-2 px-4 py-3 rounded-2xl bg-black/30 border border-white/10 h-[96px] sm:h-[120px] md:h-[178px] flex items-start overflow-hidden">
        <p className="m-0 text-white/40 text-sm text-left">No quote yet.</p>
      </div>
    )
  }

  return <AutoFitQuote text={quote} maxPx={22} minPx={12} />
}

function VotesBadge({ votes }: { votes: number }) {
  return (
    <div className="absolute top-3 right-3 z-30">
      <div className="rounded-2xl bg-black/45 border border-white/10 px-3 py-2 text-center backdrop-blur">
        <div className="text-[10px] text-white/60 tracking-[0.35em] uppercase">Votes</div>
        <div className="text-white text-lg font-extrabold tabular-nums leading-none mt-1 whitespace-nowrap text-right">
          {formatVotes(votes)}
        </div>
      </div>
    </div>
  )
}

function CreatorCard({ c, onVote, voting }: { c: Creator; onVote: () => void; voting: boolean }) {
  return (
    <div className="relative h-[320px] sm:h-[420px] lg:h-[520px] rounded-3xl overflow-hidden bg-black shadow-xl border border-black/10">
      <Media src={c.imgUrl} alt={c.name} />
      <VotesBadge votes={c.total_votes} />

      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />

      <div className="absolute inset-0 z-20 flex flex-col justify-end p-5 pt-24">
        <h2
          className="text-[16px] sm:text-lg md:text-xl font-extrabold text-white tracking-tight leading-tight pr-16 whitespace-normal break-normal"
          style={{
            textShadow:
              '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 2px 0 #000, 0 -2px 0 #000, 2px 0 0 #000, -2px 0 0 #000',
          }}
        >
          {c.name}
        </h2>

        <QuoteBlock quote={c.quote} />

        <button
          disabled={voting}
          onClick={onVote}
          className="mt-2 w-full py-3 rounded-2xl bg-white text-black font-extrabold tracking-wide hover:bg-neutral-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {voting ? 'VOTING...' : 'VOTE'}
        </button>
      </div>
    </div>
  )
}

/* -------------------- Presidentables UI -------------------- */

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
    const list = Array.isArray(presidentables) && presidentables.length > 0 ? presidentables : []
    if (list.length === 0) return DEFAULT_PRESIDENTABLES

    return list
      .map((p) => {
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
      .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
  }, [presidentables])

  return (
    // ✅ Removed the "Presidentables / Pick ONE candidate" header to pull grid up
    <section className="mb-0">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-2">
        {merged.map((p) => {
          const isSelected = selectedId === p.id
          return (
            <button
              key={p.id}
              onClick={() => onPick(p.id)}
              disabled={pending}
              className={[
                'group relative overflow-hidden rounded-3xl border bg-white text-left shadow-sm transition',
                'cursor-pointer hover:-translate-y-0.5 hover:shadow-md',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20',
                isSelected ? 'border-neutral-900/40 ring-2 ring-neutral-900/20' : 'border-neutral-200',
                pending ? 'opacity-80' : 'hover:bg-neutral-50',
                'aspect-[4/5]',
              ].join(' ')}
              style={{ minWidth: 0 }}
            >
              <div className="absolute inset-0">
                <img
                  src={safeImg(p.imgUrl)}
                  alt={p.name}
                  draggable={false}
                  className="h-full w-full object-cover object-top bg-black"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).src = safeImg()
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10" />
              </div>

              {!pending ? (
                <div className="absolute right-3 top-3 z-10 rounded-full border border-white/20 bg-black/25 px-2 py-0.5 text-[10px] font-semibold text-white/85 backdrop-blur-sm">
                  Vote
                </div>
              ) : null}

              <div className="relative flex h-full flex-col justify-end p-3 lg:p-2">
                <div className="text-[13px] sm:text-[16px] font-semibold leading-tight text-white">
                  {p.name}, {p.age}
                </div>

                <div className="mt-0.5 text-[11px] sm:text-sm leading-snug text-white/70">
                  <div
                    className="whitespace-normal break-words overflow-hidden"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical' as any,
                    }}
                  >
                    {p.role}
                  </div>
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
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!hydrated) return
    try {
      setPresVoteDone(localStorage.getItem(LS_PRES_KEY) === '1')
    } catch {
      setPresVoteDone(false)
    }
  }, [hydrated])

  async function loadMatchup() {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.from('creators').select('id,name,quote,total_votes,img_path,side').limit(500)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const rows = (data ?? []) as CreatorRow[]
    const teamA = rows.map(toCreator).filter((x): x is Creator => !!x && x.side === 'A')
    const teamB = rows.map(toCreator).filter((x): x is Creator => !!x && x.side === 'B')

    if (teamA.length < 1 || teamB.length < 1) {
      setError('Need at least 1 creator in side A and 1 creator in side B.')
      setLoading(false)
      return
    }

    const a = teamA[Math.floor(Math.random() * teamA.length)]
    const b = teamB[Math.floor(Math.random() * teamB.length)]

    if (Math.random() < 0.5) {
      setLeft(b)
      setRight(a)
    } else {
      setLeft(a)
      setRight(b)
    }

    setLoading(false)
  }

  useEffect(() => {
    if (presVoteDone) loadMatchup()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presVoteDone])

  async function voteCreator(winnerId: string) {
    if (!left || !right || voting) return

    setVoting(true)
    setError(null)

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId, leftId: left.id, rightId: right.id }),
      })

      if (!res.ok) {
        const t = await res.text().catch(() => '')
        throw new Error(t || `Vote failed (${res.status})`)
      }

      router.refresh()
      await loadMatchup()
    } catch (e: any) {
      setError(e?.message || 'Vote failed')
    } finally {
      setVoting(false)
    }
  }

  async function pickPresident(id: string) {
    if (presVoteDone || presVotePending) return
    setSelectedPresidentId(id)
    setPresVotePending(true)

    try {
      await fetch('/api/president-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: id }),
      }).catch(() => null)

      try {
        localStorage.setItem(LS_PRES_KEY, '1')
      } catch {}

      setPresVoteDone(true)
      onPresidentVoted?.()
    } finally {
      setPresVotePending(false)
    }
  }

  if (!hydrated) return null

  if (!presVoteDone) {
    return (
      <div className="w-full">
        <Presidentables
          presidentables={presidentables}
          onPick={pickPresident}
          pending={presVotePending}
          selectedId={selectedPresidentId}
        />
      </div>
    )
  }

  if (loading) return <div className="text-neutral-600">Loading matchup...</div>
  if (error) return <div className="text-red-600 break-words">{error}</div>
  if (!left || !right) return null

  return (
    <div className="relative" id="creator-battles">
      <div className="lg:hidden space-y-3">
        <CreatorCard c={left} voting={voting} onVote={() => voteCreator(left.id)} />

        <div className="flex justify-center">
          <div className="rounded-full border border-white/10 bg-white/10 px-6 py-2">
            <div className="text-white font-extrabold tracking-[0.45em] text-sm">VS</div>
          </div>
        </div>

        <CreatorCard c={right} voting={voting} onVote={() => voteCreator(right.id)} />
      </div>

      <div className="hidden lg:block">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <CreatorCard c={left} voting={voting} onVote={() => voteCreator(left.id)} />
          <CreatorCard c={right} voting={voting} onVote={() => voteCreator(right.id)} />
        </div>

        <div className="pointer-events-none absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 hidden lg:flex">
          <div className="rounded-full border border-black/10 bg-white px-7 py-3.5 shadow-md">
            <div className="text-black font-extrabold tracking-[0.45em] text-lg">VS</div>
          </div>
        </div>
      </div>
    </div>
  )
}
