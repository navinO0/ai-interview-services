# AI Interview Coach - Backend API

This is the core engine powering the AI Interview Coach. It manages users, interview sessions, AI-driven learning paths, and real-time mock interviews. Now upgraded for **high-throughput production workloads**.

## 🚀 Tech Stack & Rationale

| Technology | Role | Why? |
| :--- | :--- | :--- |
| **Node.js + Express** | Web Framework | Lightweight, non-blocking I/O, and perfect for handling asynchronous AI requests. |
| **PostgreSQL + pgvector** | Database & RAG | Relational data integrity + high-performance vector similarity search for RAG. |
| **PostgreSQL + pgvector** | Database & RAG | Relational data integrity + high-performance vector similarity search for RAG. |
| **BullMQ + Redis** | Global AI Queue | Unified background task management for roadmap generation and AI evaluations. |
| **Redis** | Rate Limiting | Protects AI resources using distributed IP-based limits. |

---

## 🏗️ Architecture & Design Patterns

### 1. Strategy Pattern: Multi-LLM Support
The backend is model-agnostic. Each provider (Ollama, OpenAI, Claude, Gemini) implements an `embed` method for RAG and a `generateStream` method for real-time feedback.

### 2. High-Stability Background Workers
We use a **Global AI Task Queue** (`ai-tasks`) to handle expensive evaluations.
1. **Producer**: The API receives a request and pushes a job to BullMQ.
2. **Consumer**: The `AIWorker` picks up the job, interfacts with providers, and updates the database.
3. **Emitter**: Upon completion, the worker updates the database state for the frontend to poll or refresh.

### 3. Retrieval Augmented Generation (RAG)
Using **pgvector**, we enable the AI to have "long-term memory" by retrieving relevant context from internal documents:
1. Documents are chunked and converted to 1536-dim embeddings.
2. Queries are embedded and compared using **cosine similarity** in SQL.
3. Relevant context is injected into AI prompts for precision.

---

## 🧠 Logical Deep Dives (Interview Prep)

### A. Real-time Feedback
**Aim**: To feel like a real conversation, AI responses shouldn't appear all at once.
**Solution**: We use **Server-Sent Events (SSE)** or blocking REST calls for chunked delivery (depending on the specific module).


---

## 🛠️ Security & Scaling
- **Distributed Rate Limiting**: Uses Redis to track requests across multiple instances.
- **Graceful Shutdown**: All services (DB, Redis) close cleanly on `SIGTERM`.
- **IVFFlat Indexing**: Database-level optimization for fast vector searches.

---

## ⚙️ Environment Variables
Check `.env.example` for the full list. Key additions:
```bash
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=...
ALLOW_DIRECT_AI=true
```
