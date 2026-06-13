import { useState, useEffect } from 'react'
import type { TranscriptRecord, ClaimVerdict, Classification, DriftFlag } from '../types'

interface Props {
  transcripts: TranscriptRecord[]
  selectedId: string
  selected: TranscriptRecord
  onSelect: (id: string) => void
}

const CLASS_COLOR: Record<Classification, string> = {
  GROUNDED: 'var(--green)',
  WEAK: 'var(--amber)',
  UNGROUNDED: 'var(--red)',
}
const CLASS_BG: Record<Classification, string> = {
  GROUNDED: 'var(--green-dim)',
  WEAK: 'var(--amber-dim)',
  UNGROUNDED: 'var(--red-dim)',
}

function sentimentStyle(s: string): React.CSSProperties {
  if (s === 'positive' || s === 'mostly-positive') return { background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid rgba(52,211,153,0.25)' }
  if (s === 'negative' || s === 'mostly-negative') return { background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.25)' }
  return { background: 'var(--amber-dim)', color: 'var(--amber)', border: '1px solid rgba(251,191,36,0.25)' }
}

function ClaimItem({ verdict, open, onToggle }: { verdict: ClaimVerdict; open: boolean; onToggle: () => void }) {
  const cls = verdict.classification in CLASS_COLOR ? verdict.classification : 'GROUNDED'
  const color = CLASS_COLOR[cls as Classification]
  const bg = CLASS_BG[cls as Classification]
  const sourceLabel = verdict.source.replace(/_/g, ' ')

  return (
    <div className={`claim-item${open ? ' open' : ''}`} onClick={onToggle}>
      <div className="claim-row">
        <span className="claim-dot" style={{ background: color }} />
        <span className="claim-text">{verdict.claim}</span>
        <span className="claim-source">{sourceLabel}</span>
        <span className="claim-chevron">▶</span>
      </div>
      {open && (
        <div className="claim-evidence" style={{ borderLeftColor: color, background: bg }}>
          {verdict.evidence || 'No evidence noted.'}
        </div>
      )}
    </div>
  )
}

function DriftFlagCard({ flag }: { flag: DriftFlag }) {
  const sev = flag.severity?.toLowerCase() ?? 'low'
  return (
    <div className="drift-flag">
      <div className="drift-flag-row drift-synthesis">
        <span className="drift-label">Synthesis</span>
        <span className="drift-text">{flag.synthesis_phrasing}</span>
      </div>
      <div className="drift-flag-row">
        <span className="drift-label">Reality</span>
        <span className="drift-text">{flag.transcript_reality}</span>
      </div>
      <div className="drift-flag-footer">
        <span className={`severity-badge ${sev}`}>{sev}</span>
      </div>
    </div>
  )
}

export default function SynthesisInspector({ transcripts, selectedId, selected, onSelect }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  useEffect(() => { setOpenIdx(null) }, [selectedId])

  const { synthesis, audit } = selected
  const verdicts = audit.groundedness.claim_verdicts ?? []
  const flags = audit.sycophancy.flags ?? []
  const score = audit.sycophancy.drift_score ?? 0

  const summaryVerdicts = verdicts.filter(v => v.source === 'summary_sentence')
  const highlightVerdicts = verdicts.filter(v => v.source === 'highlight_claim' || v.source === 'highlight_quote')
  const tagVerdicts = verdicts.filter(v => v.source === 'tag')

  const g = audit.groundedness.grounded_count
  const w = audit.groundedness.weak_count
  const u = audit.groundedness.ungrounded_count

  const toggle = (i: number) => setOpenIdx(prev => prev === i ? null : i)

  let globalIdx = 0
  function renderSection(items: ClaimVerdict[], label: string) {
    if (!items.length) return null
    const start = globalIdx
    globalIdx += items.length
    return (
      <>
        <div className="inspector-section-label">{label}</div>
        <div className="claim-list">
          {items.map((v, i) => {
            const idx = start + i
            return <ClaimItem key={idx} verdict={v} open={openIdx === idx} onToggle={() => toggle(idx)} />
          })}
        </div>
      </>
    )
  }

  const scoreColor = score >= 7 ? 'var(--red)' : score >= 4 ? 'var(--amber)' : 'var(--green)'

  return (
    <div className="section">
      <div className="section-header">
        <span className="section-title">Synthesis Inspector</span>
        <span className="section-meta">
          {g}G · {w}W · {u}U &nbsp;|&nbsp; {flags.length} drift flags
        </span>
      </div>

      <div className="inspector-controls">
        <select
          className="inspector-select"
          value={selectedId}
          onChange={e => onSelect(e.target.value)}
        >
          {transcripts.map(t => (
            <option key={t.id} value={t.id}>
              {t.id} — {t.seed_type.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <span className="seed-badge">{selected.seed_type.replace(/_/g, ' ')}</span>
        <span className="sentiment-badge" style={sentimentStyle(synthesis.sentiment)}>
          {synthesis.sentiment}
        </span>
      </div>

      <div className="inspector-summary">{synthesis.summary}</div>

      {renderSection(summaryVerdicts, `Summary claims (${summaryVerdicts.length})`)}
      {renderSection(highlightVerdicts, `Highlight claims (${highlightVerdicts.length})`)}

      {tagVerdicts.length > 0 && (
        <>
          <div className="inspector-section-label">Tags ({tagVerdicts.length})</div>
          <div className="tags-row">
            {tagVerdicts.map((v, i) => (
              <span key={i} className={`tag-pill ${v.classification}`} title={v.evidence}>
                {v.claim}
              </span>
            ))}
          </div>
        </>
      )}

      {flags.length > 0 && (
        <>
          <div className="inspector-section-label" style={{ marginTop: 4 }}>
            Sycophancy drift flags ({flags.length})
          </div>
          <div className="drift-flags">
            {flags.map((f, i) => <DriftFlagCard key={i} flag={f} />)}
          </div>

          <div className="drift-score-row">
            <span className="drift-score-label">Drift score</span>
            <div className="drift-score-track">
              <div className="drift-score-fill" style={{ width: `${score * 10}%`, background: scoreColor }} />
            </div>
            <span className="drift-score-val" style={{ color: scoreColor }}>{score}/10</span>
          </div>

          {audit.sycophancy.overall_assessment && (
            <div className="drift-assessment">{audit.sycophancy.overall_assessment}</div>
          )}
        </>
      )}
    </div>
  )
}
