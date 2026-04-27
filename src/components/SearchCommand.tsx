import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Product, formatPrice, resolveImage } from '@/lib/shop';
import { cn } from '@/lib/utils';

// Simple Damerau-Levenshtein for fuzzy match (good enough for product names)
const editDistance = (a: string, b: string) => {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
    }
  return dp[m][n];
};

const score = (q: string, text: string) => {
  if (!q) return 0;
  const tl = text.toLowerCase();
  const ql = q.toLowerCase();
  if (tl.startsWith(ql)) return 1000;
  if (tl.includes(ql)) return 800;
  // word-by-word fuzzy
  const words = tl.split(/\s+/);
  let best = 0;
  for (const w of words) {
    if (!w) continue;
    const d = editDistance(ql, w.slice(0, ql.length + 2));
    const s = Math.max(0, 100 - d * 20);
    if (s > best) best = s;
  }
  return best;
};

export const SearchCommand = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [q, setQ] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const nav = useNavigate();

  useEffect(() => {
    if (!open) return;
    setQ('');
    supabase.from('products').select('*').limit(200).then(({ data }) => setProducts((data ?? []) as Product[]));
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const results = useMemo(() => {
    if (!q.trim()) return products.slice(0, 6);
    return products
      .map(p => ({
        p,
        s: Math.max(score(q, p.name), score(q, p.fabric ?? '') * 0.6, score(q, p.description ?? '') * 0.3),
      }))
      .filter(x => x.s > 60)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map(x => x.p);
  }, [q, products]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-foreground/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="bg-background mx-auto mt-24 max-w-2xl w-[92%] shadow-luxe animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-5 h-14">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search the atelier — try 'lawn', 'mehndi', 'cherrmoor'…"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {results.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">No matches. Try a different word.</p>
          ) : (
            <ul>
              {results.map(p => (
                <li key={p.id}>
                  <button
                    onClick={() => { nav(`/product/${p.slug}`); onClose(); }}
                    className={cn(
                      'flex items-center gap-4 w-full p-3 px-5 hover:bg-muted/60 transition-colors text-left'
                    )}
                  >
                    <img src={resolveImage(p.images[0])} alt={p.name} className="w-12 h-14 object-cover bg-muted" loading="lazy" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.fabric}</p>
                    </div>
                    <span className="text-sm">{formatPrice(p.sale_price ?? p.price)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!q && (
            <div className="px-5 py-3 border-t border-border">
              <p className="eyebrow mb-2">Popular</p>
              <div className="flex flex-wrap gap-2">
                {['Lawn', 'Bridal', 'Festive', 'Pret', 'Chikankari', 'Mehndi'].map(t => (
                  <button key={t} onClick={() => setQ(t)} className="text-xs uppercase tracking-luxe border border-border px-3 py-1.5 hover:border-foreground transition-colors">
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
