create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type public.consent_type not null,
  consent_version text not null,
  accepted_at timestamptz not null default now(),
  ip_hash text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, consent_type, consent_version)
);

create index if not exists user_consents_user_created_idx
  on public.user_consents (user_id, created_at desc);

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.deletion_status not null default 'pending',
  reason text,
  requested_at timestamptz not null default now(),
  processed_by uuid references auth.users(id) on delete set null,
  processed_at timestamptz,
  admin_note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists account_deletion_requests_status_created_idx
  on public.account_deletion_requests (status, created_at desc);

alter table public.user_consents enable row level security;
alter table public.account_deletion_requests enable row level security;

create policy "Users can read own consents"
  on public.user_consents
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own consents"
  on public.user_consents
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Admins can read user consents"
  on public.user_consents
  for select
  to authenticated
  using (public.has_admin_permission('view_users'));

create policy "Users can create own deletion requests"
  on public.account_deletion_requests
  for insert
  to authenticated
  with check (auth.uid() = user_id and status = 'pending');

create policy "Users can read own deletion requests"
  on public.account_deletion_requests
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can cancel own pending deletion requests"
  on public.account_deletion_requests
  for update
  to authenticated
  using (auth.uid() = user_id and status = 'pending')
  with check (auth.uid() = user_id and status in ('pending', 'cancelled'));

create policy "Admins can manage deletion requests"
  on public.account_deletion_requests
  for all
  to authenticated
  using (public.has_admin_permission('manage_user_status'))
  with check (public.has_admin_permission('manage_user_status'));
