from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import embeddings, connections, insights
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="PMinds AI Service", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8000", "http://localhost:8001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(embeddings.router, prefix="/embeddings", tags=["Embeddings"])
app.include_router(connections.router, prefix="/connections", tags=["Connections"])
app.include_router(insights.router, prefix="/insights", tags=["Insights"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "pminds-ai"}
