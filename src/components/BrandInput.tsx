import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { POPULAR_BRANDS } from '@/types/listing';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const BrandInput = ({ value, onChange, placeholder = 'Brand', className }: Props) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = value.trim()
    ? POPULAR_BRANDS.filter((b) => b.toLowerCase().includes(value.toLowerCase()))
    : POPULAR_BRANDS;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Input
        placeholder={placeholder}
        className={className}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full max-h-48 overflow-auto rounded-md border bg-popover shadow-md">
          {filtered.map((brand) => (
            <button
              key={brand}
              type="button"
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors"
              onMouseDown={() => { onChange(brand); setOpen(false); }}
            >
              {brand}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrandInput;
