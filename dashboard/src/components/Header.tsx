export default function Header() {
  return (
    <header className="header">
      <div className="header-title">
        <span className="header-dot" />
        Synthesis Quality Auditor
      </div>
      <div className="header-sep" />
      <p className="header-thesis">
        An AI summary that hallucinates a claim or flatters the product is worse than no summary — confident and wrong.
        This audits AI research synthesis for groundedness and sycophantic drift.
      </p>
    </header>
  )
}
