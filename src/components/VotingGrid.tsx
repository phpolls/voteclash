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
  'jonvic-remulla': { age: 58, role: 'Secretary of the Interior and Local Government' },
}

const DEFAULT_PRESIDENTABLES: PresidentableUI[] = [
  { id: 'duterte-sara', name: 'Sara Duterte', age: 47, role: '', imgUrl: '', total_votes: 0 },
  { id: 'hontiveros-risa', name: 'Risa Hontiveros', age: 59, role: '', imgUrl: '', total_votes: 0 },
  { id: 'pacquiao-manny', name: 'Manny Pacquiao', age: 47, role: '', imgUrl: '', total_votes: 0 },
  { id: 'poe-grace', name: 'Grace Poe', age: 57, role: '', imgUrl: '', total_votes: 0 },
  { id: 'remulla-jonvic', name: 'Jonvic Remulla', age: 58, role: '', imgUrl: '', total_votes: 0 },
  { id: 'robredo-leni', name: 'Leni Robredo', age: 60, role: '', imgUrl: '', total_votes: 0 },
  { id: 'romualdez-martin', name: 'Martin Romualdez', age: 62, role: '', imgUrl: '', total_votes: 0 },
  { id: 'tulfo-raffy', name: 'Raffy Tulfo', age: 65, role: '', imgUrl: '', total_votes: 0 },
]

function safeImg(src?: string) {
  if (!src) return 'data:image/gif;base64,R0lGODlhAQABAAAAACw='
  return src
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
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
        {merged.map((p) => {
          const isSelected = selectedId === p.id
          return (
            <button
              key={p.id}
              onClick={() => onPick(p.id)}
              disabled={pending}
              className={[
                'relative overflow-hidden rounded-3xl border bg-white shadow-sm transition',
                isSelected ? 'border-neutral-900/40 ring-2 ring-neutral-900/20' : 'border-neutral-200',
                'aspect-[4/5]',
              ].join(' ')}
            >
              <img
                src={safeImg(p.imgUrl)}
                alt={p.name}
                className="absolute inset-0 h-full w-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10" />

              <div className="relative flex h-full flex-col justify-end p-3 lg:p-2">
                <div className="text-[13px] sm:text-[16px] lg:text-[12px] font-semibold text-white">
                  {p.name}, {p.age}
                </div>
                <div className="text-[11px] sm:text-sm lg:text-[10px] text-white/70">
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
}: {
  presidentables?: PresidentableDb[]
}) {
  const [hydrated, setHydrated] = useState(false)
  const [presVoteDone, setPresVoteDone] = useState(false)
  const [presVotePending, setPresVotePending] = useState(false)
  const [selectedPresidentId, setSelectedPresidentId] = useState<string | null>(null)

  useEffect(() => setHydrated(true), [])

  useEffect(() => {
    if (!hydrated) return
    try {
      setPresVoteDone(localStorage.getItem(LS_PRES_KEY) === '1')
    } catch {
      setPresVoteDone(false)
    }
  }, [hydrated])

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
    } finally {
      setPresVotePending(false)
    }
  }

  if (!hydrated) return null

  if (!presVoteDone) {
    return (
      <div className="w-full lg:h-[calc(100vh-96px)] lg:overflow-hidden">
        <div className="lg:scale-[0.88] lg:origin-top">
          <Presidentables
            presidentables={presidentables}
            onPick={pickPresident}
            pending={presVotePending}
            selectedId={selectedPresidentId}
          />
        </div>
      </div>
    )
  }

  return null
}
