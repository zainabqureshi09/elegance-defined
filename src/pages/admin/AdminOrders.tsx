import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/shop';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders(data ?? []);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!openId) return;
    supabase.from('order_items').select('*').eq('order_id', openId).then(({ data }) => setItems(data ?? []));
  }, [openId]);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Status updated');
    load();
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const open = orders.find(o => o.id === openId);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <p className="eyebrow">Fulfilment</p>
        <h1 className="font-display text-4xl mt-1">Orders</h1>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', ...statuses].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn('text-xs uppercase tracking-luxe px-4 py-2 border',
              filter === s ? 'bg-foreground text-background border-foreground' : 'border-border')}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-background border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3">Order</th>
              <th className="text-left p-3">Customer</th>
              <th className="text-left p-3">Total</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id} className="border-t border-border hover:bg-muted/30 cursor-pointer" onClick={() => setOpenId(o.id)}>
                <td className="p-3 font-mono text-xs">#{o.id.slice(0, 8)}</td>
                <td className="p-3">{o.shipping_name}<br /><span className="text-xs text-muted-foreground">{o.shipping_phone}</span></td>
                <td className="p-3">{formatPrice(Number(o.total))}</td>
                <td className="p-3">
                  <select
                    value={o.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setStatus(o.id, e.target.value)}
                    className="text-xs uppercase tracking-luxe border border-border bg-background px-2 py-1"
                  >
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="p-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="p-10 text-center text-muted-foreground">No orders.</p>}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end md:items-center justify-center p-0 md:p-5" onClick={() => setOpenId(null)}>
          <div className="bg-background w-full max-w-2xl max-h-[95vh] overflow-y-auto p-8 shadow-luxe" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-5">
              <div>
                <p className="eyebrow">Order #{open.id.slice(0, 8)}</p>
                <h2 className="font-display text-3xl mt-1">{open.shipping_name}</h2>
              </div>
              <button onClick={() => setOpenId(null)}>✕</button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-sm mb-6">
              <div><p className="eyebrow">Phone</p><p>{open.shipping_phone}</p></div>
              <div><p className="eyebrow">Payment</p><p className="uppercase">{open.payment_method}</p></div>
              <div className="sm:col-span-2"><p className="eyebrow">Address</p><p>{open.shipping_address}, {open.shipping_city}, {open.shipping_country}</p></div>
              {open.notes && <div className="sm:col-span-2"><p className="eyebrow">Notes</p><p className="italic">{open.notes}</p></div>}
            </div>
            <div className="space-y-3 border-t border-border pt-4">
              {items.map(it => (
                <div key={it.id} className="flex justify-between text-sm">
                  <span>{it.product_name} <span className="text-muted-foreground">· {it.size} · ×{it.quantity}</span></span>
                  <span>{formatPrice(Number(it.price) * it.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border mt-4 pt-4 flex justify-between font-display text-xl">
              <span>Total</span>
              <span>{formatPrice(Number(open.total))}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
