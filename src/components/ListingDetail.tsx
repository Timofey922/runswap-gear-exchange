import { useNavigate } from 'react-router-dom';
import type { Listing } from '@/types/listing';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, Tag, Footprints, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useStartConversation } from '@/hooks/useChat';
import { toast } from 'sonner';

const categoryIcon: Record<string, string> = {
  shoes: '👟', apparel: '👕', watches: '⌚', accessories: '🎒',
};

interface Props {
  listing: Listing | null;
  open: boolean;
  onClose: () => void;
}

const ListingDetail = ({ listing, open, onClose }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const startConvo = useStartConversation();

  if (!listing) return null;

  const isOwner = user?.id === listing.user_id;

  const handleMessage = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!listing.user_id) {
      toast.error('Cannot message this seller');
      return;
    }
    try {
      const convo = await startConvo.mutateAsync({ sellerId: listing.user_id, listingId: listing.id });
      onClose();
      navigate(`/messages/${convo.id}`);
    } catch {
      toast.error('Failed to start conversation');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">{listing.title}</DialogTitle>
        </DialogHeader>

        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-5xl">
          {listing.image_url ? (
            <img src={listing.image_url} alt={listing.title} className="h-full w-full object-cover rounded-lg" />
          ) : (
            <span>{categoryIcon[listing.category] ?? '📦'}</span>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary">${listing.price.toFixed(2)}</span>
            <Badge variant="secondary" className="capitalize">{listing.condition}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div>Brand: <span className="text-foreground font-medium">{listing.brand}</span></div>
            {listing.model && <div>Model: <span className="text-foreground font-medium">{listing.model}</span></div>}
            {listing.size && (
              <div className="flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" /> Size: <span className="text-foreground font-medium">{listing.size}</span>
              </div>
            )}
            {listing.mileage != null && (
              <div className="flex items-center gap-1">
                <Footprints className="h-3.5 w-3.5" /> Mileage: <span className="text-foreground font-medium">{listing.mileage} mi</span>
              </div>
            )}
            <div className="flex items-center gap-1 col-span-2">
              <Clock className="h-3.5 w-3.5" /> Posted {format(new Date(listing.created_at), 'MMM d, yyyy')}
            </div>
          </div>

          {listing.description && (
            <p className="text-sm text-foreground leading-relaxed">{listing.description}</p>
          )}

          {!isOwner && (
            <Button onClick={handleMessage} className="w-full gap-2" disabled={startConvo.isPending}>
              <MessageCircle className="h-4 w-4" /> Message Seller
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ListingDetail;
