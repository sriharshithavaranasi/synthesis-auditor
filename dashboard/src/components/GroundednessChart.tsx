import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Cell, Legend,
} from 'recharts'
import type { TranscriptRecord } from '../types'

interface Props {
  transcripts: TranscriptRecord[]
  selectedId: string
  onSelect: (id: string) => void
}

const G_COLOR = '#34d399'
const W_COLOR = '#fbbf24'
const U_COLOR = '#f87171'

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const get = (key: string) => payload.find((p: any) => p.dataKey === key)?.value ?? 0
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-id">{label}</div>
      <div className="chart-tooltip-row"><span style={{ color: G_COLOR }}>Grounded</span><span>{get('grounded')}</span></div>
      <div className="chart-tooltip-row"><span style={{ color: W_COLOR }}>Weak</span><span>{get('weak')}</span></div>
      <div className="chart-tooltip-row"><span style={{ color: U_COLOR }}>Ungrounded</span><span>{get('ungrounded')}</span></div>
    </div>
  )
}

function CustomLegend() {
  return (
    <div style={{ display: 'flex', gap: 20, justifyContent: 'flex-end', paddingRight: 16, paddingBottom: 4, fontSize: 11 }}>
      {([['Grounded', G_COLOR], ['Weak', W_COLOR], ['Ungrounded', U_COLOR]] as [string, string][]).map(([label, color]) => (
        <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-2)' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }} />
          {label}
        </span>
      ))}
    </div>
  )
}

export default function GroundednessChart({ transcripts, selectedId, onSelect }: Props) {
  const data = transcripts.map(t => ({
    id: t.id,
    grounded: t.audit.groundedness.grounded_count,
    weak: t.audit.groundedness.weak_count,
    ungrounded: t.audit.groundedness.ungrounded_count,
  }))

  const handleClick = (entry: any) => {
    if (entry?.id) onSelect(entry.id)
  }

  return (
    <div className="section">
      <div className="section-header">
        <span className="section-title">Groundedness by Transcript</span>
        <span className="section-meta">Click a bar to inspect · stacked claim counts</span>
      </div>
      <div className="chart-wrap">
        <CustomLegend />
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} barCategoryGap="28%" onClick={(state) => state?.activePayload && handleClick(state.activePayload[0]?.payload)}>
            <XAxis
              dataKey="id"
              tick={{ fontSize: 11, fill: 'var(--text-2)', fontFamily: 'var(--font)' }}
              axisLine={{ stroke: 'var(--border-mid)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--text-2)', fontFamily: 'var(--font)' }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            {(['grounded', 'weak', 'ungrounded'] as const).map((key, ki) => {
              const color = [G_COLOR, W_COLOR, U_COLOR][ki]
              return (
                <Bar key={key} dataKey={key} stackId="a" fill={color} radius={ki === 2 ? [3, 3, 0, 0] : [0, 0, 0, 0]}>
                  {data.map(entry => (
                    <Cell
                      key={entry.id}
                      opacity={entry.id === selectedId ? 1 : 0.45}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </Bar>
              )
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
