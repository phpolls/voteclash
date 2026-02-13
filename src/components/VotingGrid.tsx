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

function safeImg(src?: string) {
  if (!src) return 'data:image/gif;base64,R0lGODlhAQABAAAAACw='
  return src
}

function toCreator(row: CreatorRow): Creator | null {
  if (!row.side) return null
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
    side: row.side,
  }
}

/* ================= CREATOR CARD ================= */

function CreatorCard({
  c,
  onVote,
  voting,
  buttonLabel,
  pulse,
  onHoverEnter,
  onHoverLeave,
}: any) {
  return (
    <div className="relative h-[320px] sm:h-[420px] lg:h-[520px] rounded-3xl overflow-hidden bg-black shadow-xl">
      {c.imgUrl && (
        <img src={c.imgUrl} alt={c.name} className="absolute inset-0 w-full h-full object-cover" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

      <div className="absolute bottom-0 p-5 w-full">
        <h2 className="text-white text-xl font-extrabold">{c.name}</h2>

        <button
          disabled={voting}
          onClick={onVote}
          onMouseEnter={onHoverEnter}
          onMouseLeave={onHoverLeave}
          className={[
            'mt-3 w-full py-3 rounded-2xl font-extrabold tracking-wide transition-all duration-200',
            'disabled:opacity-60 disabled:cursor-not-allowed',

            buttonLabel === 'SHALLOW'
              ? 'bg-red-600 text-white border border-red-400 shadow-[0_0_18px_rgba(239,68,68,0.55)] hover:bg-red-500'
              : 'bg-white text-black hover:bg-neutral-200',

            pulse ? 'animate-pulse scale-[1.03]' : '',
          ].join(' ')}
        >
          {voting ? 'FOLLOWING...' : buttonLabel}
        </button>
      </div>
    </div>
  )
}

/* ================= PRESIDENTABLES ================= */

function Presidentables({ presidentables, onPick }: any) {
  const ordered = useMemo(() => {
    const ORDER = [
      'pacquiao-manny',
      'hontiveros-risa',
      'duterte-sara',
      'poe-grace',
      'remulla-jonvic',
      'robredo-leni',
      'romualdez-martin',
      'tulfo-raffy',
    ]

    return presidentables
      .map((p: any) => ({
        ...p,
        ...(PRES_META[p.id] || { age: 0, role: '' }),
      }))
      .sort((a: any, b: any) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id))
  }, [presidentables])

  return (
    <div className="lg:scale-[0.75] lg:origin-top grid grid-cols-2 lg:grid-cols-4 gap-2">
      {ordered.map((p: any) => (
        <button key={p.id} onClick={() => onPick(p.id)} className="relative aspect-[4/5] rounded-3xl overflow-hidden">
          <img src={safeImg(p.imgUrl)} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-0 p-3 text-white">
            <div className="font-semibold">{p.name}, {p.age}</div>
            <div className="text-xs text-white/70">{p.role}</div>
          </div>
        </button>
      ))}
    </div>
  )
}

/* ================= MAIN ================= */

export default function VotingGrid({ presidentables, onPresidentVoted }: any) {
  const router = useRouter()

  const [presVoteDone, setPresVoteDone] = useState(false)
  const [left, setLeft] = useState<any>(null)
  const [right, setRight] = useState<any>(null)
  const [voting, setVoting] = useState(false)

  const [hoveredFollowId, setHoveredFollowId] = useState<string | null>(null)
  const [flashShallowId, setFlashShallowId] = useState<string | null>(null)

  function triggerFlash(id: string) {
    setFlashShallowId(id)
    setTimeout(() => setFlashShallowId(null), 650)
  }

  function buttonState(self: any, other: any) {
    const shallow = flashShallowId === self?.id || hoveredFollowId === other?.id
    return { label: shallow ? 'SHALLOW' : 'FOLLOW', pulse: shallow }
  }

  async function voteCreator(id: string) {
    if (!left || !right) return
    setVoting(true)
    await fetch('/api/vote', {
      method: 'POST',
      body: JSON.stringify({ winnerId: id, leftId: left.id, rightId: right.id }),
    })
    router.refresh()
    setVoting(false)
  }

  if (!presVoteDone) {
    return <Presidentables presidentables={presidentables} onPick={() => setPresVoteDone(true)} />
  }

  if (!left || !right) return null

  const leftBtn = buttonState(left, right)
  const rightBtn = buttonState(right, left)

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <CreatorCard
        c={left}
        voting={voting}
        buttonLabel={leftBtn.label}
        pulse={leftBtn.pulse}
        onHoverEnter={() => setHoveredFollowId(left.id)}
        onHoverLeave={() => setHoveredFollowId(null)}
        onVote={() => { triggerFlash(right.id); voteCreator(left.id) }}
      />
      <CreatorCard
        c={right}
        voting={voting}
        buttonLabel={rightBtn.label}
        pulse={rightBtn.pulse}
        onHoverEnter={() => setHoveredFollowId(right.id)}
        onHoverLeave={() => setHoveredFollowId(null)}
        onVote={() => { triggerFlash(left.id); voteCreator(right.id) }}
      />
    </div>
  )
}
