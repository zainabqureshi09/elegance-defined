import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

export const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);

  const load = async () => {
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    setCoupons(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const payload = {
      code: editing.code.toUpperCase(),
      description: editing.description ?? null,
      discount_type: editing.discount_type,
      discount_value: Number(editing.discount_value) || 0,
      min_subtotal: Number(editing.min_subtotal) || 0,
      max_uses: editing.max_uses ? Number(editing.max_uses) : null,
      expires_at: editing.expires_at || null,
      active: !!editing.active,
    };
    const { error } = editing.id
      ? await supabase.from('coupons').update(payload).eq('id', editing.id)
      : await supabase.from('coupons').insert(payload);
    if (error) return toast.error(error.message);
    toast.success('Saved');
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete coupon?')) return;
    await supabase.from('coupons').delete().eq('id', id);
    load();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Promotions</p>
          <h1 className="font-display text-4xl mt-1">Coupons</h1>
        </div>
        <Button onClick={() => setEditing({ code: '', discount_type: 'percent', discount_value: 10, min_subtotal: 0, active: true })} className="rounded-none">
          <Plus className="h-4 w-4 mr-2" />New coupon
        </Button>
      </div>

      <div className="bg-background border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3">Code</th>
              <th className="text-left p-3">Discount</th>
              <th className="text-left p-3">Min</th>
              <th className="text-left p-3">Uses</th>
              <th className="text-left p-3">Expires</th>
              <th className="text-left p-3">Active</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(c => (
              <tr key={c.id} className="border-t border-border hover:bg-muted/30 cursor-pointer" onClick={() => setEditing({ ...c, expires_at: c.expires_at?.slice(0, 10) ?? '' })}>
                <td className="p-3 font-mono">{c.code}</td>
                <td className="p-3">{c.discount_type === 'percent' ? `${c.discount_value}%` : `PKR ${c.discount_value}`}</td>
                <td className="p-3">PKR {c.min_subtotal}</td>
                <td className="p-3">{c.uses_count}{c.max_uses ? ` / ${c.max_uses}` : ''}</td>
                <td className="p-3 text-xs">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '—'}</td>
                <td className="p-3">{c.active ? '✓' : '—'}</td>
                <td className="p-3"><button onClick={(e) => { e.stopPropagation(); remove(c.id); }} className="p-2 text-destructive"><Trash2 className="h-4 w-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {coupons.length === 0 && <p className="p-10 text-center text-muted-foreground">No coupons yet.</p>}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end md:items-center justify-center p-0 md:p-5" onClick={() => setEditing(null)}>
          <div className="bg-background w-full max-w-lg max-h-[95vh] overflow-y-auto p-8 shadow-luxe" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-display text-2xl">{editing.id ? 'Edit coupon' : 'New coupon'}</h2>
              <button onClick={() => setEditing(null)}><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div><Label>Code</Label><Input value={editing.code ?? ''} onChange={e => setEditing({ ...editing, code: e.target.value.toUpperCase() })} className="rounded-none mt-1 font-mono" /></div>
              <div><Label>Description</Label><Input value={editing.description ?? ''} onChange={e => setEditing({ ...editing, description: e.target.value })} className="rounded-none mt-1" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Type</Label>
                  <select value={editing.discount_type} onChange={e => setEditing({ ...editing, discount_type: e.target.value })} className="w-full mt-1 h-10 border border-input bg-background px-3 text-sm">
                    <option value="percent">Percent</option>
                    <option value="fixed">Fixed (PKR)</option>
                  </select>
                </div>
                <div><Label>Value</Label><Input type="number" value={editing.discount_value} onChange={e => setEditing({ ...editing, discount_value: e.target.value })} className="rounded-none mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Min subtotal</Label><Input type="number" value={editing.min_subtotal ?? 0} onChange={e => setEditing({ ...editing, min_subtotal: e.target.value })} className="rounded-none mt-1" /></div>
                <div><Label>Max uses</Label><Input type="number" value={editing.max_uses ?? ''} onChange={e => setEditing({ ...editing, max_uses: e.target.value })} className="rounded-none mt-1" /></div>
              </div>
              <div><Label>Expires</Label><Input type="date" value={editing.expires_at ?? ''} onChange={e => setEditing({ ...editing, expires_at: e.target.value })} className="rounded-none mt-1" /></div>
              <div className="flex items-center gap-2"><Switch checked={!!editing.active} onCheckedChange={(v) => setEditing({ ...editing, active: v })} /><Label>Active</Label></div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={save} className="rounded-none flex-1">Save</Button>
              <Button onClick={() => setEditing(null)} variant="outline" className="rounded-none">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
