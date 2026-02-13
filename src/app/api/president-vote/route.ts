import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ marker: 'PRESIDENT-VOTE-MARKER-999' }, { status: 418 })
}
