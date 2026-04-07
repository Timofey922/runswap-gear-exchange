import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

export interface Conversation {
  id: string;
  listing_id: string | null;
  participant_one: string;
  participant_two: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export const useConversations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as Conversation[];
    },
    enabled: !!user,
  });
};

export const useMessages = (conversationId: string | null) => {
  const qc = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        qc.setQueryData<Message[]>(['messages', conversationId], (old) => [
          ...(old ?? []),
          payload.new as Message,
        ]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, qc]);

  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!conversationId,
  });
};

export const useSendMessage = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('messages')
        .insert({ conversation_id: conversationId, sender_id: user.id, content } as any);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useStartConversation = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ sellerId, listingId }: { sellerId: string; listingId?: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Check existing conversation
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .or(
          `and(participant_one.eq.${user.id},participant_two.eq.${sellerId}),and(participant_one.eq.${sellerId},participant_two.eq.${user.id})`
        )
        .eq('listing_id', listingId ?? '')
        .maybeSingle();

      if (existing) return existing as Conversation;

      // If no listing-specific convo and listingId is provided, also check for one without listing
      if (listingId) {
        const { data: existingDirect } = await supabase
          .from('conversations')
          .select('*')
          .or(
            `and(participant_one.eq.${user.id},participant_two.eq.${sellerId}),and(participant_one.eq.${sellerId},participant_two.eq.${user.id})`
          )
          .is('listing_id', null)
          .maybeSingle();
        if (existingDirect) return existingDirect as Conversation;
      }

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          participant_one: user.id,
          participant_two: sellerId,
          listing_id: listingId ?? null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data as Conversation;
    },
  });
};
