import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import type { TranscriptRecord } from '../types'

interface Props {
  transcripts: TranscriptRecord[]
  selectedId: string
  onSelect: (id: string) => void
}

const G_COLOR = '#34d399'
const W_COLOR = '#fbbf24'
const U_COLOR = '#f87171'

function driftColor(score: number) {
  if (score >= 7) return U_COLOR
  if (score >= 4) return W_COLOR
  return G_COLOR
}

function failureColor(weak: number, ungrounded: number) {
  if (ungrounded > 0) return U_COLOR
  if (weak > 0) return W_COLOR
  return 'transparent'
}

const axisProps = {
  tick: { fontSize: 11, fill: 'var(--text-2)', fontFamily: 'Inter, sans-serif' } as const,
  axisLine: { stroke: 'rgba(255,255,255,0.08)' } as const,
  tickLine: false as const,
}

function FailureTooltip({ active, payload, label, transcripts }: any) {
  if (!active || !payload?.length) return null
  const t = transcripts.find((x: TranscriptRecord) => x.id === label)
  if (!t) return null
  const g = t.audit.groundedness.grounded_count
  const w = t.audit.groundedness.weak_count
  const u = t.audit.groundedness.ungrounded_count
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-id">{label}</div>
      <div className="chart-tooltip-row"><span style={{ color: G_COLOR }}>Grounded</span><span>{g}</span></div>
      {w > 0 && <div className="chart-tooltip-row"><span style={{ color: W_COLOR }}>Weak</span><span>{w}</span></div>}
      {u > 0 && <div className="chart-tooltip-row"><span style={{ color: U_COLOR }}>Ungrounded</span><span>{u}</span></div>}
      {w + u === 0 && <div className="chart-tooltip-row" style={{ color: G_COLOR }}>Fully grounded</div>}
    </div>
  )
}

function DriftTooltip({ active, payload, label, transcripts }: any) {
  if (!active || !payload?.length) return null
  const t = transcripts.find((x: TranscriptRecord) => x.id === label)
  if (!t) return null
  const score = t.audit.sycophancy.drift_score
  const flags = t.audit.sycophancy.flags?.length ?? 0
  const sentiment = t.synthesis.sentiment
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-id">{label}</div>
      <div className="chart-tooltip-row"><span>Drift score</span><span style={{ color: driftColor(score), fontWeight: 600 }}>{score}/10</span></div>
      <div className="chart-tooltip-row"><span>Flags</span><span>{flags}</span></div>
      <div className="chart-tooltip-row"><span>Labeled</span><span>{sentiment}</span></div>
    </div>
  )
}

export default function GroundednessChart({ transcripts, selectedId, onSelect }: Props) {
  const failureData = transcripts.map(t => ({
    id: t.id,
    weak: t.audit.groundedness.weak_count,
    ungrounded: t.audit.groundedness.ungrounded_count,
    failures: t.audit.groundedness.weak_count + t.audit.groundedness.ungrounded_count,
    grounded: t.audit.groundedness.grounded_count,
  }))

  const driftData = transcripts.map(t => ({
    id: t.id,
    score: t.audit.sycophancy.drift_score,
    flags: t.audit.sycophancy.flags?.length ?? 0,
  }))

  const handleClick = (state: any) => {
    const id = state?.activePayload?.[0]?.payload?.id
    if (id) onSelect(id)
  }

  return (
    <div className="section">
      <div className="section-header">
        <span className="section-title">Audit overview</span>
        <span className="section-meta">Click any bar to load that transcript in the inspector below</span>
      </div>

      <div className="chart-panels">
        {/* Left: groundedness failures */}
        <div className="chart-panel">
          <div className="chart-panel-header">
            <span className="chart-panel-title">Groundedness failures</span>
            <span className="chart-panel-meta">weak + ungrounded claims · red = fabricated</span>
          </div>
          <div className="chart-wrap-inner">
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={failureData} barCategoryGap="34%" onClick={handleClick}>
                <XAxis dataKey="id" {...axisProps} />
                <YAxis
                  {...axisProps}
                  axisLine={false}
                  allowDecimals={false}
                  domain={[0, 3]}
                  ticks={[0, 1, 2, 3]}
                  width={20}
                />
                <Tooltip
                  content={<FailureTooltip transcripts={transcripts} />}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="failures" radius={[3, 3, 0, 0]}>
                  {failureData.map(entry => (
                    <Cell
                      key={entry.id}
                      fill={failureColor(entry.weak, entry.ungrounded)}
                      opacity={entry.id === selectedId ? 1 : 0.5}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend">
            <span><span className="chart-legend-dot" style={{ background: W_COLOR }} />Weak (over-generalised)</span>
            <span><span className="chart-legend-dot" style={{ background: U_COLOR }} />Ungrounded (fabricated)</span>
            <span><span className="chart-legend-dot" style={{ background: 'var(--border-strong)' }} />Zero failures</span>
          </div>
        </div>

        <div className="chart-panel-divider" />

        {/* Right: sycophancy drift score */}
        <div className="chart-panel">
          <div className="chart-panel-header">
            <span className="chart-panel-title">Sycophancy drift score</span>
            <span className="chart-panel-meta">0 = faithful to transcript · 10 = distorted</span>
          </div>
          <div className="chart-wrap-inner">
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={driftData} barCategoryGap="34%" onClick={handleClick}>
                <XAxis dataKey="id" {...axisProps} />
                <YAxis
                  {...axisProps}
                  axisLine={false}
                  domain={[0, 10]}
                  ticks={[0, 2, 4, 6, 8, 10]}
                  width={20}
                />
                <Tooltip
                  content={<DriftTooltip transcripts={transcripts} />}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="score" radius={[3, 3, 0, 0]}>
                  {driftData.map(entry => (
                    <Cell
                      key={entry.id}
                      fill={driftColor(entry.score)}
                      opacity={entry.id === selectedId ? 1 : 0.5}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend">
            <span><span className="chart-legend-dot" style={{ background: G_COLOR }} />0–3 faithful</span>
            <span><span className="chart-legend-dot" style={{ background: W_COLOR }} />4–6 drifting</span>
            <span><span className="chart-legend-dot" style={{ background: U_COLOR }} />7–10 distorted</span>
          </div>
        </div>
      </div>
    </div>
  )
}
