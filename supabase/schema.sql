-- Meridian database schema (Supabase / Postgres 15+).
-- Apply with: psql "$DATABASE_URL" -f supabase/schema.sql   (idempotent)
--
-- All access goes through Next.js API routes using the service-role key, which bypasses
-- RLS. RLS is enabled with no policies so the public anon key can't read or write anything.

create extension if not exists vector with schema extensions;

-- ── Meetings ─────────────────────────────────────────────
create table if not exists public.meetings (
    id            uuid primary key default gen_random_uuid(),
    title         text,
    department    text,                    -- 'eng' | 'fin' | 'mkt'
    status        text,                    -- recording | processing | done | error
    transcript    text,
    audio_url     text,                    -- media URL, or 'recall:<bot_id>' while recording
    recall_bot_id text,
    started_at    timestamptz,
    ended_at      timestamptz,
    created_at    timestamptz not null default now()
);
create index if not exists meetings_department_idx on public.meetings (department, created_at desc);
create index if not exists meetings_audio_url_idx on public.meetings (audio_url);

create table if not exists public.participants (
    id            uuid primary key default gen_random_uuid(),
    meeting_id    uuid not null references public.meetings (id) on delete cascade,
    speaker_label text,
    name          text,
    created_at    timestamptz not null default now()
);
create index if not exists participants_meeting_idx on public.participants (meeting_id);

create table if not exists public.actions (
    id          uuid primary key default gen_random_uuid(),
    meeting_id  uuid not null references public.meetings (id) on delete cascade,
    description text not null,
    owner       text,
    status      text not null default 'pending',
    due_date    date,
    created_at  timestamptz not null default now()
);
create index if not exists actions_meeting_idx on public.actions (meeting_id);

-- ── RAG memory (768-dim gemini-embedding-001 vectors) ────
-- No FK to meetings: /api/rag/ingest and scripts/seed-rag.ts ingest chunks without a meetings row.
create table if not exists public.meeting_chunks (
    id          uuid primary key default gen_random_uuid(),
    meeting_id  uuid not null,
    department  text not null,
    content     text not null,
    chunk_type  text not null,             -- decision | action_item | discussion | summary | summary_delta
    speaker     text,
    "timestamp" double precision,
    embedding   extensions.vector(768),
    metadata    jsonb not null default '{}'::jsonb,
    created_at  timestamptz not null default now()
);
create index if not exists meeting_chunks_meeting_idx on public.meeting_chunks (meeting_id);
create index if not exists meeting_chunks_dept_type_idx on public.meeting_chunks (department, chunk_type, created_at desc);
create index if not exists meeting_chunks_embedding_idx on public.meeting_chunks
    using hnsw (embedding extensions.vector_cosine_ops);

create or replace function public.match_chunks(
    query_embedding extensions.vector(768),
    dept_filter     text,
    match_count     int default 5
)
returns table (
    id          uuid,
    meeting_id  uuid,
    content     text,
    chunk_type  text,
    speaker     text,
    metadata    jsonb,
    similarity  float
)
language sql stable
set search_path = public, extensions
as $$
    select c.id, c.meeting_id, c.content, c.chunk_type, c.speaker, c.metadata,
           1 - (c.embedding <=> query_embedding) as similarity
    from public.meeting_chunks c
    where c.department = dept_filter
      and c.embedding is not null
    order by c.embedding <=> query_embedding
    limit match_count;
$$;

-- ── Knowledge graph (read by /api/rag/graph) ─────────────
create table if not exists public.graph_nodes (
    id         uuid primary key default gen_random_uuid(),
    meeting_id uuid not null references public.meetings (id) on delete cascade,
    node_type  text not null,              -- decision | action_item | person | risk | meeting
    label      text not null,
    metadata   jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);
create index if not exists graph_nodes_meeting_idx on public.graph_nodes (meeting_id);

-- ── Lock down the public API ─────────────────────────────
alter table public.meetings       enable row level security;
alter table public.participants   enable row level security;
alter table public.actions        enable row level security;
alter table public.meeting_chunks enable row level security;
alter table public.graph_nodes    enable row level security;
revoke execute on function public.match_chunks(extensions.vector, text, int) from anon, authenticated, public;

-- ── Agent pipeline runs (lib/agent/runs.ts) ──────────────
create table if not exists public.agent_runs (
    id           uuid primary key default gen_random_uuid(),
    status       text not null,              -- running | waiting_for_recording | completed | failed
    current_step text,
    steps        jsonb not null default '[]'::jsonb,
    input        jsonb not null default '{}'::jsonb,
    meeting_id   uuid,
    bot_id       text,
    bot_status   text,
    outputs      jsonb not null default '[]'::jsonb,
    errors       jsonb not null default '[]'::jsonb,
    error        text,
    started_at   timestamptz not null default now(),
    finished_at  timestamptz,
    updated_at   timestamptz not null default now()
);
create index if not exists agent_runs_started_idx on public.agent_runs (started_at desc);
create index if not exists agent_runs_bot_idx on public.agent_runs (bot_id);
alter table public.agent_runs enable row level security;
