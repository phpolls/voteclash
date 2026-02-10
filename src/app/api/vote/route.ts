import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const admin = createClient(supabaseUrl, serviceRoleKey)

export async function POST(req: Request) {
  try {
    const { winnerId } = await req.json()

    if (!winnerId) {
      return NextResponse.json({ error: 'winnerId is required' }, { status: 400 })
    }

    // IMPORTANT: pass the argument object (this fixes "without parameters")
    const { data, error } = await admin.rpc('increment_vote', {
      winner_id: winnerId,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, total_votes: data }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
}
