# Image Strategy

OpenAA uses new Supabase Storage for new uploads while still allowing safe external image URLs.

## Source Types

- `storage`: files uploaded to the new Supabase Storage project.
- `external`: trusted external URLs, initially including `https://img.openaa.com/`.

## image_assets Fields

Planned fields include `source_type`, `bucket`, `path`, `public_url`, `external_url`, `external_host`, `owner_id`, `entity_type`, `entity_id`, `mime_type`, `size_bytes`, `width`, `height`, `status`, `created_at`, and `updated_at`.

External images are not deleted by OpenAA. Admins may only remove references or replace URLs. Storage images require owner or admin permission and an audit log entry before deletion.
