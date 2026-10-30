# Database integration tests

This directory is reserved for future tests against an isolated Supabase database. Unit tests cannot prove RLS or transaction behaviour; use disposable accounts and a non-production database before enabling database tests in CI.

## Account and post permissions

Run `npm run test:permissions`. This uses an isolated in-memory PGlite PostgreSQL
instance with the repository schema and RLS definitions, never production users.
It tests direct authenticated writes, protected profile fields, Auth identity sync,
restricted/banned accounts, contacts/details, and the required flow:
admin hides → author edits while hidden → author republishes, preserving admin history.
The historical baseline has forward foreign-key references; the disposable bootstrap
orders unchanged table declarations by their dependencies.
