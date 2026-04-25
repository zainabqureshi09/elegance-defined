import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Minus, Plus, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice } from '@/lib/shop';

export const CartDrawer = () => {
  const { items, isOpen, setIsOpen, updateQty, removeItem, subtotal } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-6 py-5 border-b border-border">
          <SheetTitle className="font-display text-2xl">Your Bag ({items.length})</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-4">
            <p className="font-display text-2xl">Your bag is empty</p>
            <p className="text-sm text-muted-foreground">Discover our latest arrivals.</p>
            <Button asChild onClick={() => setIsOpen(false)} className="mt-2">
              <Link to="/shop">Shop the edit</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {items.map(i => (
                <div key={`${i.id}-${i.size}`} className="flex gap-4">
                  <Link to={`/product/${i.slug}`} onClick={() => setIsOpen(false)} className="shrink-0">
                    <img src={i.image} alt={i.name} className="w-20 h-24 object-cover bg-muted" loading="lazy" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <Link to={`/product/${i.slug}`} onClick={() => setIsOpen(false)} className="font-display text-base leading-tight hover:text-primary">{i.name}</Link>
                      <button onClick={() => removeItem(i.id, i.size)} aria-label="Remove"><X className="h-4 w-4 text-muted-foreground hover:text-foreground" /></button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Size {i.size}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-border">
                        <button onClick={() => updateQty(i.id, i.size, i.quantity - 1)} className="p-1.5 hover:bg-muted" aria-label="Decrease"><Minus className="h-3 w-3" /></button>
                        <span className="px-3 text-sm">{i.quantity}</span>
                        <button onClick={() => updateQty(i.id, i.size, i.quantity + 1)} className="p-1.5 hover:bg-muted" aria-label="Increase"><Plus className="h-3 w-3" /></button>
                      </div>
                      <span className="text-sm font-medium">{formatPrice(i.price * i.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border px-6 py-5 space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-sm uppercase tracking-luxe">Subtotal</span>
                <span className="font-display text-2xl">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Shipping calculated at checkout.</p>
              <Button asChild className="w-full" size="lg" onClick={() => setIsOpen(false)}>
                <Link to="/checkout">Checkout</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
