CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  producer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  request_id uuid REFERENCES public.purchase_requests(id) ON DELETE SET NULL,
  last_message text,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX conversations_unique_pair_listing
  ON public.conversations (buyer_id, producer_id, COALESCE(listing_id, '00000000-0000-0000-0000-000000000000'::uuid));
CREATE INDEX conversations_buyer_idx ON public.conversations (buyer_id, last_message_at DESC);
CREATE INDEX conversations_producer_idx ON public.conversations (producer_id, last_message_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read conversations" ON public.conversations
  FOR SELECT TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = producer_id);
CREATE POLICY "Participants create conversations" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = producer_id);
CREATE POLICY "Participants update conversations" ON public.conversations
  FOR UPDATE TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = producer_id)
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = producer_id);

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = _conversation_id
      AND (c.buyer_id = _user_id OR c.producer_id = _user_id)
  );
$$;

REVOKE ALL ON FUNCTION public.is_conversation_participant(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) TO authenticated, service_role;

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text,
  attachment_url text,
  attachment_name text,
  attachment_type text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX messages_conversation_idx ON public.messages (conversation_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read messages" ON public.messages
  FOR SELECT TO authenticated
  USING (public.is_conversation_participant(conversation_id, auth.uid()));
CREATE POLICY "Participants send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_conversation_participant(conversation_id, auth.uid()));
CREATE POLICY "Participants update messages" ON public.messages
  FOR UPDATE TO authenticated
  USING (public.is_conversation_participant(conversation_id, auth.uid()))
  WITH CHECK (public.is_conversation_participant(conversation_id, auth.uid()));
CREATE POLICY "Senders delete own messages" ON public.messages
  FOR DELETE TO authenticated
  USING (sender_id = auth.uid());

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'geral',
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_idx ON public.notifications (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Authenticated create notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conv public.conversations%ROWTYPE;
  recipient uuid;
BEGIN
  SELECT * INTO conv FROM public.conversations WHERE id = NEW.conversation_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  UPDATE public.conversations
     SET last_message = COALESCE(NEW.body, NEW.attachment_name, 'Anexo'),
         last_message_at = NEW.created_at,
         updated_at = now()
   WHERE id = NEW.conversation_id;

  recipient := CASE WHEN NEW.sender_id = conv.buyer_id THEN conv.producer_id ELSE conv.buyer_id END;

  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    recipient,
    'mensagem',
    'Nova mensagem',
    LEFT(COALESCE(NEW.body, NEW.attachment_name, 'Anexo recebido'), 140),
    '/mensagens?conversa=' || NEW.conversation_id::text
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_message();

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;