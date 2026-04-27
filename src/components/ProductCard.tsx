import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Product, formatPrice, resolveImage } from '@/lib/shop';
import { useWishlist } from '@/hooks/useWishlist';
import { cn } from '@/lib/utils';

export const ProductCard = ({ product, index = 0 }: { product: Product; index?: number }) => {
  const { has, toggle } = useWishlist();
  const onSale = product.sale_price && product.sale_price < product.price;
  const wished = has(product.id);

  return (
    <article
      className="group animate-fade-up"
      style={{ animationDelay: `${Math.min(index * 60, 300)}ms` }}
    >
      <Link to={`/product/${product.slug}`} className="block relative overflow-hidden bg-muted aspect-[3/4]">
        <img
          src={resolveImage(product.images[0])}
          alt={product.name}
          loading="lazy"
          width={900}
          height={1152}
          className="w-full h-full object-cover image-zoom"
        />
        {onSale && (
          <span className="absolute top-3 left-3 bg-background text-foreground text-[10px] uppercase tracking-luxe px-2 py-1">Sale</span>
        )}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-gradient-to-t from-black/40 to-transparent">
          <button className="w-full bg-background text-foreground text-[10px] uppercase tracking-luxe py-3 hover:bg-foreground hover:text-background transition-colors duration-300">
            Quick View
          </button>
        </div>
        <button
          onClick={(e) => { e.preventDefault(); toggle(product.id); }}
          aria-label="Toggle wishlist"
          className="absolute top-3 right-3 bg-background/90 backdrop-blur p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 hover:bg-background"
        >
          <Heart className={cn('h-4 w-4', wished && 'fill-accent text-accent')} />
        </button>
      </Link>
      <div className="pt-4 space-y-1">
        <Link to={`/product/${product.slug}`}>
          <h3 className="font-display text-lg leading-tight hover:text-primary transition-colors">{product.name}</h3>
        </Link>
        <p className="text-xs text-muted-foreground uppercase tracking-luxe">{product.fabric}</p>
        <div className="flex items-baseline gap-2 pt-1">
          {onSale ? (
            <>
              <span className="text-sm font-medium text-primary">{formatPrice(product.sale_price!)}</span>
              <span className="text-xs text-muted-foreground line-through">{formatPrice(product.price)}</span>
            </>
          ) : (
            <span className="text-sm font-medium">{formatPrice(product.price)}</span>
          )}
        </div>
      </div>
    </article>
  );
};
