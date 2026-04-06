import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">RS</span>
          </div>
          <span className="text-xl font-bold text-foreground">RunSwap</span>
        </Link>
        <Link to="/sell">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Sell Gear
          </Button>
        </Link>
      </div>
    </header>
  );
};

export default Header;
