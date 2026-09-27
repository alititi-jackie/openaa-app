# Supabase

Supabase clients, server helpers, application DTOs, and generated database types live here.

- `database.ts` is generated from the active Supabase schema.
- `types.ts` contains hand-written application DTOs used by forms and admin screens.
- Client helpers must never expose the service role key to browser code.

Regenerate `database.ts` after applying migrations to the intended Supabase project. From the repository root, with the Supabase CLI authenticated and the correct project ID verified:

```sh
supabase gen types typescript --project-id <project-id> > lib/supabase/database.ts
```

For a running local Supabase instance, use `supabase gen types typescript --local` in place of the project ID command. Review the generated diff before committing; do not edit individual generated table types by hand. Generating types does not apply migrations.
