create table public.personal_directory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null check (item_type in ('phone', 'address')),
  name text not null,
  value text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index personal_directory_items_user_type_active_sort_idx
  on public.personal_directory_items (user_id, item_type, is_active, sort_order);

alter table public.personal_directory_items enable row level security;

create policy "Users can read own personal directory items"
  on public.personal_directory_items
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own personal directory items"
  on public.personal_directory_items
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own personal directory items"
  on public.personal_directory_items
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own personal directory items"
  on public.personal_directory_items
  for delete
  using (auth.uid() = user_id);

drop trigger if exists trg_personal_directory_items_updated_at on public.personal_directory_items;
create trigger trg_personal_directory_items_updated_at
  before update on public.personal_directory_items
  for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.personal_directory_items to authenticated;
