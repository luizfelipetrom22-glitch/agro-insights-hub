-- 1) Selo de verificação no perfil do produtor
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;

-- 2) Denúncias
CREATE TABLE public.abuse_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('anuncio','usuario','mensagem','pedido')),
  target_id uuid,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','em_analise','resolvido','arquivado')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.abuse_reports TO authenticated;
GRANT ALL ON public.abuse_reports TO service_role;

ALTER TABLE public.abuse_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reporters create their own reports"
  ON public.abuse_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Reporters read their own reports"
  ON public.abuse_reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "Admins read all reports"
  ON public.abuse_reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update reports"
  ON public.abuse_reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_abuse_reports_updated_at
  BEFORE UPDATE ON public.abuse_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_abuse_reports_reported_user ON public.abuse_reports (reported_user_id, status);
CREATE INDEX idx_abuse_reports_target ON public.abuse_reports (target_type, target_id);

-- 3) Bloqueios entre usuários
CREATE TABLE public.user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

GRANT SELECT, INSERT, DELETE ON public.user_blocks TO authenticated;
GRANT ALL ON public.user_blocks TO service_role;

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own blocks"
  ON public.user_blocks FOR ALL TO authenticated
  USING (auth.uid() = blocker_id)
  WITH CHECK (auth.uid() = blocker_id);

CREATE INDEX idx_user_blocks_pair ON public.user_blocks (blocker_id, blocked_id);

-- 4) Impedir mensagens entre usuários bloqueados
CREATE OR REPLACE FUNCTION public.is_blocked_pair(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks b
    WHERE (b.blocker_id = _a AND b.blocked_id = _b)
       OR (b.blocker_id = _b AND b.blocked_id = _a)
  );
$$;

CREATE OR REPLACE FUNCTION public.can_send_message(_conversation_id uuid, _sender uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = _conversation_id
      AND (c.buyer_id = _sender OR c.producer_id = _sender)
      AND NOT public.is_blocked_pair(c.buyer_id, c.producer_id)
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_blocked_pair(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_send_message(uuid, uuid) FROM anon;

DROP POLICY IF EXISTS "Participants send messages" ON public.messages;
CREATE POLICY "Participants send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.can_send_message(conversation_id, auth.uid()));

-- 5) Contagem pública de denúncias abertas (sem expor autores)
CREATE OR REPLACE FUNCTION public.open_reports_count(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.abuse_reports r
  WHERE r.reported_user_id = _user_id
    AND r.status IN ('aberto','em_analise');
$$;

REVOKE EXECUTE ON FUNCTION public.open_reports_count(uuid) FROM anon;