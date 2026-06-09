-- Sprint 4: multi-platform publish, fingerprints, resource usage

ALTER TABLE content_items
  ADD COLUMN IF NOT EXISTS platform_ids JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cross_post_platforms TEXT[] DEFAULT '{}';

CREATE TABLE IF NOT EXISTS content_fingerprints (
  content_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title_hash TEXT NOT NULL,
  script_hash TEXT NOT NULL,
  hook_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (content_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_fingerprints_title_hash ON content_fingerprints(title_hash);
CREATE INDEX IF NOT EXISTS idx_fingerprints_script_hash ON content_fingerprints(script_hash);

CREATE TABLE IF NOT EXISTS resource_usage_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  quota_used BIGINT NOT NULL DEFAULT 0,
  quota_limit BIGINT NOT NULL DEFAULT 0,
  health TEXT NOT NULL DEFAULT 'healthy',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cross_post_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  platforms TEXT[] NOT NULL DEFAULT '{youtube}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
