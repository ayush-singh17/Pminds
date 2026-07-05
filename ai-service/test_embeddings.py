import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_generate_embedding():
    response = client.post("/embeddings/generate", json={
        "id": "1",
        "title": "Stoicism",
        "content": "We should focus only on what we can control",
        "tags": []
    })
    assert response.status_code == 200
    assert "embedding" in response.json()
    assert len(response.json()["embedding"]) == 384

def test_similar_notes_filters_correctly():
    response = client.post("/embeddings/similar", json={
        "target": {
            "id": "1",
            "title": "Stoicism",
            "content": "Focus on what you can control",
            "tags": []
        },
        "candidates": [
            {
                "id": "2",
                "title": "Marcus Aurelius",
                "content": "Accept what you cannot change",
                "tags": []
            },
            {
                "id": "3",
                "title": "Pasta recipe",
                "content": "Boil water and add salt",
                "tags": []
            }
        ],
        "threshold": 0.3
    })
    assert response.status_code == 200
    similar = response.json()["similar"]
    ids = [s["id"] for s in similar]
    assert "2" in ids
    assert "3" not in ids

def test_cosine_similarity_range():
    response = client.post("/embeddings/similar", json={
        "target": {"id": "1", "title": "Test", "content": "Hello world", "tags": []},
        "candidates": [
            {"id": "2", "title": "Test", "content": "Hello world", "tags": []}
        ],
        "threshold": 0.0
    })
    score = response.json()["similar"][0]["score"]
    assert 0.0 <= score <= 1.0
