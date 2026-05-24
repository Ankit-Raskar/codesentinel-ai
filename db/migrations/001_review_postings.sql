
CREATE TABLE IF NOT EXISTS public.review_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES public.ai_reviews(id) ON DELETE CASCADE,
  pull_request_id UUID NOT NULL REFERENCES public.pull_requests(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('COMMENT', 'APPROVE', 'REQUEST_CHANGES')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','posting','posted','failed')),
  github_review_id BIGINT,
  github_html_url TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.review_postings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own postings all" ON public.review_postings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_review_postings_pr
  ON public.review_postings(pull_request_id, created_at DESC);
CREATE TRIGGER trg_review_postings_updated BEFORE UPDATE ON public.review_postings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.github_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'internal',
  payload JSONB,
  status TEXT NOT NULL DEFAULT 'received',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.github_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own events select" ON public.github_webhook_events
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own events insert" ON public.github_webhook_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_gh_events_user
  ON public.github_webhook_events(user_id, created_at DESC);
