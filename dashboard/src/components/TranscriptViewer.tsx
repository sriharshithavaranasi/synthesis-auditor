import { useState, useEffect } from 'react'
import type { TranscriptFile, Turn } from '../types'

interface Props { transcriptId: string }

export default function TranscriptViewer({ transcriptId }: Props) {
  const [data, setData] = useState<TranscriptFile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/transcripts/${transcriptId}.json`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [transcriptId])

  return (
    <div className="section" style={{ position: 'sticky', top: 76 }}>
      <div className="section-header">
        <span className="section-title">Source Transcript</span>
        {data && <span className="section-meta">{data.transcript.length} turns</span>}
      </div>
      <div className="transcript-inner">
        {loading && <div className="empty">Loading…</div>}
        {!loading && !data && <div className="empty">Transcript not found.</div>}
        {!loading && data && data.transcript.map((turn: Turn, i: number) => (
          <div key={i} className={`turn ${turn.speaker}`}>
            <span className="turn-speaker">
              {turn.speaker === 'researcher' ? 'R' : 'C'}
            </span>
            <span className="turn-text">{turn.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
