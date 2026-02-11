'use client'

type Item = {
  id: string
  name: string
  imgUrl?: string | null
  votes: number
}

function safeImg(src?: string | null) {
  if (!src) return 'data:image/gif;base64,R0lGODlhAQABAAAAACw='
  return src
}

function Row({
  rank,
  name,
  imgUrl,
  votes,
}: {
  rank: number
  name: string
  imgUrl?: string | null
  votes: number
}) {
  return (
    <div className="flex items-center gap-2 px-2 py-1 text-[11px]">
      <div className="w-5 text-center font-bold text-neutral-900">{rank}</div>

      <img
        src={safeImg(imgUrl)}
        className="h-6 w-6 rounded-lg object-cover"
        alt=""
      />

      {/* FULL NAME — NO CUT */}
      <div className="flex-1 font-semibold whitespace-nowrap text-neutral-900">
        {name}
      </div>

      {/* votes bold + commas */}
      <div className="text-neutral-700 font-semibold tabular-nums whitespace-nowrap">
        {Number(votes).toLocaleString('en-US')}
      </div>
    </div>
  )
}

export default function LeaderboardSidebar({
  title,
  items,
  limit = 20,
}: {
  title: string
  items: Item[]
  limit?: number
}) {
  const list = (items ?? []).slice(0, limit)

  return (
    <aside className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <div className="text-xs font-extrabold tracking-tight text-neutral-900">
          {title}
        </div>
        <div className="mt-0.5 text-[11px] text-neutral-500">
          Top {limit}
        </div>
      </div>

      <div className="max-h-[calc(100vh-220px)] overflow-auto pr-1">
        {list.length > 0 ? (
          <div className="space-y-2">
            {list.map((x, idx) => (
              <Row
                key={x.id}
                rank={idx + 1}
                name={x.name}
                imgUrl={x.imgUrl ?? null}
                votes={x.votes}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-xs text-neutral-500">
            No votes yet.
          </div>
        )}
      </div>
    </aside>
  )
}
