# LearnGenie AI — Project Documentation

Welcome to the documentation for **LearnGenie AI**, an advanced, AI-powered learning assistant designed to help students study smarter. This application delivers personalized study plans, interactive quizzes, flashcard decks, a streaming chat tutor, progress analytics, and robust note-taking capabilities—all powered by Google Gemini.

---

## 1. Technology Stack

LearnGenie AI is constructed using a modern, scalable, type-safe monorepo architecture leveraging **pnpm workspaces**.

| Layer | Technology Used | Purpose |
| :--- | :--- | :--- |
| **Monorepo / Package Manager** | `pnpm` Workspaces | Manages dependencies across multiple packages and apps efficiently, ensuring fast installations and modularity. |
| **Frontend Framework** | React 19 + Vite | Powering a fast, reactive, and optimized single-page web application. |
| **Frontend Styling** | Tailwind CSS v4 + Vanilla CSS | Modern, utility-first CSS styling with deep Indigo, Purple, and Amber color accents. |
| **UI Components** | Radix UI (shadcn/ui style primitives) | Accessible, unstyled primitives for UI components like dialogs, dropdowns, and accordions. |
| **Animations & Visuals** | Framer Motion + Canvas Confetti | Smooth interactive page transitions, 3D card flips, and micro-celebrations upon completing tasks. |
| **Frontend Routing** | `wouter` | A lightweight, fast routing library for React. |
| **Backend Framework** | Node.js 24 + Express 5 | Lightweight, async-first server framework managing business logic, routing, and SSE. |
| **Database** | PostgreSQL | Relational database for structured, persistent user and application data. |
| **Database ORM** | Drizzle ORM | Type-safe TypeScript ORM for schema definition, migrations, and query building. |
| **AI Integration** | Google Gemini API (`@google/genai`) | Official SDK used to connect with `gemini-2.5-flash` for high-speed, cost-effective, and smart text generation. |
| **Data Validation** | Zod (v4) & `drizzle-zod` | Runtime schema validation for API inputs/outputs and DB models. |
| **API Code Generation** | Orval | Generates React Query hooks and client fetch operations directly from the OpenAPI specification. |
| **Build Tooling** | `esbuild` + `tsconfig` references | Compiles backend files into highly optimized bundles; type-checks across all workspace packages. |

---

## 2. How it Works (System Architecture)

```mermaid
graph TD
    subgraph Frontend [React SPA - @workspace/learngenie]
        UI[React Pages / UI]
        RQ[React Query Hooks]
        SSE[SSE Chat Client]
    end

    subgraph API Spec [Contract Layer]
        OAS[openapi.yaml]
    end

    subgraph Backend [Express Server - @workspace/api-server]
        Rtr[Express Router]
        Mid[Zod Validators]
        GClient[Gemini Client]
    end

    subgraph Database [Storage Layer]
        DB[(PostgreSQL)]
        Drz[Drizzle ORM]
    end

    %% Contract Generation
    OAS -->|Orval Codegen| RQ
    OAS -->|Orval Codegen| Mid

    %% Operations
    UI -->|Uses| RQ
    UI -->|Uses| SSE
    RQ -->|HTTP REST| Rtr
    SSE -->|SSE Connection| Rtr
    Rtr -->|Validate| Mid
    Rtr -->|Queries| Drz
    Drz -->|Reads/Writes| DB
    Rtr -->|Invocations| GClient
    GClient -->|API Requests| Gemini[Google Gemini API]
```

### A. Contract-First API Workflow
1. The **OpenAPI Spec** (`lib/api-spec/openapi.yaml`) serves as the single source of truth for all API contracts.
2. Running the codegen script (`pnpm --filter @workspace/api-spec run codegen`) invokes **Orval**, which translates the OpenAPI spec into:
   - **Zod validation schemas** (`lib/api-zod/src/generated/`) for the backend.
   - **React Query hooks** (`lib/api-client-react/src/generated/`) for the frontend.
3. This ensures that any API signature change immediately breaks the build if the frontend and backend are out of sync, preventing runtime API mismatches.

