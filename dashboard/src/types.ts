export type Classification = 'GROUNDED' | 'WEAK' | 'UNGROUNDED'
export type Severity = 'low' | 'medium' | 'high'
export type Sentiment = 'positive' | 'mostly-positive' | 'mixed' | 'mostly-negative' | 'negative'

export interface ClaimVerdict {
  claim: string
  source: 'summary_sentence' | 'highlight_claim' | 'highlight_quote' | 'tag'
  classification: Classification
  evidence: string
}

export interface GroundednessResult {
  claim_verdicts: ClaimVerdict[]
  grounded_count: number
  weak_count: number
  ungrounded_count: number
}

export interface DriftFlag {
  synthesis_phrasing: string
  transcript_reality: string
  severity: Severity
}

export interface SycophancyResult {
  flags: DriftFlag[]
  overall_assessment: string
  drift_score: number
}

export interface Highlight {
  claim: string
  quote: string
}

export interface Synthesis {
  id: string
  product: string
  summary: string
  highlights: Highlight[]
  tags: string[]
  sentiment: string
}

export interface Turn {
  speaker: 'researcher' | 'customer'
  text: string
}

export interface TranscriptFile {
  id: string
  product: string
  seed_type: string
  transcript: Turn[]
}

export interface TranscriptRecord {
  id: string
  seed_type: string
  product: string
  synthesis: Synthesis
  audit: {
    groundedness: GroundednessResult
    sycophancy: SycophancyResult
  }
}

export interface FlagsBy {
  low: number
  medium: number
  high: number
}

export interface Stats {
  total_transcripts: number
  total_claims_evaluated: number
  grounded: number
  weak: number
  ungrounded: number
  grounded_pct: number
  weak_pct: number
  ungrounded_pct: number
  total_sycophancy_flags: number
  flags_by_severity: FlagsBy
  worst_by_ungrounded_claims: string[]
  worst_by_drift_score: string[]
}

export interface Results {
  stats: Stats
  transcripts: TranscriptRecord[]
}
