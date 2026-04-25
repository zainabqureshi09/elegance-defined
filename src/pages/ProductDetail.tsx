import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Product, formatPrice, resolveImage } from '@/lib/shop';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/hooks/useWishlist';
import { Heart, ChevronLeft, Minus, Plus, Truck, RotateCcw, ShieldCheck, Star } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ProductCard } from '@/components/ProductCard';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [zoom, setZoom] = useState(false);
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();

  useEffect(() => {
    if (!slug) return;
    setProduct(null);
    setSize(null);
    setQty(1);
    supabase.from('products').select('*').eq('slug', slug).maybeSingle()
      .then(({ data }) => {
        const p = data as Product | null;
        setProduct(p);
        if (p?.category_id) {
          supabase.from('products').select('*').eq('category_id', p.category_id).neq('id', p.id).limit(4)
            .then(({ data: r }) => setRelated((r ?? []) as Product[]));
        }
      });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="container-luxe py-32 text-center">
          <div className="animate-pulse space-y-4 max-w-2xl mx-auto">
            <div className="h-96 bg-muted" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const onSale = product.sale_price && product.sale_price < product.price;
  const finalPrice = product.sale_price ?? product.price;
  const wished = has(product.id);

  const handleAdd = () => {
    if (!size) { toast.error('Please select a size'); return; }
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      image: resolveImage(product.images[0]),
      price: finalPrice,
      size,
    }, qty);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <div className="container-luxe pt-6">
        <Link to="/shop" className="inline-flex items-center text-xs uppercase tracking-luxe text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-3 w-3 mr-1" /> Back to shop
        </Link>
      </div>

      <div className="container-luxe py-8 md:py-12 grid md:grid-cols-2 gap-10 md:gap-16">
        <div className="space-y-3">
          <div
            className="relative bg-muted aspect-[3/4] overflow-hidden cursor-zoom-in"
            onClick={() => setZoom(z => !z)}
          >
            <img
              src={resolveImage(product.images[0])}
              alt={product.name}
              width={900}
              height={1152}
              className={cn('w-full h-full object-cover transition-transform duration-700', zoom && 'scale-150 cursor-zoom-out')}
            />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img, i) => (
                <img key={i} src={resolveImage(img)} alt={`view ${i + 1}`} loading="lazy" className="aspect-[3/4] object-cover bg-muted cursor-pointer" />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6 md:pt-8">
          <div>
            <p className="eyebrow">{product.fabric}</p>
            <h1 className="font-display text-4xl md:text-5xl mt-2 leading-tight">{product.name}</h1>
            <div className="flex items-center gap-1 mt-3 text-accent">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
              <span className="text-xs text-muted-foreground ml-2">42 reviews</span>
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="font-display text-3xl">{formatPrice(finalPrice)}</span>
            {onSale && <span className="text-sm text-muted-foreground line-through">{formatPrice(product.price)}</span>}
            {onSale && <span className="text-xs uppercase tracking-luxe text-accent">Save {Math.round((1 - finalPrice / product.price) * 100)}%</span>}
          </div>

          <p className="text-muted-foreground leading-relaxed max-w-prose">{product.description}</p>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="eyebrow">Size</h4>
              <button className="text-xs underline text-muted-foreground">Size guide</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map(s => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={cn(
                    'min-w-[48px] h-12 px-4 text-sm border transition-colors',
                    size === s ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-foreground'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center border border-border h-12">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 hover:bg-muted h-full" aria-label="Decrease"><Minus className="h-3 w-3" /></button>
              <span className="px-4 text-sm">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="px-3 hover:bg-muted h-full" aria-label="Increase"><Plus className="h-3 w-3" /></button>
            </div>
            <Button onClick={handleAdd} size="lg" className="rounded-none flex-1 h-12">Add to bag</Button>
            <Button onClick={() => toggle(product.id)} size="lg" variant="outline" className="rounded-none h-12 w-12 p-0" aria-label="Wishlist">
              <Heart className={cn('h-4 w-4', wished && 'fill-primary text-primary')} />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
            <div className="flex flex-col items-center text-center gap-1.5"><Truck className="h-4 w-4 text-accent" /><span className="text-[10px] uppercase tracking-luxe text-muted-foreground">Free shipping</span></div>
            <div className="flex flex-col items-center text-center gap-1.5"><RotateCcw className="h-4 w-4 text-accent" /><span className="text-[10px] uppercase tracking-luxe text-muted-foreground">7-day returns</span></div>
            <div className="flex flex-col items-center text-center gap-1.5"><ShieldCheck className="h-4 w-4 text-accent" /><span className="text-[10px] uppercase tracking-luxe text-muted-foreground">Authentic craft</span></div>
          </div>

          <Accordion type="single" collapsible defaultValue="details" className="border-t border-border">
            <AccordionItem value="details">
              <AccordionTrigger className="text-xs uppercase tracking-luxe">Fabric & Details</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                Crafted from {product.fabric}. Each piece is finished by hand at our Karachi atelier. Includes shirt, trouser, and dupatta where applicable.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="care">
              <AccordionTrigger className="text-xs uppercase tracking-luxe">Care</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                Dry clean only. Store away from direct sunlight. Treat embroidery with care.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="shipping">
              <AccordionTrigger className="text-xs uppercase tracking-luxe">Shipping & Returns</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                Free standard shipping over PKR 25,000. International delivery available. 7-day return window for unworn pieces.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {related.length > 0 && (
        <section className="container-luxe py-20 md:py-24 border-t border-border mt-12">
          <h2 className="font-display text-3xl md:text-4xl text-center mb-12">You may also love</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6">
            {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default ProductDetail;
