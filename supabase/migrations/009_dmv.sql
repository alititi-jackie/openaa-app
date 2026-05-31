create table if not exists public.dmv_questions (
  id uuid primary key default gen_random_uuid(),
  state text not null default 'NY',
  language text not null default 'zh-CN',
  category text not null,
  question_text text not null,
  options jsonb not null,
  correct_answer text not null,
  explanation text,
  image_asset_id uuid references public.image_assets(id) on delete set null,
  difficulty text,
  source_name text,
  source_version text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dmv_questions_lookup_idx
  on public.dmv_questions (state, language, is_active, sort_order);

create index if not exists dmv_questions_category_idx
  on public.dmv_questions (state, language, category, is_active);

create table if not exists public.dmv_user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  state text not null default 'NY',
  language text not null default 'zh-CN',
  question_id uuid not null references public.dmv_questions(id) on delete cascade,
  last_answer text,
  is_correct boolean,
  answered_count integer not null default 0,
  last_answered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, question_id)
);

create table if not exists public.dmv_wrong_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.dmv_questions(id) on delete cascade,
  wrong_count integer not null default 1,
  last_wrong_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, question_id)
);

create table if not exists public.dmv_exam_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  state text not null default 'NY',
  language text not null default 'zh-CN',
  total_questions integer not null,
  correct_count integer not null,
  wrong_count integer not null,
  sign_correct_count integer,
  passed boolean not null default false,
  duration_seconds integer,
  answers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists dmv_exam_results_user_created_idx
  on public.dmv_exam_results (user_id, created_at desc);

create table if not exists public.dmv_question_imports (
  id uuid primary key default gen_random_uuid(),
  source_file text not null,
  source_version text,
  source_name text,
  checksum_sha256 text,
  total_count integer not null default 0,
  imported_count integer not null default 0,
  failed_count integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed', 'cancelled')),
  started_at timestamptz,
  finished_at timestamptz,
  imported_by uuid references auth.users(id) on delete set null,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.dmv_questions enable row level security;
alter table public.dmv_user_progress enable row level security;
alter table public.dmv_wrong_questions enable row level security;
alter table public.dmv_exam_results enable row level security;
alter table public.dmv_question_imports enable row level security;

create policy "Public can read active DMV questions"
  on public.dmv_questions
  for select
  using (is_active = true);

create policy "Admins can read DMV questions"
  on public.dmv_questions
  for select
  to authenticated
  using (public.has_admin_permission('view_dmv_questions') or public.has_admin_permission('manage_dmv_questions'));

create policy "Admins can manage DMV questions"
  on public.dmv_questions
  for all
  to authenticated
  using (public.has_admin_permission('manage_dmv_questions'))
  with check (public.has_admin_permission('manage_dmv_questions'));

create policy "Users can manage own DMV progress"
  on public.dmv_user_progress
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own DMV wrong questions"
  on public.dmv_wrong_questions
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own DMV exam results"
  on public.dmv_exam_results
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admins can read DMV imports"
  on public.dmv_question_imports
  for select
  to authenticated
  using (public.has_admin_permission('import_dmv_questions') or public.has_admin_permission('manage_dmv_questions'));

create policy "Admins can manage DMV imports"
  on public.dmv_question_imports
  for all
  to authenticated
  using (public.has_admin_permission('import_dmv_questions') or public.has_admin_permission('manage_dmv_questions'))
  with check (public.has_admin_permission('import_dmv_questions') or public.has_admin_permission('manage_dmv_questions'));
