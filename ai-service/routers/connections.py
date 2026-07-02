from fastapi import APIRouter
from pydantic import BaseModel
from services.embedding_service import generate_embedding, cosine_similarity
from services.groq_service import explain_connection

router = APIRouter()

class NoteInput(BaseModel):
    id: str
    title: str
    content: str
    tags: list[str] = []

class ConnectionRequest(BaseModel):
    note1: NoteInput
    note2: NoteInput

class BulkConnectionRequest(BaseModel):
    target: NoteInput
    candidates: list[NoteInput]
    threshold: float = 0.5

@router.post("/explain")
def explain(request: ConnectionRequest):
    reason = explain_connection(
        request.note1.title, request.note1.content,
        request.note2.title, request.note2.content,
    )
    vec1 = generate_embedding(f"{request.note1.title}. {request.note1.content}")
    vec2 = generate_embedding(f"{request.note2.title}. {request.note2.content}")
    strength = cosine_similarity(vec1, vec2)

    return {
        "reason": reason,
        "strength": round(strength, 4),
    }

@router.post("/suggest")
def suggest_connections(request: BulkConnectionRequest):
    target_text = f"{request.target.title}. {request.target.content}"
    if request.target.tags:
        target_text += f". Tags: {', '.join(request.target.tags)}"
    target_vec = generate_embedding(target_text)

    suggestions = []
    for candidate in request.candidates:
        if candidate.id == request.target.id:
            continue
        candidate_text = f"{candidate.title}. {candidate.content}"
        if candidate.tags:
            candidate_text += f". Tags: {', '.join(candidate.tags)}"
        candidate_vec = generate_embedding(candidate_text)
        strength = cosine_similarity(target_vec, candidate_vec)

        if strength >= request.threshold:
            suggestions.append({
                "id": candidate.id,
                "title": candidate.title,
                "strength": round(strength, 4),
            })

    suggestions.sort(key=lambda x: x["strength"], reverse=True)
    return {"suggestions": suggestions[:5]}
