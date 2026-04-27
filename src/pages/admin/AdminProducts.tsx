import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { formatPrice, resolveImage } from '@/lib/shop';
import { toast } from 'sonner';

type ProductRow = any;

const empty = {
  name: '', slug: '', description: '', fabric: '',
  price: 0, sale_price: null as number | null,
  images: '/src/assets/product-1.jpg',
  sizes: 'S,M,L,XL', colors: '',
  stock: 10, low_stock_threshold: 5,
  featured: false, trending: false, category_id: null as string | null,
};

export const AdminProducts = () => {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const load = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts(data ?? []);
  };

  useEffect(() => {
    load();
    supabase.from('categories').select('id,name').then(({ data }) => setCategories(data ?? []));
  }, []);

  const startCreate = () => { setEditing({ ...empty }); setCreating(true); };
  const startEdit = (p: ProductRow) => {
    setEditing({
      ...p,
      images: (p.images || []).join(','),
      sizes: (p.sizes || []).join(','),
      colors: (p.colors || []).join(','),
    });
    setCreating(false);
  };

  const save = async () => {
    if (!editing) return;
    const payload = {
      name: editing.name,
      slug: editing.slug || editing.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: editing.description,
      fabric: editing.fabric,
      price: Number(editing.price) || 0,
      sale_price: editing.sale_price ? Number(editing.sale_price) : null,
      images: String(editing.images).split(',').map((s: string) => s.trim()).filter(Boolean),
      sizes: String(editing.sizes).split(',').map((s: string) => s.trim()).filter(Boolean),
      colors: String(editing.colors).split(',').map((s: string) => s.trim()).filter(Boolean),
      stock: Number(editing.stock) || 0,
      low_stock_threshold: Number(editing.low_stock_threshold) || 5,
      featured: !!editing.featured,
      trending: !!editing.trending,
      category_id: editing.category_id || null,
    };
    if (creating) {
      const { error } = await supabase.from('products').insert(payload);
      if (error) return toast.error(error.message);
      toast.success('Product created');
    } else {
      const { error } = await supabase.from('products').update(payload).eq('id', editing.id);
      if (error) return toast.error(error.message);
      toast.success('Product updated');
    }
    setEditing(null);
    setCreating(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    load();
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Inventory</p>
          <h1 className="font-display text-4xl mt-1">Products</h1>
        </div>
        <Button onClick={startCreate} className="rounded-none"><Plus className="h-4 w-4 mr-2" />New product</Button>
      </div>

      <div className="bg-background border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Product</th>
              <th className="text-left p-3 font-medium">Price</th>
              <th className="text-left p-3 font-medium">Stock</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3 flex items-center gap-3 min-w-[260px]">
                  <img src={resolveImage(p.images?.[0])} alt={p.name} className="w-10 h-12 object-cover bg-muted" />
                  <div className="truncate">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.fabric}</p>
                  </div>
                </td>
                <td className="p-3">{formatPrice(p.sale_price ?? p.price)}</td>
                <td className="p-3">
                  <span className={p.stock <= (p.low_stock_threshold ?? 5) ? 'text-accent' : ''}>{p.stock}</span>
                </td>
                <td className="p-3 space-x-1">
                  {p.featured && <span className="text-[10px] uppercase tracking-luxe bg-primary text-primary-foreground px-2 py-0.5">Featured</span>}
                  {p.trending && <span className="text-[10px] uppercase tracking-luxe bg-accent text-accent-foreground px-2 py-0.5">Trending</span>}
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button onClick={() => startEdit(p)} className="p-2 hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(p.id)} className="p-2 hover:bg-muted text-destructive"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end md:items-center justify-center p-0 md:p-5" onClick={() => setEditing(null)}>
          <div className="bg-background w-full max-w-2xl max-h-[95vh] overflow-y-auto p-6 md:p-8 shadow-luxe" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-display text-2xl">{creating ? 'New product' : 'Edit product'}</h2>
              <button onClick={() => setEditing(null)} aria-label="Close"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><Label>Name</Label><Input value={editing.name ?? ''} onChange={e => setEditing({ ...editing, name: e.target.value })} className="rounded-none mt-1" /></div>
              <div><Label>Slug</Label><Input value={editing.slug ?? ''} onChange={e => setEditing({ ...editing, slug: e.target.value })} className="rounded-none mt-1" /></div>
              <div><Label>Fabric</Label><Input value={editing.fabric ?? ''} onChange={e => setEditing({ ...editing, fabric: e.target.value })} className="rounded-none mt-1" /></div>
              <div><Label>Price (PKR)</Label><Input type="number" value={editing.price ?? 0} onChange={e => setEditing({ ...editing, price: e.target.value })} className="rounded-none mt-1" /></div>
              <div><Label>Sale price</Label><Input type="number" value={editing.sale_price ?? ''} onChange={e => setEditing({ ...editing, sale_price: e.target.value || null })} className="rounded-none mt-1" /></div>
              <div><Label>Stock</Label><Input type="number" value={editing.stock ?? 0} onChange={e => setEditing({ ...editing, stock: e.target.value })} className="rounded-none mt-1" /></div>
              <div><Label>Low stock threshold</Label><Input type="number" value={editing.low_stock_threshold ?? 5} onChange={e => setEditing({ ...editing, low_stock_threshold: e.target.value })} className="rounded-none mt-1" /></div>
              <div><Label>Category</Label>
                <select value={editing.category_id ?? ''} onChange={e => setEditing({ ...editing, category_id: e.target.value || null })} className="w-full mt-1 h-10 border border-input bg-background px-3 text-sm">
                  <option value="">— none —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><Label>Sizes (comma-sep)</Label><Input value={editing.sizes ?? ''} onChange={e => setEditing({ ...editing, sizes: e.target.value })} className="rounded-none mt-1" /></div>
              <div className="sm:col-span-2"><Label>Image URLs (comma-sep)</Label><Input value={editing.images ?? ''} onChange={e => setEditing({ ...editing, images: e.target.value })} className="rounded-none mt-1" /></div>
              <div className="sm:col-span-2"><Label>Description</Label><Textarea value={editing.description ?? ''} onChange={e => setEditing({ ...editing, description: e.target.value })} className="rounded-none mt-1" rows={3} /></div>
              <div className="flex items-center gap-2"><Switch checked={!!editing.featured} onCheckedChange={(v) => setEditing({ ...editing, featured: v })} /><Label>Featured</Label></div>
              <div className="flex items-center gap-2"><Switch checked={!!editing.trending} onCheckedChange={(v) => setEditing({ ...editing, trending: v })} /><Label>Trending</Label></div>
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
