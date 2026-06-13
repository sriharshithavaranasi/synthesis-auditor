"""Run groundedness and sycophancy judges on a (transcript, synthesis) pair."""

import json
import re
import sys
from pathlib import Path

import json_repair

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.llm import call_llm
from src.synthesize import format_transcript

TRANSCRIPTS_DIR = Path("data/transcripts")
GROUNDEDNESS_PROMPT = Path("prompts/judges/groundedness.txt")
SYCOPHANCY_PROMPT = Path("prompts/judges/sycophancy.txt")


def _extract_json(raw: str) -> dict:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
        raw = re.sub(r"\s*```\s*$", "", raw, flags=re.MULTILINE)
        raw = raw.strip()
    brace = raw.find("{")
    if brace > 0:
        raw = raw[brace:]
    result = json_repair.repair_json(raw, return_objects=True)
    if not isinstance(result, dict):
        raise ValueError(f"Expected JSON object, got {type(result).__name__}: {raw[:200]}")
    return result


def _build_user_prompt(transcript_data: dict, synthesis_subset: dict) -> str:
    dialogue = format_transcript(transcript_data["transcript"])
    synthesis_str = json.dumps(synthesis_subset, indent=2, ensure_ascii=False)
    return f"TRANSCRIPT:\n{dialogue}\n\nSYNTHESIS:\n{synthesis_str}"


def run_groundedness_judge(transcript_data: dict, synthesis: dict) -> dict:
    system_prompt = GROUNDEDNESS_PROMPT.read_text(encoding="utf-8")
    user_prompt = _build_user_prompt(
        transcript_data,
        {
            "summary": synthesis.get("summary", ""),
            "highlights": synthesis.get("highlights", []),
            "tags": synthesis.get("tags", []),
        },
    )
    raw = call_llm(system_prompt, user_prompt)
    return _extract_json(raw)


def run_sycophancy_judge(transcript_data: dict, synthesis: dict) -> dict:
    system_prompt = SYCOPHANCY_PROMPT.read_text(encoding="utf-8")
    user_prompt = _build_user_prompt(
        transcript_data,
        {
            "summary": synthesis.get("summary", ""),
            "highlights": synthesis.get("highlights", []),
            "sentiment": synthesis.get("sentiment", ""),
        },
    )
    raw = call_llm(system_prompt, user_prompt)
    return _extract_json(raw)


def audit(transcript_id: str, synthesis: dict) -> dict:
    """Run both judges and return a combined audit report."""
    transcript_path = TRANSCRIPTS_DIR / f"{transcript_id}.json"
    transcript_data = json.loads(transcript_path.read_text(encoding="utf-8"))

    groundedness = run_groundedness_judge(transcript_data, synthesis)
    sycophancy = run_sycophancy_judge(transcript_data, synthesis)

    # Normalise counts — model may return strings instead of ints
    for key in ("grounded_count", "weak_count", "ungrounded_count"):
        groundedness[key] = int(groundedness.get(key, 0) or 0)

    sycophancy["drift_score"] = int(sycophancy.get("drift_score", 0) or 0)
    sycophancy.setdefault("flags", [])

    return {
        "id": transcript_id,
        "product": transcript_data["product"],
        "seed_type": transcript_data.get("seed_type", ""),
        "groundedness": groundedness,
        "sycophancy": sycophancy,
    }
