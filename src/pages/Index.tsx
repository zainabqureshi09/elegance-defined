import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/ProductCard';
import { Product, resolveImage } from '@/lib/shop';
import heroImg from '@/assets/hero.jpg';
import lawnImg from '@/assets/collection-lawn.jpg';
import pretImg from '@/assets/collection-pret.jpg';
import bridalImg from '@/assets/collection-bridal.jpg';
import festiveImg from '@/assets/collection-festive.jpg';
import { ArrowRight, Star } from 'lucide-react';

const collections = [
  { slug: 'lawn', name: 'Lawn', img: lawnImg, tagline: 'Whisper-light essentials' },
  { slug: 'pret', name: 'Pret', img: pretImg, tagline: 'Effortless minimalism' },
  { slug: 'festive', name: 'Festive', img: festiveImg, tagline: 'For every celebration' },
  { slug: 'bridal', name: 'Bridal', img: bridalImg, tagline: 'Heirloom craftsmanship' },
];

const testimonials = [
  { name: 'Aisha K.', city: 'Lahore', text: 'Fits like couture, drapes like a dream. The Saira chikankari is my new favourite.', rating: 5 },
  { name: 'Sana M.', city: 'Karachi', text: 'The bridal lehenga exceeded every expectation. Each thread feels intentional.', rating: 5 },
  { name: 'Mariam R.', city: 'Islamabad', text: 'Modern silhouettes with deep respect for tradition. I keep coming back.', rating: 5 },
];

const Home = () => {
  const [trending, setTrending] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    supabase.from('products').select('*').eq('trending', true).limit(8)
      .then(({ data }) => setTrending((data ?? []) as Product[]));
    supabase.from('products').select('*').eq('featured', true).limit(4)
      .then(({ data }) => setFeatured((data ?? []) as Product[]));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero */}
      <section className="relative bg-luxe overflow-hidden">
        <div className="container-luxe grid md:grid-cols-2 gap-8 md:gap-16 items-center py-12 md:py-24">
          <div className="space-y-6 md:space-y-8 animate-fade-up order-2 md:order-1">
            <p className="eyebrow">New Edit · Spring 2026</p>
            <h1 className="font-display text-5xl md:text-7xl leading-[1.05] text-balance">
              Quiet luxury,<br />
              <em className="text-accent not-italic">woven by hand.</em>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-md leading-relaxed">
              An edit of lawn, pret, festive and bridal — designed with restraint, finished with reverence.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-none px-8">
                <Link to="/shop">Shop the edit</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-none px-8 border-foreground/20">
                <Link to="/shop?category=bridal">Bridal atelier</Link>
              </Button>
            </div>
          </div>
          <div className="relative order-1 md:order-2 animate-fade-in">
            <div className="absolute -inset-4 bg-secondary/30 -z-10" />
            <img
              src={heroImg}
              alt="Model in emerald embroidered shalwar kameez"
              width={1600}
              height={1200}
              fetchPriority="high"
              className="w-full h-[460px] md:h-[640px] object-cover shadow-luxe"
            />
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="bg-emerald-grad text-primary-foreground py-4 overflow-hidden">
        <div className="flex gap-12 animate-marquee whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex gap-12 shrink-0">
              {['Hand Embroidered', 'Made to Last', 'Free Shipping over PKR 25,000', 'Crafted in Karachi', 'Heirloom Quality'].map(t => (
                <span key={t} className="text-xs uppercase tracking-luxe">— {t}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Collections */}
      <section className="container-luxe py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16 space-y-3">
          <p className="eyebrow">The Collections</p>
          <h2 className="font-display text-4xl md:text-5xl">A wardrobe, considered.</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {collections.map((c, i) => (
            <Link
              to={`/shop?category=${c.slug}`}
              key={c.slug}
              className="group relative overflow-hidden bg-muted aspect-[3/4] hover-lift animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <img src={c.img} alt={c.name} loading="lazy" className="w-full h-full object-cover image-zoom" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7 text-primary-foreground">
                <p className="text-[10px] uppercase tracking-luxe opacity-90">{c.tagline}</p>
                <h3 className="font-display text-3xl md:text-4xl mt-1">{c.name}</h3>
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-luxe mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  Shop now <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured editorial */}
      {featured[0] && (
        <section className="bg-secondary/40">
          <div className="container-luxe grid md:grid-cols-2 gap-10 md:gap-20 py-20 md:py-28 items-center">
            <img src={resolveImage(featured[0].images[0])} alt={featured[0].name} loading="lazy" className="w-full h-[420px] md:h-[600px] object-cover shadow-luxe" />
            <div className="space-y-6">
              <p className="eyebrow">Featured Piece</p>
              <h2 className="font-display text-4xl md:text-5xl text-balance">{featured[0].name}</h2>
              <p className="text-muted-foreground leading-relaxed max-w-md">{featured[0].description}</p>
              <Button asChild size="lg" className="rounded-none px-8">
                <Link to={`/product/${featured[0].slug}`}>Discover</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Trending */}
      <section className="container-luxe py-20 md:py-28">
        <div className="flex items-end justify-between mb-10 md:mb-12">
          <div>
            <p className="eyebrow">Trending</p>
            <h2 className="font-display text-4xl md:text-5xl mt-2">Currently coveted</h2>
          </div>
          <Link to="/shop" className="hidden md:inline-flex items-center gap-2 text-xs uppercase tracking-luxe hover:text-primary transition-colors">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-14">
          {trending.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-secondary/40 py-20 md:py-28">
        <div className="container-luxe">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <p className="eyebrow">From our clients</p>
            <h2 className="font-display text-4xl md:text-5xl">Worn with love.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map(t => (
              <div key={t.name} className="bg-background p-8 shadow-soft">
                <div className="flex gap-0.5 text-accent mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                </div>
                <p className="font-display text-xl leading-relaxed text-balance">"{t.text}"</p>
                <p className="text-xs uppercase tracking-luxe text-muted-foreground mt-6">{t.name} · {t.city}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instagram-style gallery */}
      <section className="container-luxe py-20 md:py-28">
        <div className="text-center mb-10 space-y-3">
          <p className="eyebrow">@noorandco</p>
          <h2 className="font-display text-4xl md:text-5xl">Worn in the world</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3">
          {[heroImg, lawnImg, pretImg, bridalImg, festiveImg, lawnImg].map((img, i) => (
            <a href="#" key={i} className="relative aspect-square overflow-hidden bg-muted group">
              <img src={img} alt="Instagram" loading="lazy" className="w-full h-full object-cover image-zoom" />
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors duration-500" />
            </a>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-emerald-grad text-primary-foreground py-20 md:py-24">
        <div className="container-luxe text-center max-w-xl mx-auto space-y-6">
          <p className="text-[10px] uppercase tracking-luxe text-accent">Join the atelier</p>
          <h2 className="font-display text-4xl md:text-5xl">Be the first to know.</h2>
          <p className="opacity-80">Private previews, atelier stories, and seasonal lookbooks.</p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              required
              placeholder="Your email"
              className="flex-1 bg-transparent border border-primary-foreground/30 px-4 py-3 text-sm placeholder:text-primary-foreground/60 focus:outline-none focus:border-accent"
            />
            <Button type="submit" variant="secondary" className="rounded-none px-6">Subscribe</Button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
