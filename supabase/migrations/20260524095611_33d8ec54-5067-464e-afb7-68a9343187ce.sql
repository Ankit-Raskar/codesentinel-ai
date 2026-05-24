
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  github_username TEXT,
  github_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own profile delete" ON public.profiles FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  github_repo_id BIGINT NOT NULL,
  full_name TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  default_branch TEXT DEFAULT 'main',
  language TEXT,
  private BOOLEAN DEFAULT false,
  html_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, github_repo_id)
);
ALTER TABLE public.repositories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own repos all" ON public.repositories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.pull_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repository_id UUID NOT NULL REFERENCES public.repositories(id) ON DELETE CASCADE,
  github_pr_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  state TEXT NOT NULL DEFAULT 'open',
  author TEXT,
  author_avatar TEXT,
  head_sha TEXT,
  base_sha TEXT,
  head_ref TEXT,
  base_ref TEXT,
  html_url TEXT,
  additions INTEGER DEFAULT 0,
  deletions INTEGER DEFAULT 0,
  changed_files INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  github_created_at TIMESTAMPTZ,
  UNIQUE(repository_id, github_pr_number)
);
ALTER TABLE public.pull_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own prs all" ON public.pull_requests FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.ai_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pull_request_id UUID NOT NULL REFERENCES public.pull_requests(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  quality_score NUMERIC(3,1),
  security_score NUMERIC(3,1),
  performance_score NUMERIC(3,1),
  merge_safety_score NUMERIC(3,1),
  bug_probability NUMERIC(3,2),
  summary TEXT,
  total_issues INTEGER DEFAULT 0,
  critical_count INTEGER DEFAULT 0,
  warning_count INTEGER DEFAULT 0,
  suggestion_count INTEGER DEFAULT 0,
  optimization_count INTEGER DEFAULT 0,
  raw_response JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.ai_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reviews all" ON public.ai_reviews FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES public.ai_reviews(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  line_number INTEGER,
  severity TEXT NOT NULL DEFAULT 'suggestion',
  category TEXT,
  title TEXT NOT NULL,
  explanation TEXT NOT NULL,
  suggested_fix TEXT,
  confidence NUMERIC(3,2) DEFAULT 0.8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.review_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own comments all" ON public.review_comments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_id UUID REFERENCES public.ai_reviews(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own chat all" ON public.chat_messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_repos_user ON public.repositories(user_id);
CREATE INDEX idx_prs_repo ON public.pull_requests(repository_id);
CREATE INDEX idx_prs_user ON public.pull_requests(user_id);
CREATE INDEX idx_reviews_pr ON public.ai_reviews(pull_request_id);
CREATE INDEX idx_reviews_user ON public.ai_reviews(user_id);
CREATE INDEX idx_comments_review ON public.review_comments(review_id);
CREATE INDEX idx_chat_review ON public.chat_messages(review_id);

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
