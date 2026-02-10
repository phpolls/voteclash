'use client'

import { useRouter } from 'next/navigation'

type Creator = {
  id: string
  name: string
  quote?: string | null
  total_votes: number
  imgUrl: string
}

export default function VoteClient({ left, right }: { left: Creator; right: Creator }) {
  const router = useRouter()

  async function vote(winnerId: string) {
    await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        winnerId,
        leftId: left.id,
        rightId: right.id,
      }),
    })

    router.refresh()
  }

  const cardStyle: React.CSSProperties = {
    width: 320,
    borderRadius: 18,
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.12)',
    background: '#111',
    cursor: 'pointer',
    padding: 0,
    textAlign: 'left',
  }

  const imgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  }

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0) 75%)',
  }

  return (
    <main style={{ minHeight: '100vh', padding: 32, background: '#0b0b0b', color: 'white' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 24 }}>Vote</h1>

      <div style={{ display: 'flex', gap: 24, justifyContent: 'center', alignItems: 'center' }}>
        {/* LEFT */}
        <button onClick={() => vote(left.id)} style={cardStyle}>
          <div style={{ position: 'relative', width: '100%', height: 420 }}>
            <img src={left.imgUrl} alt={left.name} style={imgStyle} />
            <div style={overlayStyle} />

            <div style={{ position: 'absolute', left: 16, right: 16, bottom: 16 }}>
              <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 6 }}>
                {left.quote ? `"${left.quote}"` : ''}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 0.5 }}>{left.name}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Votes: {left.total_votes}</div>
            </div>
          </div>
        </button>

        <div style={{ fontSize: 26, fontWeight: 800, opacity: 0.8 }}>VS</div>

        {/* RIGHT */}
        <button onClick={() => vote(right.id)} style={cardStyle}>
          <div style={{ position: 'relative', width: '100%', height: 420 }}>
            <img src={right.imgUrl} alt={right.name} style={imgStyle} />
            <div style={overlayStyle} />

            <div style={{ position: 'absolute', left: 16, right: 16, bottom: 16 }}>
              <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 6 }}>
                {right.quote ? `"${right.quote}"` : ''}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 0.5 }}>
                {right.name}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Votes: {right.total_votes}</div>
            </div>
          </div>
        </button>
      </div>
    </main>
  )
}
