import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useUnreadCount = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unread-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;

      // Get all conversations
      const { data: convos } = await supabase
        .from('conversations')
        .select('id, updated_at')
        .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`);

      if (!convos?.length) return 0;

      // Get read timestamps
      const { data: reads } = await supabase
        .from('conversation_reads')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id);

      const readMap = new Map(reads?.map((r: any) => [r.conversation_id, r.last_read_at]) ?? []);

      // Count conversations with messages newer than last read
      let unread = 0;
      for (const convo of convos) {
        const lastRead = readMap.get(convo.id);
        if (!lastRead || new Date(convo.updated_at) > new Date(lastRead)) {
          // Check if there are actually messages from others
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', convo.id)
            .neq('sender_id', user.id)
            .gt('created_at', lastRead || '1970-01-01');
          if (count && count > 0) unread++;
        }
      }

      return unread;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
};

export const useMarkRead = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (!user) return;
      const { error } = await supabase
        .from('conversation_reads')
        .upsert(
          { user_id: user.id, conversation_id: conversationId, last_read_at: new Date().toISOString() } as any,
          { onConflict: 'user_id,conversation_id' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
};
