import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, User, LogOut, List, MessageCircle, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadCount } from '@/hooks/useUnreadMessages';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Header = () => {
  const { user, signOut } = useAuth();
  const { data: unreadCount } = useUnreadCount();

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">PM</span>
          </div>
          <span className="text-xl font-bold text-foreground">PaceMarket</span>
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/messages">
                <Button variant="ghost" size="icon" className="rounded-full relative">
                  <MessageCircle className="h-4 w-4" />
                  {unreadCount && unreadCount > 0 ? (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  ) : null}
                </Button>
              </Link>
              <Link to="/sell">
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" /> Sell Gear
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-xs text-muted-foreground truncate max-w-[200px]">
                    {user.email}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="gap-2 cursor-pointer">
                      <User className="h-4 w-4" /> My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-listings" className="gap-2 cursor-pointer">
                      <List className="h-4 w-4" /> My Listings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/messages" className="gap-2 cursor-pointer">
                      <MessageCircle className="h-4 w-4" /> My Messages
                      {unreadCount && unreadCount > 0 ? (
                        <span className="ml-auto text-[10px] bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5">
                          {unreadCount}
                        </span>
                      ) : null}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/recommendations" className="gap-2 cursor-pointer">
                      <Zap className="h-4 w-4" /> AI Recommendations
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="gap-2 cursor-pointer text-destructive">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm" variant="outline">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
