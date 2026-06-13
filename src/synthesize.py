"""Synthesize a customer interview transcript into structured JSON insights.

Usage:
    python src/synthesize.py t001
    python src/synthesize.py          # defaults to t001
"""

import json
import re
import sys
from pathlib import Path

import json_repair

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.llm import call_llm

TRANSCRIPTS_DIR = Path("data/transcripts")
SYNTHESIS_DIR = Path("results/synthesis")
PROMPT_FILE = Path("prompts/synthesize.txt")


def format_transcript(turns: list[dict]) -> str:
    """Convert turn list to a readable dialogue string."""
    lines = []
    for turn in turns:
        speaker = "Researcher" if turn["speaker"] == "researcher" else "Customer"
        lines.append(f"{speaker}: {turn['text']}")
    return "\n\n".join(lines)


def extract_json_object(raw: str) -> dict:
    """Parse JSON from LLM output, repairing common model mistakes (unquoted values, trailing commas, etc.)."""
    raw = raw.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
        raw = re.sub(r"\s*```\s*$", "", raw, flags=re.MULTILINE)
        raw = raw.strip()
    # Skip any prose before the opening brace
    brace = raw.find("{")
    if brace > 0:
        raw = raw[brace:]
    result = json_repair.repair_json(raw, return_objects=True)
    if not isinstance(result, dict):
        raise ValueError(f"Expected JSON object, got {type(result).__name__}: {raw[:200]}")
    return result


def synthesize(transcript_id: str) -> dict:
    """Load a transcript, call Groq to synthesize, return structured dict."""
    transcript_path = TRANSCRIPTS_DIR / f"{transcript_id}.json"
    if not transcript_path.exists():
        raise FileNotFoundError(f"No transcript found at {transcript_path}")

    transcript_data = json.loads(transcript_path.read_text(encoding="utf-8"))
    system_prompt = PROMPT_FILE.read_text(encoding="utf-8")

    dialogue = format_transcript(transcript_data["transcript"])
    user_prompt = (
        f"Product: {transcript_data['product']}\n\n"
        f"Transcript:\n{dialogue}"
    )

    raw = call_llm(system_prompt, user_prompt)
    synthesis = extract_json_object(raw)

    result = {
        "id": transcript_id,
        "product": transcript_data["product"],
        **synthesis,
    }
    return result


def save_synthesis(result: dict) -> Path:
    SYNTHESIS_DIR.mkdir(parents=True, exist_ok=True)
    out = SYNTHESIS_DIR / f"{result['id']}.json"
    out.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    return out


def main() -> None:
    transcript_id = sys.argv[1] if len(sys.argv) > 1 else "t001"
    print(f"Synthesizing {transcript_id}...", flush=True)
    result = synthesize(transcript_id)
    out = save_synthesis(result)
    print(f"Saved to {out}\n")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
