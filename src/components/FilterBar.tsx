import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import BrandInput from '@/components/BrandInput';
import { CATEGORIES, CONDITIONS, type ListingFilters } from '@/types/listing';

interface Props {
  filters: ListingFilters;
  onChange: (filters: ListingFilters) => void;
}

const FilterBar = ({ filters, onChange }: Props) => {
  const update = (key: keyof ListingFilters, value: string) =>
    onChange({ ...filters, [key]: value });

  const hasFilters = filters.category || filters.condition || filters.brand || filters.minPrice || filters.maxPrice;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search gear..."
          className="pl-9"
          value={filters.search}
          onChange={(e) => update('search', e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Select value={filters.category || undefined} onValueChange={(v) => update('category', v)}>
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.condition || undefined} onValueChange={(v) => update('condition', v)}>
          <SelectTrigger className="w-[130px] h-9 text-sm">
            <SelectValue placeholder="Condition" />
          </SelectTrigger>
          <SelectContent>
            {CONDITIONS.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <BrandInput
          value={filters.brand}
          onChange={(v) => update('brand', v)}
          placeholder="Brand"
          className="w-[120px] h-9 text-sm"
        />

        <Input
          type="number"
          placeholder="Min $"
          className="w-[90px] h-9 text-sm"
          value={filters.minPrice}
          onChange={(e) => update('minPrice', e.target.value)}
        />
        <Input
          type="number"
          placeholder="Max $"
          className="w-[90px] h-9 text-sm"
          value={filters.maxPrice}
          onChange={(e) => update('maxPrice', e.target.value)}
        />

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-sm text-muted-foreground"
            onClick={() => onChange({ category: '', brand: '', condition: '', minPrice: '', maxPrice: '', search: filters.search })}
          >
            <X className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
