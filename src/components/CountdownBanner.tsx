import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// Ends 7 days from first visit (sticky per user)
const KEY = 'zaineen-sale-end-v1';

const getEnd = () => {
  const stored = localStorage.getItem(KEY);
  if (stored) {
    const t = parseInt(stored, 10);
    if (t > Date.now()) return t;
  }
  const t = Date.now() + 7 * 24 * 60 * 60 * 1000;
  localStorage.setItem(KEY, String(t));
  return t;
};

export const CountdownBanner = () => {
  const [now, setNow] = useState(Date.now());
  const [end] = useState(getEnd);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(0, end - now);
  if (remaining === 0) return null;

  const d = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const h = Math.floor((remaining / (1000 * 60 * 60)) % 24);
  const m = Math.floor((remaining / (1000 * 60)) % 60);
  const s = Math.floor((remaining / 1000) % 60);

  const Block = ({ v, l }: { v: number; l: string }) => (
    <div className="flex flex-col items-center min-w-[42px]">
      <span className="font-display text-xl md:text-2xl leading-none tabular-nums">{String(v).padStart(2, '0')}</span>
      <span className="text-[8px] uppercase tracking-luxe opacity-70 mt-1">{l}</span>
    </div>
  );

  return (
    <Link to="/shop" className="block bg-accent/15 border-y border-accent/30 py-3">
      <div className="container-luxe flex items-center justify-center gap-4 md:gap-6 text-foreground">
        <p className="text-xs md:text-sm">
          <span className="text-[10px] uppercase tracking-luxe text-accent-foreground/80">Spring Edit</span>{' '}
          <span className="font-display text-lg md:text-xl">Up to 30% off</span>
        </p>
        <div className="flex gap-3 md:gap-4">
          <Block v={d} l="Days" />
          <Block v={h} l="Hrs" />
          <Block v={m} l="Min" />
          <Block v={s} l="Sec" />
        </div>
      </div>
    </Link>
  );
};
