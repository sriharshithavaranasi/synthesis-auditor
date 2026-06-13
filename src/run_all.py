"""Generate synthesis + run audit for every transcript; write results/results.json.

Usage:
    python src/run_all.py
"""

import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.synthesize import synthesize, save_synthesis
from src.audit import audit

TRANSCRIPTS_DIR = Path("data/transcripts")
RESULTS_DIR = Path("results")
RESULTS_FILE = RESULTS_DIR / "results.json"

# Extra pause between transcripts on top of per-call sleeps in llm.py
INTER_TRANSCRIPT_SLEEP = 2


def _severity_counts(flags: list[dict]) -> dict[str, int]:
    counts: dict[str, int] = {"low": 0, "medium": 0, "high": 0}
    for f in flags:
        sev = str(f.get("severity", "")).lower()
        if sev in counts:
            counts[sev] += 1
    return counts


def _compute_stats(records: list[dict]) -> dict:
    total_g = total_w = total_u = 0
    total_flags = 0
    severity_totals = {"low": 0, "medium": 0, "high": 0}
    drift_scores: list[tuple[str, int]] = []
    ungrounded_per: list[tuple[str, int]] = []

    for r in records:
        g = r["audit"]["groundedness"]
        s = r["audit"]["sycophancy"]

        gc = int(g.get("grounded_count", 0) or 0)
        wc = int(g.get("weak_count", 0) or 0)
        uc = int(g.get("ungrounded_count", 0) or 0)
        total_g += gc
        total_w += wc
        total_u += uc

        flags = s.get("flags", [])
        counts = _severity_counts(flags)
        total_flags += len(flags)
        for k in severity_totals:
            severity_totals[k] += counts[k]

        drift_scores.append((r["id"], int(s.get("drift_score", 0) or 0)))
        ungrounded_per.append((r["id"], uc))

    total_claims = total_g + total_w + total_u
    pct = lambda n: round(100 * n / total_claims, 1) if total_claims else 0.0

    worst_ungrounded = sorted(ungrounded_per, key=lambda x: x[1], reverse=True)[:3]
    worst_drift = sorted(drift_scores, key=lambda x: x[1], reverse=True)[:3]

    return {
        "total_transcripts": len(records),
        "total_claims_evaluated": total_claims,
        "grounded": total_g,
        "weak": total_w,
        "ungrounded": total_u,
        "grounded_pct": pct(total_g),
        "weak_pct": pct(total_w),
        "ungrounded_pct": pct(total_u),
        "total_sycophancy_flags": total_flags,
        "flags_by_severity": severity_totals,
        "worst_by_ungrounded_claims": [t[0] for t in worst_ungrounded],
        "worst_by_drift_score": [t[0] for t in worst_drift],
    }


def _print_summary(records: list[dict], stats: dict) -> None:
    col = {
        "id": 6, "seed": 24, "G": 4, "W": 4, "U": 4,
        "flags": 5, "drift": 5, "sentiment": 16,
    }
    header = (
        f"{'ID':<{col['id']}}  {'Seed type':<{col['seed']}}  "
        f"{'G':>{col['G']}}  {'W':>{col['W']}}  {'U':>{col['U']}}  "
        f"{'Flags':>{col['flags']}}  {'Drift':>{col['drift']}}  "
        f"{'Sentiment':<{col['sentiment']}}"
    )
    divider = "-" * len(header)
    print("\n" + divider)
    print(header)
    print(divider)

    for r in records:
        g = r["audit"]["groundedness"]
        s = r["audit"]["sycophancy"]
        print(
            f"{r['id']:<{col['id']}}  {r['seed_type']:<{col['seed']}}  "
            f"{int(g.get('grounded_count', 0) or 0):>{col['G']}}  "
            f"{int(g.get('weak_count', 0) or 0):>{col['W']}}  "
            f"{int(g.get('ungrounded_count', 0) or 0):>{col['U']}}  "
            f"{len(s.get('flags', [])):>{col['flags']}}  "
            f"{int(s.get('drift_score', 0) or 0):>{col['drift']}}  "
            f"{r['synthesis'].get('sentiment', 'unknown'):<{col['sentiment']}}"
        )

    print(divider)
    print(
        f"\nClaims: {stats['total_claims_evaluated']} total — "
        f"{stats['grounded']} grounded ({stats['grounded_pct']}%)  "
        f"{stats['weak']} weak ({stats['weak_pct']}%)  "
        f"{stats['ungrounded']} ungrounded ({stats['ungrounded_pct']}%)"
    )
    sev = stats["flags_by_severity"]
    print(
        f"Sycophancy flags: {stats['total_sycophancy_flags']} total — "
        f"high={sev['high']}  medium={sev['medium']}  low={sev['low']}"
    )
    print(f"Worst groundedness: {', '.join(stats['worst_by_ungrounded_claims'])}")
    print(f"Worst drift:        {', '.join(stats['worst_by_drift_score'])}")


def main() -> None:
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    transcript_files = sorted(TRANSCRIPTS_DIR.glob("*.json"))
    if not transcript_files:
        print("No transcripts found in data/transcripts/")
        sys.exit(1)

    print(f"Found {len(transcript_files)} transcripts. Starting pipeline...\n")

    records: list[dict] = []

    for i, path in enumerate(transcript_files):
        tid = path.stem
        print(f"[{i+1}/{len(transcript_files)}] {tid}", flush=True)

        try:
            print(f"  synthesizing...", flush=True)
            synthesis = synthesize(tid)
            save_synthesis(synthesis)

            print(f"  auditing (groundedness)...", flush=True)
            audit_report = audit(tid, synthesis)

            records.append({
                "id": tid,
                "seed_type": audit_report["seed_type"],
                "product": audit_report["product"],
                "synthesis": synthesis,
                "audit": {
                    "groundedness": audit_report["groundedness"],
                    "sycophancy": audit_report["sycophancy"],
                },
            })

            g = audit_report["groundedness"]
            s = audit_report["sycophancy"]
            print(
                f"  done — G:{g.get('grounded_count',0)} "
                f"W:{g.get('weak_count',0)} "
                f"U:{g.get('ungrounded_count',0)} | "
                f"flags:{len(s.get('flags',[]))} drift:{s.get('drift_score',0)}"
            )

        except Exception as exc:
            print(f"  ERROR: {exc}")

        if i < len(transcript_files) - 1:
            time.sleep(INTER_TRANSCRIPT_SLEEP)

    stats = _compute_stats(records)

    output = {"stats": stats, "transcripts": records}
    RESULTS_FILE.write_text(
        json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"\nFull results saved to {RESULTS_FILE}")

    _print_summary(records, stats)


if __name__ == "__main__":
    main()
