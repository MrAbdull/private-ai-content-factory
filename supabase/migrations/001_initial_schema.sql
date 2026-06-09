-- Private AI Content Factory — single-user schema (no billing/multi-tenancy)

-- Channels & personality
CREATE TABLE IF NOT EXISTS youtube_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  youtube_channel_id TEXT NOT NULL UNIQUE,
  thumbnail_url TEXT,
  subscriber_count BIGINT DEFAULT 0,
  shorts_per_day INT NOT NULL DEFAULT 3 CHECK (shorts_per_day BETWEEN 1 AND 20),
  publishing_mode TEXT NOT NULL DEFAULT 'semi_automatic'
    CHECK (publishing_mode IN ('manual', 'semi_automatic', 'fully_automatic')),
  content_style TEXT NOT NULL DEFAULT 'educational',
  personality JSONB NOT NULL DEFAULT '{}',
  oauth_tokens JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Source materials
CREATE TABLE IF NOT EXISTS content_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  raw_content TEXT,
  source_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Content items (Shorts)
CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES youtube_channels(id) ON DELETE SET NULL,
  source_id UUID REFERENCES content_sources(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  hashtags TEXT[] DEFAULT '{}',
  script TEXT,
  hook TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'generating', 'review', 'scheduled', 'published', 'failed', 'archived')),
  duration_seconds INT NOT NULL DEFAULT 30,
  content_style TEXT NOT NULL DEFAULT 'educational',
  video_url TEXT,
  thumbnail_url TEXT,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  youtube_video_id TEXT,
  safety_status TEXT DEFAULT 'pending',
  predicted_score NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Multi-version testing
CREATE TABLE IF NOT EXISTS video_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  hook TEXT,
  script TEXT,
  narration_style TEXT,
  pacing_strategy TEXT,
  editing_style TEXT,
  caption_style TEXT,
  video_url TEXT,
  predicted_score NUMERIC(5,2),
  is_selected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(content_id, version_number)
);

-- Thumbnail variants
CREATE TABLE IF NOT EXISTS thumbnail_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  headline TEXT,
  layout TEXT,
  image_url TEXT,
  predicted_ctr NUMERIC(5,4),
  is_selected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance intelligence
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES youtube_channels(id) ON DELETE SET NULL,
  views BIGINT DEFAULT 0,
  watch_time_seconds BIGINT DEFAULT 0,
  retention_rate NUMERIC(5,4),
  click_through_rate NUMERIC(5,4),
  subscribers_gained INT DEFAULT 0,
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  shares INT DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trend discovery
CREATE TABLE IF NOT EXISTS trend_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  source TEXT NOT NULL,
  score NUMERIC(5,2),
  suggested_angles JSONB DEFAULT '[]',
  status TEXT DEFAULT 'new',
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Evergreen queue
CREATE TABLE IF NOT EXISTS evergreen_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES youtube_channels(id) ON DELETE CASCADE,
  content_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
  priority INT DEFAULT 0,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Resource management & automation
CREATE TABLE IF NOT EXISTS resource_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE,
  provider_type TEXT NOT NULL,
  quota_limit INT,
  quota_used INT DEFAULT 0,
  health TEXT DEFAULT 'healthy',
  config JSONB DEFAULT '{}',
  last_checked TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resource_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  action TEXT NOT NULL,
  success BOOLEAN,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS automation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payload JSONB DEFAULT '{}',
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Content blast operations
CREATE TABLE IF NOT EXISTS blast_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  requested_count INT NOT NULL,
  completed_count INT DEFAULT 0,
  channel_ids UUID[] DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Safety checks
CREATE TABLE IF NOT EXISTS safety_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL,
  passed BOOLEAN,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Footage usage tracking (avoid repetition)
CREATE TABLE IF NOT EXISTS footage_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES content_items(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  footage_id TEXT NOT NULL,
  footage_url TEXT,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: single-user private access
ALTER TABLE youtube_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE thumbnail_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE evergreen_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blast_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own channels" ON youtube_channels FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own sources" ON content_sources FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own content" ON content_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own versions" ON video_versions FOR ALL
  USING (EXISTS (SELECT 1 FROM content_items c WHERE c.id = content_id AND c.user_id = auth.uid()));
CREATE POLICY "Users own thumbnails" ON thumbnail_variants FOR ALL
  USING (EXISTS (SELECT 1 FROM content_items c WHERE c.id = content_id AND c.user_id = auth.uid()));
CREATE POLICY "Users own metrics" ON performance_metrics FOR ALL
  USING (EXISTS (SELECT 1 FROM content_items c WHERE c.id = content_id AND c.user_id = auth.uid()));
CREATE POLICY "Users own trends" ON trend_opportunities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own evergreen" ON evergreen_queue FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own jobs" ON automation_jobs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own blasts" ON blast_operations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own safety" ON safety_checks FOR ALL
  USING (EXISTS (SELECT 1 FROM content_items c WHERE c.id = content_id AND c.user_id = auth.uid()));

-- Indexes
CREATE INDEX idx_content_items_channel ON content_items(channel_id);
CREATE INDEX idx_content_items_status ON content_items(status);
CREATE INDEX idx_content_items_scheduled ON content_items(scheduled_at);
CREATE INDEX idx_performance_content ON performance_metrics(content_id);
CREATE INDEX idx_automation_jobs_status ON automation_jobs(status);
CREATE INDEX idx_footage_usage_provider ON footage_usage(provider, footage_id);
