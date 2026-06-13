import type { Stats } from '../types'

interface Props { stats: Stats }

function Card({ label, value, sub, valueClass, children }: {
  label: string
  value: React.ReactNode
  sub?: string
  valueClass?: string
  children?: React.ReactNode
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-label">{label}</div>
      <div className={`stat-card-value ${valueClass ?? ''}`}>{value}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
      {children}
    </div>
  )
}

export default function StatCards({ stats }: Props) {
  const { flags_by_severity: sev } = stats

  return (
    <div className="stat-cards">
      <Card
        label="Grounded Claims"
        value={`${stats.grounded_pct}%`}
        valueClass="green"
        sub={`${stats.grounded} of ${stats.total_claims_evaluated} claims directly supported by transcript`}
      />
      <Card
        label="Ungrounded + Weak"
        value={stats.ungrounded + stats.weak}
        valueClass={stats.ungrounded > 0 ? 'red' : ''}
        sub={`${stats.ungrounded} ungrounded · ${stats.weak} weak · across ${stats.total_transcripts} transcripts`}
      />
      <Card
        label="Sycophancy Flags"
        value={stats.total_sycophancy_flags}
        sub="Drift instances where synthesis overstates positivity"
      >
        <div className="severity-chips">
          <span className="chip high">high {sev.high}</span>
          <span className="chip medium">medium {sev.medium}</span>
          <span className="chip low">low {sev.low}</span>
        </div>
      </Card>
    </div>
  )
}
