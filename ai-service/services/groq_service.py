import os
from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()

client = AsyncGroq(api_key=os.getenv('GROQ_API_KEY'))

async def get_connection_reason(
    title1: str, content1: str,
    title2: str, content2: str
) -> str:
    prompt = f"""You are a philosopher and intellectual analyst. 

Two ideas are semantically connected. Find the DEEP conceptual link between them — not surface words they share, but the underlying intellectual thread that connects them.

Idea 1: "{title1}"
{content1[:200]}

Idea 2: "{title2}"
{content2[:200]}

Write ONE sentence (max 20 words) explaining the philosophical or conceptual connection. 
Do NOT mention shared words. Focus on the underlying idea.
Be specific and insightful, not generic.

Example of BAD reason: "Both notes mention power and control"
Example of GOOD reason: "Both explore how external constraints paradoxically create internal freedom"

One sentence only:"""

    response = await client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=60,
        temperature=0.4,
    )
    return response.choices[0].message.content.strip()
