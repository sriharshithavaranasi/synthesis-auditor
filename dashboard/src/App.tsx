import { useState, useEffect } from 'react'
import type { Results, TranscriptRecord } from './types'
import Header from './components/Header'
import StatCards from './components/StatCards'
import GroundednessChart from './components/GroundednessChart'
import SynthesisInspector from './components/SynthesisInspector'
import TranscriptViewer from './components/TranscriptViewer'

export default function App() {
  const [data, setData] = useState<Results | null>(null)
  const [selectedId, setSelectedId] = useState('t001') // best sycophancy story: customer says "wouldn't recommend" → labeled "mixed"

  useEffect(() => {
    fetch('/results.json').then(r => r.json()).then(setData)
  }, [])

  if (!data) {
    return <div className="loading-screen">Loading audit results…</div>
  }

  const selected = data.transcripts.find((t: TranscriptRecord) => t.id === selectedId)!

  return (
    <div className="app">
      <Header />
      <main className="main">
        <StatCards stats={data.stats} />
        <GroundednessChart
          transcripts={data.transcripts}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        <div className="inspector-layout">
          <SynthesisInspector
            transcripts={data.transcripts}
            selectedId={selectedId}
            selected={selected}
            onSelect={setSelectedId}
          />
          <TranscriptViewer transcriptId={selectedId} />
        </div>
      </main>
    </div>
  )
}
