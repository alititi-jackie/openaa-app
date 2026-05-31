# DMV Seed / Import

Do not import real DMV question data in Phase 2.

The confirmed migration source is the audited file from the old read-only project:

`data/openaa-ny-dmv-questions-v1.json`

Confirmed metadata:

- `_meta.version`: `2026-05-15`
- `language`: `zh-CN`
- `jurisdiction`: `New York`
- `totalQuestions`: `150`
- SHA256: `38e1ba579d9f58b18a6f9b4e61bce84ed3ff057d0cbb1d3085c62efae605ae4e`

Future import rules:

- Convert JSON into `dmv_questions`.
- Record each batch in `dmv_question_imports`.
- Use category slugs exactly as the JSON provides.
- Store image migration metadata first; `image_asset_id` may remain `null` until images are moved into `dmv-assets`.
