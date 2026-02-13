export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import { unstable_noStore as noStore } from 'next/cache'
import HomeClient from './HomeClient'
import { db } from '@/lib/db'

type SidebarRow = { id: string; name: string; imgUrl?: string | null; votes: number }
type PresidentableUI = { id: string; name: string; imgUrl: string; total_votes: number }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const BUCKET = 'cards'

function toPublicUrl(path?: string | null) {
  const p = (path ?? '').trim()
  if (!p) return ''
  if (p.startsWith('http')) return p
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${p}`
}

export default async function HomePage() {
  noStore()

  // Creators leaderboard (Top 20)
  let creatorsTop: SidebarRow[] = []
  try {
    const { data, error } = await db
      .from('creators')
      .select('id,name,img_path,total_votes')
      .order('total_votes', { ascending: false })
      .limit(20)

    if (error) throw error

    creatorsTop =
      data?.map((c: any) => ({
        id: String(c.id),
        name: String(c.name ?? ''),
        imgUrl: toPublicUrl(c.img_path),
        votes: Number(c.total_votes ?? 0),
      })) ?? []
  } catch {
    creatorsTop = []
  }

  // Presidentiables list for homepage cards (photos, sorted by name)
  let presidentables: PresidentableUI[] = []
  try {
    const { data, error } = await db
      .from('Presidentiables')
      .select('id,name,imgUrl,total_votes')
      .order('name', { ascending: true })

    if (error) throw error

    presidentables =
      data?.map((p: any) => ({
        id: String(p.id),
        name: String(p.name ?? ''),
        imgUrl: String(p.imgUrl ?? ''),
        total_votes: Number(p.total_votes ?? 0),
      })) ?? []
  } catch {
    presidentables = []
  }

  // Presidentiables leaderboard (Top 20)
  let presidentiablesTop: SidebarRow[] = []
  try {
    const { data, error } = await db
      .from('Presidentiables')
      .select('id,name,imgUrl,total_votes')
      .order('total_votes', { ascending: false })
      .limit(20)

    if (error) throw error

    presidentiablesTop =
      data?.map((p: any) => ({
        id: String(p.id),
        name: String(p.name ?? ''),
        imgUrl: String(p.imgUrl ?? ''),
        votes: Number(p.total_votes ?? 0),
      })) ?? []
  } catch {
    presidentiablesTop = []
  }

  return (
    <HomeClient
      presidentables={presidentables}
      creatorsTop={creatorsTop}
      presidentiablesTop={presidentiablesTop}
    />
  )
}
