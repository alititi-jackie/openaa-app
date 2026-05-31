# DMV Import Plan

The first DMV question bank source is the audited file from `openaa-ny`:

`data/openaa-ny-dmv-questions-v1.json`

## Confirmed Metadata

- Version: `2026-05-15`
- Language: `zh-CN`
- Jurisdiction: `New York`
- Total questions: `150`
- SHA256: `38e1ba579d9f58b18a6f9b4e61bce84ed3ff057d0cbb1d3085c62efae605ae4e`

## Rule

The legacy JSON is migration input only. The new app must read DMV questions from Supabase `dmv_questions`, with import batches recorded in `dmv_question_imports`.

Phase 2 creates the tables only. It does not import real DMV data.

## Mapping

- `state = NY`
- `language = zh-CN`
- `category = question.category`
- `question_text = question.question`
- `options = { choices, answerIndex, tags, legacyId }`
- `correct_answer = question.answerText`
- `explanation = question.explanation`
- `image_asset_id = null` initially or migrated asset ID later
- `difficulty = question.difficulty`
- `source_name = question.reference` or `_meta.officialReference`
- `source_version = 2026-05-15`
- `is_active = true`
- `sort_order = question.id`

Public copy must say: OpenAA 纽约 DMV 中文练习题库，仅供学习参考，实际考试内容以 New York DMV 官方资料为准。

## Import Batch Fields

`dmv_question_imports` records `source_file`, `source_version`, `source_name`, `checksum_sha256`, `total_count`, `imported_count`, `failed_count`, `status`, `started_at`, `finished_at`, `imported_by`, `notes`, and `metadata`.

## Image Strategy

The first import may keep `image_asset_id = null`. Original image URLs from `img.openaa.com` should be preserved in import metadata until the images are moved to the new `dmv-assets` bucket and represented in `image_assets`.
