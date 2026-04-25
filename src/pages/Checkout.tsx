import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { formatPrice } from '@/lib/shop';
import { toast } from 'sonner';

const schema = z.object({
  shipping_name: z.string().trim().min(2).max(100),
  shipping_phone: z.string().trim().min(7).max(20),
  shipping_address: z.string().trim().min(5).max(300),
  shipping_city: z.string().trim().min(2).max(80),
  shipping_country: z.string().trim().min(2).max(80),
  notes: z.string().max(500).optional(),
  payment_method: z.enum(['cod', 'card']),
});

const Checkout = () => {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const shipping = subtotal > 25000 || subtotal === 0 ? 0 : 500;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="container-luxe py-32 text-center space-y-4">
          <h1 className="font-display text-4xl">Your bag is empty.</h1>
          <Button asChild className="rounded-none"><Link to="/shop">Shop the edit</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());
    const parsed = schema.safeParse(data);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    const orderPayload: any = {
      user_id: user?.id ?? null,
      total,
      ...parsed.data,
    };
    const { data: order, error } = await supabase.from('orders').insert(orderPayload).select('id').single();

    if (error || !order) { toast.error('Could not place order'); setBusy(false); return; }

    const { error: itemsErr } = await supabase.from('order_items').insert(
      items.map(i => ({
        order_id: order.id,
        product_id: i.id,
        product_name: i.name,
        size: i.size,
        quantity: i.quantity,
        price: i.price,
      }))
    );
    setBusy(false);
    if (itemsErr) { toast.error('Order saved but items failed'); return; }
    toast.success('Order placed', { description: `Order #${order.id.slice(0, 8)}` });
    clear();
    nav('/account?tab=orders');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="container-luxe py-12 md:py-16">
        <div className="text-center mb-10 md:mb-14">
          <p className="eyebrow">Checkout</p>
          <h1 className="font-display text-4xl md:text-5xl mt-2">Almost yours.</h1>
        </div>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_400px] gap-12">
          <div className="space-y-10">
            {!user && (
              <div className="bg-secondary/40 p-5 text-sm flex justify-between items-center">
                <span>Have an account? <Link to="/auth" className="underline">Sign in</Link></span>
                <span className="text-muted-foreground text-xs">Guest checkout enabled</span>
              </div>
            )}

            <div>
              <h2 className="font-display text-2xl mb-5">Shipping</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2"><Label htmlFor="n">Full Name</Label><Input id="n" name="shipping_name" required defaultValue={user?.user_metadata?.full_name ?? ''} className="mt-2 rounded-none" /></div>
                <div><Label htmlFor="ph">Phone</Label><Input id="ph" name="shipping_phone" required className="mt-2 rounded-none" /></div>
                <div><Label htmlFor="ci">City</Label><Input id="ci" name="shipping_city" required className="mt-2 rounded-none" /></div>
                <div className="sm:col-span-2"><Label htmlFor="ad">Address</Label><Input id="ad" name="shipping_address" required className="mt-2 rounded-none" /></div>
                <div className="sm:col-span-2"><Label htmlFor="co">Country</Label><Input id="co" name="shipping_country" required defaultValue="Pakistan" className="mt-2 rounded-none" /></div>
                <div className="sm:col-span-2"><Label htmlFor="nt">Order notes (optional)</Label><Textarea id="nt" name="notes" className="mt-2 rounded-none" /></div>
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl mb-5">Payment</h2>
              <RadioGroup defaultValue="cod" name="payment_method" className="space-y-3">
                <label className="flex items-center gap-3 border border-border p-4 cursor-pointer hover:border-foreground/40">
                  <RadioGroupItem value="cod" id="cod" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Cash on Delivery</p>
                    <p className="text-xs text-muted-foreground">Pay in cash when your order arrives.</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 border border-border p-4 cursor-pointer hover:border-foreground/40">
                  <RadioGroupItem value="card" id="card" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Credit / Debit Card</p>
                    <p className="text-xs text-muted-foreground">Secure card processing (demo only).</p>
                  </div>
                </label>
              </RadioGroup>
            </div>
          </div>

          <aside className="bg-secondary/40 p-6 lg:p-8 h-fit lg:sticky lg:top-28 space-y-5">
            <h3 className="font-display text-xl">Order summary</h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {items.map(i => (
                <div key={`${i.id}-${i.size}`} className="flex gap-3">
                  <img src={i.image} alt={i.name} className="w-14 h-16 object-cover bg-muted" loading="lazy" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium leading-tight">{i.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{i.size} · Qty {i.quantity}</p>
                  </div>
                  <span className="text-sm">{formatPrice(i.price * i.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm border-t border-border pt-4">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span></div>
              <div className="flex justify-between font-display text-xl pt-3 border-t border-border"><span>Total</span><span>{formatPrice(total)}</span></div>
            </div>
            <Button type="submit" disabled={busy} size="lg" className="w-full rounded-none h-12">{busy ? 'Placing order…' : 'Place order'}</Button>
            <p className="text-[11px] text-muted-foreground text-center">By placing this order you agree to our terms.</p>
          </aside>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;
