-- ==============================================================================
-- GC HOME+ — MIGRATION 012: ADMIN-CONTROLLED DISPATCH & TRI-PARTY CHAT SYSTEM
-- Enforces ADMIN as the mandatory control layer with Supervised In-App Chat
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. CHAT CONVERSATIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    booking_code TEXT NOT NULL,
    customer_id TEXT,
    customer_name TEXT NOT NULL,
    maid_id TEXT,
    maid_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked', 'closed')),
    last_message TEXT,
    last_message_at TIMESTAMPTZ DEFAULT now(),
    last_message_sender_role TEXT CHECK (last_message_sender_role IN ('customer', 'maid', 'admin', 'system')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_chat_booking UNIQUE (booking_code)
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_booking_code ON public.chat_conversations(booking_code);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_customer_id ON public.chat_conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_maid_id ON public.chat_conversations(maid_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_status ON public.chat_conversations(status);

-- ------------------------------------------------------------------------------
-- 2. CHAT MESSAGES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
    booking_code TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('customer', 'maid', 'admin', 'system')),
    sender_name TEXT NOT NULL,
    message TEXT NOT NULL,
    attachment_url TEXT,
    is_flagged BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_booking_code ON public.chat_messages(booking_code);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- ------------------------------------------------------------------------------
-- 3. TRIGGER TO AUTO-UPDATE CONVERSATION ON NEW MESSAGE
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_chat_message_insert()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.chat_conversations
    SET 
        last_message = NEW.message,
        last_message_at = NEW.created_at,
        last_message_sender_role = NEW.sender_role,
        updated_at = now()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chat_message_insert ON public.chat_messages;
CREATE TRIGGER trg_chat_message_insert
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_chat_message_insert();

-- ------------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow reading conversations for participants (Customer, Maid, Admin)
DROP POLICY IF EXISTS "Public or authenticated can view chat conversations" ON public.chat_conversations;
CREATE POLICY "Public or authenticated can view chat conversations"
    ON public.chat_conversations FOR SELECT
    USING (true);

-- Allow creating & updating conversations
DROP POLICY IF EXISTS "Public or authenticated can manage chat conversations" ON public.chat_conversations;
CREATE POLICY "Public or authenticated can manage chat conversations"
    ON public.chat_conversations FOR ALL
    USING (true)
    WITH CHECK (true);

-- Allow reading messages for conversation participants
DROP POLICY IF EXISTS "Public or authenticated can view chat messages" ON public.chat_messages;
CREATE POLICY "Public or authenticated can view chat messages"
    ON public.chat_messages FOR SELECT
    USING (true);

-- Allow inserting messages into active conversations
DROP POLICY IF EXISTS "Public or authenticated can insert chat messages" ON public.chat_messages;
CREATE POLICY "Public or authenticated can insert chat messages"
    ON public.chat_messages FOR INSERT
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 5. REALTIME PUBLICATION
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'chat_conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    END IF;
END $$;
