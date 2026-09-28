-- A display choice only: ownership, moderation and contact details stay unchanged.
alter table public.posts
  add column if not exists is_anonymous boolean not null default false;
