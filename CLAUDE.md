# Synthesis Quality Auditor

Demo project for a Great Question AI engineering internship interview. Audits AI-generated synthesis (summaries, highlights, tags) from customer research interviews for two failure modes:

1. **Groundedness** — claims in the synthesis not supported by the transcript
2. **Sycophantic drift** — synthesis that makes feedback sound more positive, decisive, or product-flattering than the transcript warrants

## Tech stack

- Python 3.11+, type hints throughout
- **LLM provider: Groq** (free tier) via `openai` package pointed at Groq's API
  - Model: `llama-3.3-70b-versatile` for all calls
  - Client lives exclusively in `src/llm.py` — never instantiate elsewhere
- All LLM prompts as `.txt` files in `prompts/` — never inline in Python
- pytest for non-LLM logic only

## Project structure

```
synthesis-auditor/
├── CLAUDE.md
├── .env.example          # GROQ_API_KEY= (never commit .env)
├── requirements.txt
├── src/
│   ├── __init__.py
│   ├── llm.py            # shared Groq client + call_llm() helper
│   ├── groundedness.py   # groundedness audit logic (TBD)
│   └── sycophancy.py     # sycophantic drift audit logic (TBD)
├── prompts/
│   ├── groundedness_check.txt
│   └── sycophancy_check.txt
├── data/                 # input transcripts (.txt or .json)
├── results/              # output audit reports (.json)
├── dashboard/            # frontend (TBD)
└── tests/
    ├── __init__.py
    └── test_utils.py     # pytest tests for pure/non-LLM logic
```

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env
# add your GROQ_API_KEY to .env
```

## Running

```bash
# Verify your Groq key works
python scripts/test_groq.py

# Run tests (non-LLM logic only)
pytest tests/
```

## Conventions

- **Provider isolation**: `src/llm.py` is the single source of truth for model name, base URL, and API key. If we ever swap providers, change it there only.
- **Prompt files**: Every system/user prompt template lives in `prompts/*.txt`. Load them at call time; never hardcode prompt text in Python.
- **Rate limits**: Free tier is ~30 req/min. `call_llm()` sleeps 2 seconds after every call. On 429, it retries up to 3 times with exponential backoff.
- **Output**: Audit results write to `results/` as JSON with a timestamp in the filename.
- **No inline LLM calls in tests**: Mock `call_llm` or test only pure logic.
