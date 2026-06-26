alter table public.latest_ticker
  alter column href drop not null;

comment on column public.latest_ticker.href is
  'Optional link for manual/latest ticker items. Null means the ticker item is displayed as text without navigation.';
