'use client'

type Creator = {
  id: string
  name: string
  quote?: string | null
  total_votes: number
  imgUrl: string
}

export default function CreatorCard({
  creator,
  onVote,
}: {
  creator: Creator
  onVote: () => void
}) {
  return (
    <div className="
      relative
      w-full
      rounded-2xl
      overflow-hidden
      bg-black
      shadow-xl
      border border-white/10
    ">

      {/* IMAGE */}
      <img
        src={creator.imgUrl}
        alt={creator.name}
        className="w-full h-[420px] object-cover"
      />

      {/* DARK OVERLAY */}
      <div className="
        absolute inset-0
        bg-gradient-to-t from-black/90 via-black/40 to-transparent
        flex flex-col justify-end
        p-6
      ">

        {/* NAME */}
        <h2 className="text-2xl font-bold text-white text-center">
          {creator.name}
        </h2>

        {/* 🔥 BIG CINEMATIC QUOTE */}
        {creator.quote && (
          <p className="
            mt-3
            text-2xl md:text-3xl lg:text-4xl
            font-bold
            italic
            text-white
            text-center
            leading-tight
            tracking-wide
            drop-shadow-lg
          ">
            “{creator.quote}”
          </p>
        )}

        {/* VOTE BUTTON */}
        <button
          onClick={onVote}
          className="
            mt-6
            w-full
            py-3
            rounded-xl
            bg-white
            text-black
            font-bold
            hover:bg-gray-200
            transition
          "
        >
          Vote
        </button>
      </div>
    </div>
  )
}
