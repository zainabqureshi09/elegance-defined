import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRecent, RecentItem } from '@/lib/recentlyViewed';
import { formatPrice } from '@/lib/shop';

export const RecentlyViewed = ({ excludeId }: { excludeId?: string }) => {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    const load = () => setItems(getRecent().filter(i => i.id !== excludeId));
    load();
    window.addEventListener('noor-recent-updated', load);
    return () => window.removeEventListener('noor-recent-updated', load);
  }, [excludeId]);

  if (items.length === 0) return null;

  return (
    <section className="container-luxe py-16 md:py-20 border-t border-border">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="eyebrow">Just for you</p>
          <h2 className="font-display text-3xl md:text-4xl mt-2">Recently viewed</h2>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-8 md:gap-x-5">
        {items.map((p, i) => (
          <Link
            to={`/product/${p.slug}`}
            key={p.id}
            className="group animate-fade-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="aspect-[3/4] bg-muted overflow-hidden">
              <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover image-zoom" />
            </div>
            <p className="mt-3 text-xs font-medium truncate">{p.name}</p>
            <p className="text-xs text-muted-foreground">{formatPrice(p.price)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
};
