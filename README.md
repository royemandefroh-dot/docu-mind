<div align="center">

<img src="https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
<img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" />
<img src="https://img.shields.io/badge/Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white" />
<img src="https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white" />

<br/>
<br/>

# ✦ DocuMind

### AI-Powered Document Intelligence Platform

<p align="center">
  <strong>Upload. Analyze. Understand.</strong><br/>
  <sub>Transform your documents into actionable insights with cutting-edge AI</sub>
</p>

<br/>

[![Live Demo](https://img.shields.io/badge/▶_Live_Demo-docu--mind.vercel.app-blue?style=for-the-badge&logo=vercel&logoColor=white)](https://docu-mind-phi-silk.vercel.app)
&nbsp;
[![GitHub Stars](https://img.shields.io/github/stars/your-username/docu-mind?style=for-the-badge&logo=github&color=yellow)](https://github.com/your-username/docu-mind)

---

<p align="center">
  <em>A production-ready, multi-tenant SaaS built with Next.js 16, featuring RAG-powered document chat, real-time processing, and a gorgeous glassmorphic UI</em>
</p>

</div>

<br/>

## ⚡ What is DocuMind?

DocuMind is a **full-stack AI document intelligence platform** that lets users upload PDFs, Word documents, and PowerPoint files — then **chat with them** using RAG (Retrieval-Augmented Generation). It chunks documents into semantic embeddings stored in Supabase, retrieves relevant context per query, and generates precise AI answers grounded in your actual content.

> **Not a toy project.** DocuMind is a fully deployed, multi-tenant SaaS with authentication, real-time updates, persistent chat history, project organization, storage management, Stripe billing, and a pixel-perfect responsive UI.

<br/>

## 🎯 Key Features

<table>
<tr>
<td width="50%">

### 📄 Multi-Format Upload
- **PDF**, **DOCX**, **PPTX** support (up to 5MB)
- Drag & drop with visual progress feedback
- Real-time status tracking (queued → processing → complete)
- Automatic text extraction and chunking

</td>
<td width="50%">

### 🤖 RAG-Powered Chat
- Context-aware answers from your documents
- Semantic search across document chunks
- Persistent chat history per document
- AI-suggested questions based on content

</td>
</tr>
<tr>
<td width="50%">

### 🏗️ Workspace Management
- **Projects** — Organize documents into folders
- **Star / Archive / Rename** — Full document lifecycle
- **Sort & Filter** — By date, name, size, type, pinned
- **Grid & List views** — Toggle between layouts

</td>
<td width="50%">

### 🎨 Premium UI/UX
- **Glassmorphic design** with backdrop blur effects
- **Dark & Light mode** with smooth transitions
- **Framer Motion** animations throughout
- **Fully responsive** — pixel-perfect on mobile

</td>
</tr>
<tr>
<td width="50%">

### ⚡ Real-Time Processing
- Supabase **Realtime** subscriptions for live updates
- Documents auto-refresh when processing completes
- Toast notifications for status changes
- Optimistic UI updates for instant feedback

</td>
<td width="50%">

### 🔐 Production-Ready
- **Clerk** authentication (OAuth, email, MFA)
- **Stripe** payment integration
- **Multi-tenant** data isolation per user
- **Storage quotas** with usage tracking

</td>
</tr>
</table>

<br/>

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 16)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ Landing  │  │Dashboard │  │ Document │  │   Chat Panel   │  │
│  │  Page    │  │  Client  │  │   View   │  │  (RAG Chat)    │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                       API LAYER (Route Handlers)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ /api/chat│  │/api/     │  │/api/     │  │ /api/webhooks  │  │
│  │ (RAG)   │  │checkout  │  │suggest   │  │  (Stripe)      │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                     SERVER ACTIONS                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │  Ingest  │  │Documents │  │   Chat   │  │   Summarize    │  │
│  │ (Parse + │  │  (CRUD)  │  │(History) │  │   (AI Gen)     │  │
│  │  Embed)  │  │          │  │          │  │                │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                      DATA & SERVICES                             │
│  ┌───────────────┐  ┌────────────┐  ┌───────────────────────┐  │
│  │   Supabase    │  │   Clerk    │  │    Groq / Gemini      │  │
│  │ (PostgreSQL + │  │   (Auth)   │  │  (LLM + Embeddings)   │  │
│  │  Storage +    │  │            │  │                        │  │
│  │  Realtime)    │  │            │  │                        │  │
│  └───────────────┘  └────────────┘  └───────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

<br/>

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16 (App Router) | Full-stack React with RSC & Server Actions |
| **Language** | TypeScript | End-to-end type safety |
| **Styling** | Tailwind CSS 4 + Framer Motion | Responsive design + fluid animations |
| **UI Library** | shadcn/ui + Radix UI | Accessible, composable components |
| **Auth** | Clerk | OAuth, email auth, session management |
| **Database** | Supabase (PostgreSQL) | Documents, chunks, chat history, real-time |
| **Storage** | Supabase Storage | File uploads with per-user buckets |
| **AI / LLM** | Groq (Llama 3.3) | Blazing-fast chat inference |
| **Embeddings** | Google Gemini | Semantic vector embeddings for RAG |
| **Payments** | Stripe | Subscription billing & webhooks |
| **File Parsing** | pdf-parse, Mammoth, JSZip | PDF, DOCX, PPTX text extraction |
| **Deployment** | Vercel | Edge-optimized hosting |

<br/>

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** and npm
- [Supabase](https://supabase.com) project (free tier)
- [Clerk](https://clerk.com) application (free tier)
- [Groq](https://console.groq.com) API key (free tier)
- [Google AI Studio](https://aistudio.google.com) API key — for Gemini embeddings (free tier)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/DOCU_MIND.git
cd DOCU_MIND/docu-mind
npm install
```

### 2. Configure Environment

Create a `.env.local` file with the following variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI Keys  
GROQ_API_KEY=gsk_...
GOOGLE_GENERATIVE_AI_API_KEY=AI...

# Stripe (optional)
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Set Up Supabase

Run the SQL migrations in your Supabase SQL editor:

```sql
-- Documents table
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT NOT NULL DEFAULT 0,
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  summary TEXT,
  is_starred BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  project_id UUID REFERENCES projects(id),
  last_opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document chunks for RAG
CREATE TABLE document_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(768),
  chunk_index INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable vector similarity search
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding VECTOR(768),
  match_document_id UUID,
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5
) RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity FLOAT
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE dc.document_id = match_document_id
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE documents;
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you're ready to go! 🎉

<br/>

## 📁 Project Structure

```
docu-mind/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Sign-in / Sign-up pages (Clerk)
│   │   ├── api/
│   │   │   ├── chat/            # RAG chat endpoint
│   │   │   ├── checkout/        # Stripe checkout session
│   │   │   ├── suggest/         # AI question suggestions
│   │   │   └── webhooks/        # Stripe webhook handler
│   │   ├── dashboard/
│   │   │   ├── document/[docId] # Document viewer + chat
│   │   │   ├── documents/       # All documents page
│   │   │   ├── chat-history/    # Chat history page
│   │   │   └── plans/           # Pricing plans
│   │   ├── page.tsx             # Landing page
│   │   ├── layout.tsx           # Root layout (Clerk + Theme)
│   │   └── globals.css          # Design system tokens
│   ├── components/
│   │   ├── chat/                # ChatPanel, ChatMessage
│   │   ├── ui/                  # shadcn/ui primitives
│   │   ├── DocumentCard.tsx     # Document grid/list card
│   │   ├── DocumentViewer.tsx   # PDF/file viewer
│   │   ├── DragDropZone.tsx     # Upload with drag & drop
│   │   ├── Header.tsx           # Top navigation bar
│   │   ├── Sidebar.tsx          # Collapsible sidebar
│   │   ├── SortFilterBar.tsx    # Sort & filter controls
│   │   ├── SettingsView.tsx     # User settings page
│   │   └── ThemeToggle.tsx      # Dark/light mode switch
│   ├── lib/
│   │   ├── actions/             # Server actions
│   │   │   ├── ingest.ts        # File parsing + embedding
│   │   │   ├── documents.ts     # CRUD operations
│   │   │   ├── chat.ts          # Chat history management
│   │   │   └── summarize.ts     # AI summarization
│   │   ├── supabase.ts          # Supabase admin client
│   │   ├── supabase-browser.ts  # Supabase browser client
│   │   └── utils/               # Helpers (fileTypes, time)
│   ├── hooks/                   # Custom React hooks
│   └── types/                   # TypeScript definitions
├── supabase/                    # Database migrations
├── public/                      # Static assets
└── package.json
```

<br/>

## 🔄 How RAG Chat Works

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as /api/chat
    participant S as Supabase
    participant G as Gemini
    participant L as Groq LLM

    U->>F: Types question
    F->>A: POST { messages, docId }
    A->>G: Generate embedding for query
    G-->>A: Query vector (768d)
    A->>S: match_document_chunks(vector, docId)
    S-->>A: Top 5 relevant chunks
    A->>L: System prompt + chunks + question
    L-->>A: AI-generated answer
    A->>S: Save chat message
    A-->>F: Stream response
    F-->>U: Display answer
```

<br/>

## 🎨 Design Philosophy

DocuMind follows a **premium glassmorphic design language** with these principles:

- **🌗 Dual Themes** — Full dark mode and light mode with seamless transitions
- **✨ Micro-Animations** — Framer Motion powers smooth page transitions, hover effects, and loading states
- **📱 Mobile-First** — Tab-based layouts on mobile, split-pane on desktop, touch-optimized hit targets
- **🎭 Glassmorphism** — Backdrop blur, translucent surfaces, and layered depth
- **⚡ Optimistic UI** — Instant feedback with background sync for star, archive, and rename actions

<br/>

## 📜 License

This project is open-source under the [MIT License](LICENSE).

<br/>

---

<div align="center">

**Built with ❤️ using Next.js, Supabase, and AI**

<sub>If you found this helpful, consider giving it a ⭐</sub>

</div>
