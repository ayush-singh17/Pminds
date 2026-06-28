import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv('GROQ_API_KEY'))

def explain_connection(note1_title: str, note1_content: str, 
                       note2_title: str, note2_content: str) -> str:
    prompt = f"""Two ideas are semantically connected. Explain why in one concise sentence.

Idea 1: {note1_title}
{note1_content[:300]}

Idea 2: {note2_title}
{note2_content[:300]}

One sentence explanation of the connection:"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=100,
        temperature=0.3,
    )
    return response.choices[0].message.content.strip()
