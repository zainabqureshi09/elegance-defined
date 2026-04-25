import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useWishlist = () => {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setIds(new Set());
      return;
    }
    const { data } = await supabase.from('wishlists').select('product_id').eq('user_id', user.id);
    setIds(new Set((data ?? []).map(d => d.product_id)));
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const toggle = async (productId: string) => {
    if (!user) {
      toast.error('Please sign in', { description: 'Create an account to save favourites.' });
      return;
    }
    setLoading(true);
    if (ids.has(productId)) {
      await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', productId);
      setIds(prev => { const n = new Set(prev); n.delete(productId); return n; });
    } else {
      await supabase.from('wishlists').insert({ user_id: user.id, product_id: productId });
      setIds(prev => new Set(prev).add(productId));
      toast.success('Saved to wishlist');
    }
    setLoading(false);
  };

  return { ids, has: (id: string) => ids.has(id), toggle, loading };
};
