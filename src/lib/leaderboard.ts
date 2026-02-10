import { db } from "@/lib/db";

export type LeaderboardRow = {
  id: string;
  name: string;
  photoUrl: string;
  votes: number;
};

export async function getLeaderboard(limit = 10): Promise<LeaderboardRow[]> {
  const { data, error } = await db
    .from("candidates")
    .select("id,name,photo_url,votes")
    .order("votes", { ascending: false })
    .order("name", { ascending: true })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    photoUrl: r.photo_url,
    votes: r.votes ?? 0,
  }));
}
