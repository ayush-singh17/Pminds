# PMinds — AI-Powered Second Brain

> A semantic knowledge management system that automatically discovers conceptual connections between your ideas, visualizes your thinking as an interactive graph, and surfaces patterns you didn't know existed.

<img width="1512" height="827" alt="Screenshot 2026-07-04 at 9 49 35 PM" src="https://github.com/user-attachments/assets/8541fef3-009d-44e4-9316-22e92dffb580" />



---

## What is PMinds?

PMinds is a personal knowledge tool built on the idea that your best insights come not from individual notes — but from the **connections between them**.

Write a thought about Stoicism today. Write about discipline next week. PMinds automatically finds that these ideas share a 74% conceptual overlap, explains *why* they're connected, and draws the link on your knowledge graph — without you doing anything.

---

## Features

### Core
- **Smart Notes** — Capture thoughts, quotes, articles, questions, and ideas with full markdown support
- **Folder System** — Organize notes into collections, each with its own graph
- **Tags** — Color-coded labels that improve AI connection accuracy
- **Global Search** — Cmd+K command palette with instant fuzzy search across all notes and folders

### AI-Powered
- **Auto Connection Discovery** — When you save a note, the system automatically finds semantically related ideas using cosine similarity on sentence embeddings
- **Connection Explanations** — Groq LLaMA3 generates a one-sentence philosophical explanation for why two ideas are connected
- **Pattern Insight** — "Read my mind" feature analyzes your recent notes and surfaces what your mind has been exploring
- **Cluster Detection** — Notes are automatically grouped into thematic clusters using Union-Find algorithm, labeled by AI

### Knowledge Graph
- **Interactive Mind Map** — React Flow canvas with draggable, zoomable nodes
- **Central Node** — Most connected idea automatically becomes the focal point
- **Edge Thickness** — Connection strength visualized as line weight
- **Timeline Mode** — Watch your thinking evolve chronologically, one note at a time
- **Path Finding** — BFS algorithm finds the conceptual bridge between any two distant ideas
- **Orphan Detection** — Unconnected notes highlighted with dashed borders and listed separately
- **Type Filters** — Show/hide note types on the graph

### UX
- **Dark / Light Mode** — Full theme system with CSS variables, persisted to localStorage
- **Animated Lists** — Scroll-triggered entry animations throughout
- **Glassmorphism UI** — Frosted glass cards and overlays
- **Dot Field Background** — Interactive canvas-based particle background
- **Light Rays** — WebGL shader background on auth pages

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (React 19)                      |
│         Vite · TypeScript · Zustand · React Flow            |
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP (Axios) + Knox Token Auth
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Django REST API (:8001)                    |
│     DRF · Knox Auth · Celery · django-ratelimit · nh3       |
└──────────────┬────────────────────────┬─────────────────────┘
               │                        │
               ▼                        ▼
┌──────────────────────┐    ┌──────────────────────────────────┐
│ PostgreSQL + pgvector│    |       Redis                      |
│  (notes, connections │    | (Celery broker + cache +         |
│   folders, tags)     │    |  rate limiting)                  |
└──────────────────────┘    └──────────────────────────────────┘
               │
               │ HTTP (httpx) — async via Celery
               ▼
┌─────────────────────────────────────────────────────────────┐
│                FastAPI AI Service (:8002)                   │
│    sentence-transformers · Groq API · SlowAPI               │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS v4 |
| State | Zustand (with localStorage persistence) |
| Routing | React Router v6 |
| Graph | React Flow, Framer Motion |
| Backend | Django 4.2, Django REST Framework |
| Auth | Knox (token-based, multi-device) |
| AI Service | FastAPI, Uvicorn |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) — local, free |
| LLM | Groq API (llama3-8b-8192) — free tier |
| Database | PostgreSQL + pgvector extension |
| Queue | Celery + Redis |
| Security | django-ratelimit, SlowAPI, nh3 XSS sanitization |
| Font | Lekton (Google Fonts) |

---

## How the AI Works

### 1. Embedding Generation
When you save a note, a Celery task fires in the background:
```
Note saved → Celery task → FastAPI /connections/suggest
→ sentence-transformers encodes title + content + tags
→ 384-dimensional vector generated locally (no API cost)
```

### 2. Similarity Search
```
Target note embedding vs all other user notes
→ Cosine similarity: dot(a,b) / (||a|| × ||b||)
→ Threshold: 0.55 (tuned to reduce noise)
→ Top 5 matches stored as Connection objects
```

### 3. Connection Explanation
```
Connected note pair → Groq LLaMA3
→ Prompt engineered to find philosophical/conceptual link
→ NOT surface-level word matching
→ One sentence stored in Connection.reason field
```

### 4. Cluster Detection
```
All connections → Union-Find algorithm
→ Groups of mutually connected notes = cluster
→ Cluster sent to Groq for 1-2 word theme label
→ Rendered as colored node groups on graph
```

---

## Database Schema

```
users          — UUID pk, email (username field), avatar, bio
notes          — UUID pk, user→users, title, content, type, source_url
tags           — UUID pk, user→users, name, color  UNIQUE(user, name)
note_tags      — M2M: note↔tag
folders        — UUID pk, user→users, name, icon, color  UNIQUE(user, name)
note_folders   — M2M: note↔folder
connections    — UUID pk, user→users, note_from→notes, note_to→notes,
                 reason, strength(0-1), ai_generated  UNIQUE(user, from, to)
```

