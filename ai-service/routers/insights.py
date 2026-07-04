from fastapi import APIRouter, Request
from pydantic import BaseModel
from groq import Groq
import os
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

router = APIRouter()

class InsightRequest(BaseModel):
    notes: list[dict]

@router.post("/pattern")
@limiter.limit("20/minute")
async def get_pattern(request: Request, req: InsightRequest):
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

@router.post("/cluster-label")
@limiter.limit("20/minute")
async def get_cluster_label(request: Request, req: InsightRequest):
    if not req.notes:
        return {"label": "Ideas"}

    titles = "\n".join([f"- {n['title']}" for n in req.notes[:15]])

    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{
            "role": "user",
            "content": f"""Look at these note titles and give a 1-2 word label for this cluster. Be very concise.
            
Titles:
{titles}

Label only, no preamble:"""
        }],
        max_tokens=10,
        temperature=0.5,
    )

    label = response.choices[0].message.content.strip().replace('"', '')
    return {"label": label}
