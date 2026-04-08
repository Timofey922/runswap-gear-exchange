import type { Listing } from '@/types/listing';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tag, Footprints, CheckCircle } from 'lucide-react';

const conditionColor: Record<string, string> = {
  new: 'bg-primary/10 text-primary border-primary/20',
  'like-new': 'bg-accent text-accent-foreground',
  good: 'bg-muted text-muted-foreground',
  fair: 'bg-muted text-muted-foreground',
};

const categoryIcon: Record<string, string> = {
  shoes: '👟',
  apparel: '👕',
  watches: '⌚',
  accessories: '🎒',
};

interface Props {
  listing: Listing;
  onClick: () => void;
}

const ListingCard = ({ listing, onClick }: Props) => {
  return (
    <Card
      className={`group cursor-pointer overflow-hidden border transition-all hover:shadow-lg hover:-translate-y-0.5 ${listing.sold ? 'opacity-60 grayscale' : ''}`}
      onClick={onClick}
    >
      <div className="aspect-[4/3] bg-muted flex items-center justify-center text-4xl relative">
        {listing.image_url ? (
          <img src={listing.image_url} alt={listing.title} className="h-full w-full object-cover" />
        ) : (
          <span>{categoryIcon[listing.category] ?? '📦'}</span>
        )}
        {listing.sold && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
            <Badge className="bg-muted-foreground text-background text-sm px-3 py-1">SOLD</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {listing.title}
          </h3>
          <span className="text-base font-bold text-primary whitespace-nowrap">
            ${listing.price.toFixed(0)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{listing.brand}{listing.model ? ` · ${listing.model}` : ''}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${conditionColor[listing.condition] ?? ''}`}>
            {listing.condition}
          </Badge>
          {listing.size && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              <Tag className="h-2.5 w-2.5 mr-0.5" /> {listing.size}
            </Badge>
          )}
          {listing.category === 'shoes' && listing.mileage != null && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              <Footprints className="h-2.5 w-2.5 mr-0.5" /> {listing.mileage} mi
            </Badge>
          )}
          {listing.strava_verified_mileage != null && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
              <CheckCircle className="h-2.5 w-2.5 mr-0.5" /> Strava Verified
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ListingCard;
