
-- Extend profiles with runner-specific fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS runner_type text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS strava_url text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instagram_url text DEFAULT '';

-- Create conversations table
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  participant_one uuid NOT NULL,
  participant_two uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(listing_id, participant_one, participant_two)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT TO authenticated
  USING (auth.uid() = participant_one OR auth.uid() = participant_two);

CREATE POLICY "Authenticated users can create conversations" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = participant_one OR auth.uid() = participant_two);

-- Create messages table
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in own conversations" ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in own conversations" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
    )
  );

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Trigger to update conversations.updated_at when a message is sent
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_timestamp();
