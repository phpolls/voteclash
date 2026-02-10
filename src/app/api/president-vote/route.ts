import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const candidateId = String(body?.candidateId ?? '').trim()
    if (!candidateId) return new NextResponse('Missing candidateId', { status: 400 })

    const { error } = await db.rpc('increment_presidentiables_vote', { candidate_id: candidateId })
    if (error) return new NextResponse(error.message, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return new NextResponse(e?.message || 'President vote failed', { status: 500 })
  }
}
