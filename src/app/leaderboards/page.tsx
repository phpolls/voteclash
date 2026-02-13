export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
import LeaderboardsClient from './LeaderboardsClient'
import { db } from '@/lib/db'

type SidebarRow = { id: string; name: string; imgUrl?: string | null; votes: number }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const BUCKET = 'cards'

function toPublicUrl(path?: string | null) {
  const p = (path ?? '').trim()
  if (!p) return ''
  if (p.startsWith('http')) return p
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${p}`
}

export default async function LeaderboardsPage() {
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

  return <LeaderboardsClient creatorsTop={creatorsTop} presidentiablesTop={presidentiablesTop} />
}
