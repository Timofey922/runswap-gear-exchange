import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Listing, ListingFilters } from '@/types/listing';

export function useListings(filters: ListingFilters) {
  return useQuery({
    queryKey: ['listings', filters],
    queryFn: async (): Promise<Listing[]> => {
      let query = supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.category) query = query.eq('category', filters.category);
      if (filters.brand) query = query.ilike('brand', `%${filters.brand}%`);
      if (filters.condition) query = query.eq('condition', filters.condition);
      if (filters.minPrice) query = query.gte('price', parseFloat(filters.minPrice));
      if (filters.maxPrice) query = query.lte('price', parseFloat(filters.maxPrice));
      if (filters.search) query = query.or(`title.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return (data as Listing[]) ?? [];
    },
  });
}
