from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.embedding_service import generate_embedding, cosine_similarity

router = APIRouter()

class NoteInput(BaseModel):
    id: str
    title: str
    content: str
    tags: list[str] = []

class SimilarityRequest(BaseModel):
    target: NoteInput
    candidates: list[NoteInput]
    top_k: int = 5
    threshold: float = 0.4

@router.post("/generate")
def generate(note: NoteInput):
    text = f"{note.title}. {note.content}"
    embedding = generate_embedding(text)
    return {"id": note.id, "embedding": embedding}

@router.post("/similar")
def find_similar(request: SimilarityRequest):
    target_text = f"{request.target.title}. {request.target.content}"
    if request.target.tags:
        target_text += f". Tags: {', '.join(request.target.tags)}"
    target_embedding = generate_embedding(target_text)

    results = []
    for candidate in request.candidates:
        if candidate.id == request.target.id:
            continue
        candidate_text = f"{candidate.title}. {candidate.content}"
        if candidate.tags:
            candidate_text += f". Tags: {', '.join(candidate.tags)}"
        candidate_embedding = generate_embedding(candidate_text)
        score = cosine_similarity(target_embedding, candidate_embedding)
        if score >= request.threshold:
            results.append({
                "id": candidate.id,
                "title": candidate.title,
                "score": round(score, 4),
            })

    results.sort(key=lambda x: x["score"], reverse=True)
    return {"similar": results[:request.top_k]}
