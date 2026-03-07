# AI Interview Coach - Backend API

This is the core engine powering the AI Interview Coach. It manages users, interview sessions, AI-driven learning paths, and real-time mock interviews. Now upgraded for **high-throughput production workloads**.

## 🚀 Tech Stack & Rationale

| Technology | Role | Why? |
| :--- | :--- | :--- |
| **Node.js + Express** | Web Framework | Lightweight, non-blocking I/O, and perfect for handling asynchronous AI requests. |
| **PostgreSQL + pgvector** | Database & RAG | Relational data integrity + high-performance vector similarity search for RAG. |
| **Kafka (Redpanda)** | Event Streaming | Decouples high-volume transcript and audit events from the main request flow. |
| **Socket.io + Redis** | Real-time | Low-latency WebSockets for transcript streaming, scaled via Redis adapter. |
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
3. **Emitter**: Upon completion, the worker emits a WebSocket event to notify the user instantly.

### 3. Retrieval Augmented Generation (RAG)
Using **pgvector**, we enable the AI to have "long-term memory" by retrieving relevant context from internal documents:
1. Documents are chunked and converted to 1536-dim embeddings.
2. Queries are embedded and compared using **cosine similarity** in SQL.
3. Relevant context is injected into AI prompts for precision.

---

## 🧠 Logical Deep Dives (Interview Prep)

### A. Real-time Transcript Streaming
**Aim**: To feel like a real conversation, AI responses shouldn't appear all at once.
**Solution**: We use **WebSockets**. The backend streams chunks from the AI provider and broadcasts `transcript:chunk` events to the user's specific room. The final transcript is then published to **Kafka** for persistent records.

### B. Event-Driven Audit Logs (Kafka)
**Aim**: Reliable logging of millions of transcripts without slowing down the AI generation.
**Solution**: We offload the finalization of transcripts to a Kafka producer. This allows downstream consumers (analytics, safety filters, audit tools) to process data independently.

---

## 🛠️ Security & Scaling
- **Distributed Rate Limiting**: Uses Redis to track requests across multiple instances.
- **Graceful Shutdown**: All services (Kafka, Sockets, DB, Redis) close cleanly on `SIGTERM`.
- **IVFFlat Indexing**: Database-level optimization for fast vector searches.

---

## ⚙️ Environment Variables
Check `.env.example` for the full list. Key additions:
```bash
KAFKA_BROKERS=localhost:9092
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=...
ALLOW_DIRECT_AI=true
```
