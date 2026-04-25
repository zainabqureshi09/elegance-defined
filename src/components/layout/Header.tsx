import { Link, NavLink } from 'react-router-dom';
import { Heart, Search, ShoppingBag, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/shop', label: 'Shop All' },
  { to: '/shop?category=lawn', label: 'Lawn' },
  { to: '/shop?category=pret', label: 'Pret' },
  { to: '/shop?category=festive', label: 'Festive' },
  { to: '/shop?category=bridal', label: 'Bridal' },
];

export const Header = () => {
  const { count, setIsOpen } = useCart();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <div className="bg-emerald-grad text-primary-foreground text-xs tracking-luxe uppercase py-2.5 text-center overflow-hidden">
        <div className="animate-fade-in">
          Complimentary shipping on orders over PKR 25,000 · Crafted in Karachi
        </div>
      </div>
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/85 border-b border-border">
        <div className="container-luxe flex items-center justify-between h-16 md:h-20">
          <button
            className="md:hidden p-2 -ml-2"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <nav className="hidden md:flex items-center gap-8 flex-1">
            {navItems.map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `text-xs uppercase tracking-luxe transition-colors hover:text-primary ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <Link to="/" className="font-display text-2xl md:text-3xl tracking-tight absolute left-1/2 -translate-x-1/2">
            Noor <span className="text-accent">&</span> Co.
          </Link>

          <div className="flex items-center gap-1 md:gap-2 flex-1 justify-end">
            <Button variant="ghost" size="icon" aria-label="Search" className="hidden md:inline-flex">
              <Search className="h-4 w-4" />
            </Button>
            <Link to={user ? '/account' : '/auth'} aria-label="Account">
              <Button variant="ghost" size="icon">
                <User className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/wishlist" aria-label="Wishlist" className="hidden md:inline-flex">
              <Button variant="ghost" size="icon">
                <Heart className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)} aria-label="Bag" className="relative">
              <ShoppingBag className="h-4 w-4" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                  {count}
                </span>
              )}
            </Button>
          </div>
        </div>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 bg-background animate-fade-in md:hidden">
            <div className="flex justify-between items-center h-16 px-5 border-b border-border">
              <span className="font-display text-2xl">Noor & Co.</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col p-6 gap-5">
              {navItems.map(n => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm uppercase tracking-luxe py-2 border-b border-border"
                >
                  {n.label}
                </Link>
              ))}
              <Link to="/wishlist" onClick={() => setMobileOpen(false)} className="text-sm uppercase tracking-luxe py-2">
                Wishlist
              </Link>
              <Link to={user ? '/account' : '/auth'} onClick={() => setMobileOpen(false)} className="text-sm uppercase tracking-luxe py-2">
                {user ? 'My Account' : 'Sign In'}
              </Link>
            </nav>
          </div>
        )}
      </header>
    </>
  );
};
