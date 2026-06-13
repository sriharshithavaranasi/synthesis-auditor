"""Shared Groq LLM client. Import call_llm() from here — never instantiate OpenAI elsewhere."""

import time
import os
from openai import OpenAI, RateLimitError
from dotenv import load_dotenv

load_dotenv()

_MODEL = "llama-3.3-70b-versatile"
_SLEEP_BETWEEN_CALLS = 2.0  # free tier: ~30 req/min
_MAX_RETRIES = 3

_client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.environ["GROQ_API_KEY"],
)


def call_llm(system: str, user: str) -> str:
    """Send a system + user prompt to Groq and return the text response.

    Sleeps 2 s after every call to stay under the free-tier rate limit.
    Retries up to _MAX_RETRIES times on 429 with exponential backoff.
    """
    delay = _SLEEP_BETWEEN_CALLS
    for attempt in range(1, _MAX_RETRIES + 1):
        try:
            response = _client.chat.completions.create(
                model=_MODEL,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
            )
            time.sleep(_SLEEP_BETWEEN_CALLS)
            return response.choices[0].message.content or ""
        except RateLimitError:
            if attempt == _MAX_RETRIES:
                raise
            time.sleep(delay)
            delay *= 2
    return ""  # unreachable, satisfies type checker
