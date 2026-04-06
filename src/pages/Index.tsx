import { useState } from 'react';
import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import ListingCard from '@/components/ListingCard';
import ListingDetail from '@/components/ListingDetail';
import { useListings } from '@/hooks/useListings';
import type { Listing, ListingFilters } from '@/types/listing';
import { Loader2, PackageOpen } from 'lucide-react';

const Index = () => {
  const [filters, setFilters] = useState<ListingFilters>({
    category: '', brand: '', condition: '', minPrice: '', maxPrice: '', search: '',
  });
  const [selected, setSelected] = useState<Listing | null>(null);
  const { data: listings, isLoading } = useListings(filters);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Find Your Next Gear</h1>
          <p className="text-muted-foreground mt-1">Buy and sell quality used running gear</p>
        </div>

        <FilterBar filters={filters} onChange={setFilters} />

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : listings?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <PackageOpen className="h-12 w-12" />
            <p className="text-lg font-medium">No listings found</p>
            <p className="text-sm">Try adjusting your filters or be the first to post!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings?.map((listing) => (
              <ListingCard key={listing.id} listing={listing} onClick={() => setSelected(listing)} />
            ))}
          </div>
        )}
      </main>

      <ListingDetail listing={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default Index;
