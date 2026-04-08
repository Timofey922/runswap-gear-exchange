import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { useConversations, useMessages, useSendMessage, type Conversation } from '@/hooks/useChat';
import { useProfile } from '@/hooks/useProfile';
import { useMarkRead } from '@/hooks/useUnreadMessages';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageCircle, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const ConversationItem = ({ convo, active, userId }: { convo: Conversation; active: boolean; userId: string }) => {
  const otherId = convo.participant_one === userId ? convo.participant_two : convo.participant_one;
  const { data: profile } = useProfile(otherId);

  return (
    <Link
      to={`/messages/${convo.id}`}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors',
        active && 'bg-accent'
      )}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={profile?.avatar_url ?? undefined} />
        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
          {profile?.display_name?.slice(0, 2).toUpperCase() || '??'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{profile?.display_name || 'User'}</p>
        <p className="text-xs text-muted-foreground">{format(new Date(convo.updated_at), 'MMM d, h:mm a')}</p>
      </div>
    </Link>
  );
};

const ChatView = ({ conversationId }: { conversationId: string }) => {
  const { user } = useAuth();
  const { data: messages, isLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage();
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: conversations } = useConversations();
  const convo = conversations?.find((c) => c.id === conversationId);
  const otherId = convo
    ? convo.participant_one === user?.id ? convo.participant_two : convo.participant_one
    : null;
  const { data: otherProfile } = useProfile(otherId ?? undefined);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setText('');
    await sendMessage.mutateAsync({ conversationId, content: text.trim() });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Chat header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Link to="/messages" className="md:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {otherProfile && (
          <Link to={`/profile/${otherId}`} className="flex items-center gap-3 hover:opacity-80">
            <Avatar className="h-8 w-8">
              <AvatarImage src={otherProfile.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {otherProfile.display_name?.slice(0, 2).toUpperCase() || '??'}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground">{otherProfile.display_name || 'User'}</span>
          </Link>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-3">
          {isLoading && <p className="text-center text-muted-foreground text-sm">Loading...</p>}
          {messages?.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2 text-sm',
                    isMine
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  )}
                >
                  <p>{msg.content}</p>
                  <p className={cn('text-[10px] mt-1', isMine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                    {format(new Date(msg.created_at), 'h:mm a')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!text.trim() || sendMessage.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

const Messages = () => {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: conversations, isLoading } = useConversations();

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className={cn(
          'w-full md:w-80 border-r flex flex-col',
          conversationId && 'hidden md:flex'
        )}>
          <div className="p-4 border-b">
            <h2 className="text-lg font-bold text-foreground">Messages</h2>
          </div>
          <ScrollArea className="flex-1">
            {isLoading ? (
              <p className="text-center text-muted-foreground text-sm py-8">Loading...</p>
            ) : conversations?.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-muted-foreground gap-2">
                <MessageCircle className="h-10 w-10" />
                <p className="text-sm">No conversations yet</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {conversations?.map((c) => (
                  <ConversationItem key={c.id} convo={c} active={c.id === conversationId} userId={user.id} />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat area */}
        <div className={cn('flex-1', !conversationId && 'hidden md:flex md:items-center md:justify-center')}>
          {conversationId ? (
            <ChatView conversationId={conversationId} />
          ) : (
            <div className="text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-3" />
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
