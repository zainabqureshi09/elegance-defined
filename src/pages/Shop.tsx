import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/ProductCard';
import { Product } from '@/lib/shop';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal } from 'lucide-react';

type Category = { id: string; name: string; slug: string };

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Popularity' },
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];

const Shop = () => {
  const [params, setParams] = useSearchParams();
  const categorySlug = params.get('category') || '';
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');
  const [maxPrice, setMaxPrice] = useState(200000);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);
  const [sizeFilter, setSizeFilter] = useState<string[]>([]);
  const [fabricFilter, setFabricFilter] = useState<string[]>([]);

  useEffect(() => {
    supabase.from('categories').select('id,name,slug').order('display_order')
      .then(({ data }) => setCategories((data ?? []) as Category[]));
  }, []);

  useEffect(() => {
    setLoading(true);
    let q = supabase.from('products').select('*');
    if (categorySlug) {
      const cat = categories.find(c => c.slug === categorySlug);
      if (cat) q = q.eq('category_id', cat.id);
    }
    q.then(({ data }) => {
      const list = (data ?? []) as Product[];
      const max = Math.max(200000, ...list.map(p => p.price));
      setMaxPrice(max);
      setPriceRange(prev => [prev[0], Math.max(prev[1], max)]);
      setProducts(list);
      setLoading(false);
    });
  }, [categorySlug, categories]);

  const fabrics = useMemo(() => Array.from(new Set(products.map(p => p.fabric).filter(Boolean))) as string[], [products]);

  const visible = useMemo(() => {
    let list = products.filter(p => {
      const price = p.sale_price ?? p.price;
      if (price < priceRange[0] || price > priceRange[1]) return false;
      if (sizeFilter.length && !p.sizes.some(s => sizeFilter.includes(s))) return false;
      if (fabricFilter.length && !fabricFilter.includes(p.fabric ?? '')) return false;
      return true;
    });
    switch (sort) {
      case 'price-asc': list = list.sort((a, b) => (a.sale_price ?? a.price) - (b.sale_price ?? b.price)); break;
      case 'price-desc': list = list.sort((a, b) => (b.sale_price ?? b.price) - (a.sale_price ?? a.price)); break;
      case 'popular': list = list.sort((a, b) => Number(b.trending) - Number(a.trending)); break;
    }
    return list;
  }, [products, priceRange, sizeFilter, fabricFilter, sort]);

  const currentCat = categories.find(c => c.slug === categorySlug);

  const filters = (
    <div className="space-y-8">
      <div>
        <h4 className="eyebrow mb-3">Category</h4>
        <div className="space-y-2">
          <button onClick={() => setParams({})} className={`block text-sm w-full text-left ${!categorySlug ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}>All</button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setParams({ category: c.slug })} className={`block text-sm w-full text-left ${categorySlug === c.slug ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="eyebrow mb-3">Price</h4>
        <Slider min={0} max={maxPrice} step={1000} value={priceRange} onValueChange={(v) => setPriceRange(v as [number, number])} />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>PKR {priceRange[0].toLocaleString()}</span>
          <span>PKR {priceRange[1].toLocaleString()}</span>
        </div>
      </div>

      <div>
        <h4 className="eyebrow mb-3">Size</h4>
        <div className="flex flex-wrap gap-2">
          {SIZES.map(s => {
            const active = sizeFilter.includes(s);
            return (
              <button
                key={s}
                onClick={() => setSizeFilter(prev => active ? prev.filter(x => x !== s) : [...prev, s])}
                className={`px-3 py-1.5 text-xs border transition-colors ${active ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-foreground'}`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {fabrics.length > 0 && (
        <div>
          <h4 className="eyebrow mb-3">Fabric</h4>
          <div className="space-y-2">
            {fabrics.map(f => (
              <label key={f} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={fabricFilter.includes(f)} onCheckedChange={(c) => setFabricFilter(prev => c ? [...prev, f] : prev.filter(x => x !== f))} />
                {f}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <div className="bg-secondary/30 border-b border-border">
        <div className="container-luxe py-12 md:py-16 text-center space-y-3">
          <p className="eyebrow">{currentCat ? 'Collection' : 'Shop'}</p>
          <h1 className="font-display text-4xl md:text-5xl">{currentCat?.name ?? 'The Edit'}</h1>
        </div>
      </div>

      <div className="container-luxe py-10 md:py-14 grid md:grid-cols-[240px_1fr] gap-10">
        <aside className="hidden md:block sticky top-28 self-start">{filters}</aside>

        <div>
          <div className="flex items-center justify-between mb-8">
            <p className="text-sm text-muted-foreground">{visible.length} pieces</p>
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="md:hidden rounded-none">
                    <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader><SheetTitle className="font-display text-2xl">Filters</SheetTitle></SheetHeader>
                  <div className="mt-6">{filters}</div>
                </SheetContent>
              </Sheet>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[180px] rounded-none border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sortOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-10 md:gap-x-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-[3/4] bg-muted animate-pulse" />
                  <div className="h-4 bg-muted animate-pulse w-2/3" />
                  <div className="h-3 bg-muted animate-pulse w-1/3" />
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="text-center py-24">
              <p className="font-display text-2xl">No pieces match your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-14">
              {visible.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Shop;
