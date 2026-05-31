# Image Strategy

OpenAA uses new Supabase Storage for new uploads while still allowing safe external image URLs.

## Source Types

- `storage`: files uploaded to the new Supabase Storage project.
- `external`: trusted external URLs, initially including `https://img.openaa.com/`.

## image_assets Fields

Phase 2 creates `image_assets` with `source_type`, `bucket`, `path`, `public_url`, `external_url`, `external_host`, `owner_id`, `entity_type`, `entity_id`, `mime_type`, `size_bytes`, `width`, `height`, `status`, `is_public`, `metadata`, `created_at`, `updated_at`, and `deleted_at`.

External images are not deleted by OpenAA. Admins may only remove references or replace URLs. Storage images require owner or admin permission and an audit log entry before deletion.

## External URL Rules

External images must use `https`. Phase 2 constrains external image hosts to `img.openaa.com` at the database layer. Future hosts should be added deliberately after review.

## Storage Rules

Storage-backed assets will point to a bucket/path in the new Supabase project. Service role and Storage deletion operations must remain server-side.
