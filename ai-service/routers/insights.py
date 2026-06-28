from fastapi import APIRouter
from pydantic import BaseModel
from services.groq_service import explain_connection
from groq import Groq
import os

router = APIRouter()

class InsightRequest(BaseModel):
    notes: list[dict]

@router.post("/pattern")
async def get_pattern(req: InsightRequest):
    if not req.notes:
        return {"insight": None}

    titles_and_content = "\n".join([
        f"- {n['title']}: {n['content'][:100]}"
        for n in req.notes[:10]
    ])

    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{
            "role": "user",
            "content": f"""Analyze these notes and give ONE short sentence (max 15 words) about what this person has been thinking about lately. Be specific and insightful, not generic.

Notes:
{titles_and_content}

One sentence only, no preamble:"""
        }],
        max_tokens=50,
        temperature=0.7,
    )

    insight = response.choices[0].message.content.strip()
    return {"insight": insight}