### B. Streaming AI Conversations (SSE)
For the AI Tutor page, standard HTTP requests are insufficient because users expect real-time, token-by-token responses.
1. The frontend initiates a connection to the server using standard `fetch` with a `ReadableStream`.
2. The backend Express route (`/api/chat/conversations/:id/messages`) connects to Google Gemini via `@google/genai` using the `ai.models.generateContentStream` method.
3. The server writes responses chunk-by-chunk using a **Server-Sent Events (SSE)** stream.
4. The user receives instantaneous feedback as the AI types, and once the stream completes, the final assistant response is persisted in the PostgreSQL database.

---

## 3. Key Features & Uses

LearnGenie AI is loaded with features designed to cover all facets of an active student's study lifecycle:

1. **Dashboard (Daily Cockpit)**: 
   - Displays study streaks, completed quizzes, notes count, and experience points (XP/Level progression).
   - Features a built-in Pomodoro timer to encourage focused work.
   - Quick-access tiles for recent activity and immediate study actions.
2. **AI Tutor (Streaming Chat)**: 
   - A direct portal to an encouraging, intelligent study mentor.
   - Retains conversation history so students can resume past brainstorming sessions.
3. **Personalized Study Planner**: 
   - Dynamically crafts comprehensive, week-by-week study schedules.
   - Tailored to a student's chosen subject, current skill level, daily study hours, and exam deadlines.
4. **AI-Generated Quizzes**: 
   - Generates custom multiple-choice quizzes on any academic topic.
   - Complete with question timers, instant grading, in-depth explanations for correct/incorrect answers, and visual celebrations (confetti) upon achieving passing scores.
5. **Smart Flashcards**: 
   - Creates topic-specific decks featuring a beautiful 3D flip animation.
   - Allows users to mark cards as "New", "Learning", or "Mastered" to track concept retention.
6. **Study Notebook**: 
   - Full CRUD markdown notepad with topic categorization, search functionality, and pinning capabilities.
7. **Progress & Analytics**: 
   - Visualizes study habits and performance trends using interactive Recharts diagrams (e.g., study time over time, quiz success rates).
8. **Study Calendar**: 
   - Maps out the generated study plan tasks over a weekly or monthly grid, keeping milestones and exam deadlines highly visible.

---

## 4. Key Benefits

- **Hyper-Personalization**: The AI adapts to the student's background and schedule, replacing generic syllabus structures with tailored timelines.
- **Engagement & Gamification**: Study streaks, XP gains, level milestones, and interactive widgets keep learners intrinsically motivated.
- **Frictionless AI Interaction**: SSE streaming minimizes perceived latency, creating an active, conversational pairing experience with the tutor.
- **Robust Maintainability**: The monorepo design, TypeScript coverage, and contract-first code generation make it highly durable, easy to refactor, and scalable.

---

## 5. Security & Environment Configuration

> [!IMPORTANT]  
> **The original `.env` file containing local configurations and secrets is excluded from this repository to prevent security compromises. A `.env.example` template file is provided in the root folder instead.**

To run the application locally, copy `.env.example` to `.env` and fill in your credentials.


### Required Environment Variables:
```env
# PostgreSQL database connection string
DATABASE_URL="postgresql://username:password@localhost:5432/learngenie"

# Google Gemini API Key (obtained from Google AI Studio)
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"

# Port for the API server (default: 8080)
PORT=8080
```

---

## 6. File Organization Evaluation

The project codebase is **very well-organized**, adhering to modern monorepo patterns.

### Strengths in Organization:
- **Clean Separation of Concerns**: Libraries are clearly segmented under `lib/` and applications/services are structured under `artifacts/` (e.g., separating the API server from the Vite client).
- **Contract-First Code Generation**: Having `lib/api-spec` generate code for both the client (`lib/api-client-react`) and database validators (`lib/api-zod`) is a top-tier architectural pattern.
- **Unified Catalog Configuration**: Dependencies are cataloged in `pnpm-workspace.yaml`, reducing version mismatch friction across workspace components.
- **Onboarding Readiness**: Includes a `.env.example` file in the root workspace to help developers configure their local Postgres database and Gemini API credentials quickly.

