import { db } from "@/lib/db";

export async function POST(req: Request) {
  const { candidateId } = await req.json();

  const { error } = await db
    .from("candidates")
    .update({ votes: db.rpc ? undefined : undefined }) // placeholder

  const { error: err } = await db.rpc("increment_vote", {
    row_id: candidateId,
  });

  if (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
