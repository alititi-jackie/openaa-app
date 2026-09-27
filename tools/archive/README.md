# Historical tools

These files are stored in the repository for manual maintenance and are not imported by the Next.js website. `legacy/` contains reviewed historic content and example JSON. `import-legacy-content.ts` plans a content import; `cleanup-demo-posts.ts` currently reports a cleanup plan and does not implement deletion.

From the repository root, these commands show a local plan without database writes:

```sh
npm run import:legacy -- --module=all --env=local --dry-run
npm run cleanup:demo-posts -- --env=local --dry-run
```

The import script writes only when explicitly run with `--apply` for local or staging; production apply is disabled. Confirm the target, source metadata, and plan before using apply. The cleanup script's `--apply` mode is intentionally unimplemented. See `docs/LEGACY_CONTENT_IMPORT.md` and `legacy/README.md` for the source format and historical review notes. Do not store service role keys or private user exports in this directory.
