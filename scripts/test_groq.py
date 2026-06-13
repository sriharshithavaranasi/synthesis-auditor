"""Quick sanity check — run this to confirm your GROQ_API_KEY works."""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.llm import call_llm

if __name__ == "__main__":
    reply = call_llm(
        system="You are a helpful assistant. Reply concisely.",
        user="Say 'Groq is working!' and nothing else.",
    )
    print(reply)
