import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/shop';
import { Package, ShoppingBag, TrendingUp, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts';

type DayPoint = { day: string; revenue: number; orders: number };

export const AdminOverview = () => {
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    products: 0,
    abandoned: 0,
    lowStock: [] as { id: string; name: string; stock: number }[],
    series: [] as DayPoint[],
    topViewed: [] as { id: string; name: string; views_count: number; slug: string }[],
  });

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const [orders, productsCount, abandoned, lowStock, topViewed] = await Promise.all([
        supabase.from('orders').select('total, created_at, status'),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('abandoned_carts').select('id', { count: 'exact', head: true }).gte('created_at', since),
        supabase.from('products').select('id, name, stock, low_stock_threshold').order('stock', { ascending: true }).limit(8),
        supabase.from('products').select('id, name, slug, views_count').order('views_count', { ascending: false }).limit(5),
      ]);

      const allOrders = orders.data ?? [];
      const revenue = allOrders.reduce((s, o: any) => s + Number(o.total || 0), 0);

      // Last 14 days
      const buckets: Record<string, DayPoint> = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().slice(5, 10);
        buckets[key] = { day: key, revenue: 0, orders: 0 };
      }
      for (const o of allOrders as any[]) {
        const key = (o.created_at || '').slice(5, 10);
        if (buckets[key]) {
          buckets[key].revenue += Number(o.total || 0);
          buckets[key].orders += 1;
        }
      }

      setStats({
        revenue,
        orders: allOrders.length,
        products: productsCount.count ?? 0,
        abandoned: abandoned.count ?? 0,
        lowStock: (lowStock.data ?? []).filter((p: any) => p.stock <= (p.low_stock_threshold ?? 5)) as any,
        series: Object.values(buckets),
        topViewed: (topViewed.data ?? []) as any,
      });
    })();
  }, []);

  const cards = [
    { label: 'Revenue (all time)', value: formatPrice(stats.revenue), icon: TrendingUp },
    { label: 'Orders', value: String(stats.orders), icon: ShoppingBag },
    { label: 'Products', value: String(stats.products), icon: Package },
    { label: 'Abandoned (30d)', value: String(stats.abandoned), icon: AlertCircle },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <p className="eyebrow">Dashboard</p>
        <h1 className="font-display text-4xl mt-1">Welcome back.</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-background p-5 border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="eyebrow">{c.label}</span>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="font-display text-2xl md:text-3xl">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-background p-6 border border-border">
        <h3 className="font-display text-2xl mb-1">Revenue · last 14 days</h3>
        <p className="eyebrow mb-6">Daily totals</p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={stats.series}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
            <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-background p-6 border border-border">
          <h3 className="font-display text-xl mb-4">Low stock alerts</h3>
          {stats.lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">All products well stocked.</p>
          ) : (
            <ul className="space-y-2">
              {stats.lowStock.map(p => (
                <li key={p.id} className="flex justify-between text-sm py-1.5 border-b border-border last:border-0">
                  <span className="truncate pr-3">{p.name}</span>
                  <span className={p.stock === 0 ? 'text-destructive' : 'text-accent'}>{p.stock} left</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-background p-6 border border-border">
          <h3 className="font-display text-xl mb-4">Most viewed</h3>
          {stats.topViewed.length === 0 ? (
            <p className="text-sm text-muted-foreground">No views yet.</p>
          ) : (
            <ul className="space-y-2">
              {stats.topViewed.map((p: any) => (
                <li key={p.id} className="flex justify-between text-sm py-1.5 border-b border-border last:border-0">
                  <span className="truncate pr-3">{p.name}</span>
                  <span className="text-muted-foreground">{p.views_count} views</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
