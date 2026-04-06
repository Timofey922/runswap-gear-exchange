export type Category = 'shoes' | 'apparel' | 'watches' | 'accessories';
export type Condition = 'new' | 'like-new' | 'good' | 'fair';

export interface Listing {
  id: string;
  title: string;
  brand: string;
  model: string | null;
  category: Category;
  size: string | null;
  condition: Condition;
  mileage: number | null;
  price: number;
  description: string | null;
  seller_email: string;
  image_url: string | null;
  created_at: string;
}

export interface ListingFilters {
  category: Category | '';
  brand: string;
  condition: Condition | '';
  minPrice: string;
  maxPrice: string;
  search: string;
}

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'shoes', label: 'Shoes' },
  { value: 'apparel', label: 'Apparel' },
  { value: 'watches', label: 'GPS Watches' },
  { value: 'accessories', label: 'Accessories' },
];

export const CONDITIONS: { value: Condition; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'like-new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
];