---

## Local Setup

### Prerequisites
- Python 3.11+
- Node 20+
- PostgreSQL 15+ with pgvector extension
- Redis

### 1. Clone
```bash
git clone https://github.com/yourname/pminds
cd pminds
```

### 2. Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # fill in your values
python manage.py migrate
python manage.py runserver 0.0.0.0:8001
```

### 3. Celery Worker
```bash
cd backend
celery -A pminds worker --loglevel=info
```

### 4. AI Service
```bash
cd ai-service
pip install -r requirements.txt
cp .env.example .env  # add GROQ_API_KEY
uvicorn main:app --port 8002 --reload
```

### 5. Frontend
```bash
cd frontend
npm install
cp .env.example .env  # set VITE_API_URL and VITE_AI_URL
npm run dev
```

### Environment Variables

**backend/.env**
```env
SECRET_KEY=your-secret-key-min-50-chars
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=pminds
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
REDIS_URL=redis://localhost:6379
CORS_ALLOWED_ORIGINS=http://localhost:5173
AI_SERVICE_URL=http://localhost:8002
```

**ai-service/.env**
```env
GROQ_API_KEY=your-groq-api-key
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8001
```

**frontend/.env**
```env
VITE_API_URL=http://localhost:8001/api
VITE_AI_URL=http://localhost:8002
```

---

## Running Tests

```bash
# Backend
cd backend
python manage.py test

# AI Service
cd ai-service
pytest test_embeddings.py -v
```

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/auth/login/` | Login, returns Knox token |
| POST | `/api/auth/logout/` | Invalidate token |
| GET/POST | `/api/notes/` | List / create notes |
| GET/PATCH/DELETE | `/api/notes/:id/` | Note detail |
| POST | `/api/notes/:id/suggest-connections/` | Trigger AI connection suggestion |
| GET/POST | `/api/connections/` | List / create connections |
| GET | `/api/connections/by-note/:id/` | Connections for a specific note |
| GET/POST | `/api/folders/` | List / create folders |
| GET/POST | `/api/tags/` | List / create tags |

**AI Service**

| Method | Endpoint | Description |
|---|---|---|
| POST | `/embeddings/generate` | Generate embedding for a note |
| POST | `/embeddings/similar` | Find similar notes by cosine similarity |
| POST | `/connections/suggest` | Suggest connections for a note |
| POST | `/connections/explain` | Explain why two notes are connected |
| POST | `/insights/pattern` | Analyze thinking patterns across notes |
| POST | `/insights/cluster-label` | Label a cluster of notes with a theme |

---

## Security

- **Authentication** — Knox token auth with 7-day expiry, max 5 active sessions per user
- **Rate Limiting** — django-ratelimit on auth endpoints (5/min register, 10/min login), SlowAPI on AI endpoints (20/min)
- **Input Sanitization** — nh3 HTML sanitization on all user-generated content, hex color validation on tags
- **SQL Injection** — Django ORM parameterizes all queries by default
- **CORS** — Locked to specific origins via environment variable
- **Data Isolation** — All querysets filtered by `request.user`, no cross-user data leakage

---

## Project Structure

```
pminds/
├── frontend/
│   ├── src/
│   │   ├── api/          # Axios calls per resource
│   │   ├── components/   # Layout, Sidebar, CommandPalette, DotField
│   │   ├── pages/        # Dashboard, Notes, Graph, Folders, Login...
│   │   ├── store/        # Zustand stores (auth, notes, theme)
│   │   ├── utils/        # clusterDetect, pathFind, graphLayout
│   │   └── types/        # TypeScript interfaces
├── backend/
│   ├── accounts/         # Custom User model, Knox auth
│   ├── notes/            # Notes CRUD + AI trigger
│   ├── connections/      # Semantic connections
│   ├── folders/          # Folder management
│   ├── tags/             # Tag system
│   └── pminds/           # Django settings, URLs, Celery
└── ai-service/
    ├── routers/          # FastAPI route handlers
    ├── services/         # embedding_service, groq_service
    └── models/           # Pydantic schemas
```

---

## Design

- **Color Palette** — Deep navy (`#0A0F1E`) · Cyan accent (`#06B6D4`) · Emerald (`#10B981`)
- **Light Mode** — Warm off-white (`#e2e2d6`) with glassmorphism cards
- **Font** — Lekton (monospace-feel, highly readable)
- **Animations** — Framer Motion for page transitions, scroll-triggered entry, hover states
- **Graph** — React Flow with custom ReasonEdge component, click-to-reveal connection explanations

---

## What I Learned

- Designing a multi-service Python architecture where services have distinct responsibilities
- Running ML inference locally with sentence-transformers to eliminate API costs
- Using pgvector for semantic similarity without a dedicated vector database
- Building async background task pipelines with Celery that don't block API responses
- Prompt engineering for conceptual (not literal) connection explanation
- Graph algorithm implementation (Union-Find clustering, BFS path finding) in a real product context

---


