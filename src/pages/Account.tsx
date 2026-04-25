import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatPrice } from '@/lib/shop';

type Order = {
  id: string;
  status: string;
  total: number;
  payment_method: string;
  created_at: string;
  shipping_city: string;
};

const Account = () => {
  const { user, loading, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<{ full_name: string | null; phone: string | null } | null>(null);
  const [params] = useSearchParams();
  const tab = params.get('tab') ?? 'orders';

  useEffect(() => {
    if (!user) return;
    supabase.from('orders').select('id,status,total,payment_method,created_at,shipping_city').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setOrders((data ?? []) as Order[]));
    supabase.from('profiles').select('full_name,phone').eq('id', user.id).maybeSingle()
      .then(({ data }) => setProfile(data as any));
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="bg-secondary/30 border-b border-border">
        <div className="container-luxe py-12 md:py-16">
          <p className="eyebrow">My Account</p>
          <h1 className="font-display text-4xl md:text-5xl mt-2">Hello, {profile?.full_name?.split(' ')[0] ?? 'friend'}.</h1>
        </div>
      </div>
      <div className="container-luxe py-12 md:py-16 flex-1">
        <Tabs defaultValue={tab}>
          <TabsList className="bg-transparent border-b border-border w-full justify-start rounded-none h-auto p-0">
            <TabsTrigger value="orders" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none uppercase tracking-luxe text-xs py-3 px-5">Orders</TabsTrigger>
            <TabsTrigger value="profile" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none uppercase tracking-luxe text-xs py-3 px-5">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-10">
            {orders.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <p className="font-display text-2xl">No orders yet</p>
                <Button asChild className="rounded-none"><Link to="/shop">Begin shopping</Link></Button>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(o => (
                  <div key={o.id} className="border border-border p-5 flex flex-wrap items-center gap-4 justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-luxe text-muted-foreground">Order #{o.id.slice(0, 8)}</p>
                      <p className="font-display text-xl mt-1">{formatPrice(Number(o.total))}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(o.created_at).toLocaleDateString()} · {o.shipping_city} · {o.payment_method.toUpperCase()}</p>
                    </div>
                    <span className="px-3 py-1 bg-secondary text-xs uppercase tracking-luxe">{o.status}</span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="profile" className="mt-10 max-w-md">
            <div className="space-y-4 text-sm">
              <div><p className="eyebrow mb-1">Email</p><p>{user.email}</p></div>
              <div><p className="eyebrow mb-1">Name</p><p>{profile?.full_name ?? '—'}</p></div>
              <div><p className="eyebrow mb-1">Phone</p><p>{profile?.phone ?? '—'}</p></div>
              <Button onClick={signOut} variant="outline" className="rounded-none mt-6">Sign out</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default Account;
