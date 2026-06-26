from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import embeddings, connections

app = FastAPI(title="PMinds AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8000", "http://localhost:8001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(embeddings.router, prefix="/embeddings", tags=["Embeddings"])
app.include_router(connections.router, prefix="/connections", tags=["Connections"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "pminds-ai"}
