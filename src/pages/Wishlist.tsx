import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/ProductCard';
import { Product } from '@/lib/shop';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

const Wishlist = () => {
  const { user, loading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: w } = await supabase.from('wishlists').select('product_id').eq('user_id', user.id);
      const ids = (w ?? []).map(x => x.product_id);
      if (ids.length === 0) { setProducts([]); return; }
      const { data } = await supabase.from('products').select('*').in('id', ids);
      setProducts((data ?? []) as Product[]);
    })();
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="bg-secondary/30 border-b border-border">
        <div className="container-luxe py-12 md:py-16 text-center space-y-3">
          <p className="eyebrow">Saved</p>
          <h1 className="font-display text-4xl md:text-5xl">Wishlist</h1>
        </div>
      </div>
      <div className="container-luxe py-12 md:py-16 flex-1">
        {loading ? null : !user ? (
          <div className="text-center py-20 space-y-4">
            <Heart className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="font-display text-2xl">Sign in to save favourites</p>
            <Button asChild className="rounded-none"><Link to="/auth">Sign in</Link></Button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <Heart className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="font-display text-2xl">Your wishlist is empty</p>
            <Button asChild className="rounded-none"><Link to="/shop">Discover pieces</Link></Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6">
            {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Wishlist;
