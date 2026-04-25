export const formatPrice = (n: number) =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(n);

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  fabric: string | null;
  price: number;
  sale_price: number | null;
  images: string[];
  category_id: string | null;
  sizes: string[];
  colors: string[];
  stock: number;
  featured: boolean;
  trending: boolean;
};

// Map seeded /src/assets/* paths to imported URLs
import p1 from '@/assets/product-1.jpg';
import p2 from '@/assets/product-2.jpg';
import p3 from '@/assets/product-3.jpg';
import p4 from '@/assets/product-4.jpg';
import p5 from '@/assets/product-5.jpg';
import p6 from '@/assets/product-6.jpg';
import cLawn from '@/assets/collection-lawn.jpg';
import cPret from '@/assets/collection-pret.jpg';
import cBridal from '@/assets/collection-bridal.jpg';
import cFestive from '@/assets/collection-festive.jpg';

const map: Record<string, string> = {
  '/src/assets/product-1.jpg': p1,
  '/src/assets/product-2.jpg': p2,
  '/src/assets/product-3.jpg': p3,
  '/src/assets/product-4.jpg': p4,
  '/src/assets/product-5.jpg': p5,
  '/src/assets/product-6.jpg': p6,
  '/src/assets/collection-lawn.jpg': cLawn,
  '/src/assets/collection-pret.jpg': cPret,
  '/src/assets/collection-bridal.jpg': cBridal,
  '/src/assets/collection-festive.jpg': cFestive,
};

export const resolveImage = (path: string | null | undefined) => {
  if (!path) return p1;
  return map[path] ?? path;
};
