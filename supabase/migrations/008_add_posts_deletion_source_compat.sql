-- Keep the current application code compatible with older posts schema.
-- The app writes deletion_source; deleted_source is the legacy column and remains in place.
alter table public.posts
  add column if not exists deletion_source text;

update public.posts
set deletion_source = deleted_source
where deletion_source is null
  and deleted_source is not null;

comment on column public.posts.deletion_source is
  'Current application deletion origin field. Legacy deleted_source is retained for compatibility.';
