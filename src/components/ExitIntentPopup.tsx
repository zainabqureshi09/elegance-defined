import { useEffect, useState } from 'react';
import { X, Gift } from 'lucide-react';
import { toast } from 'sonner';

const KEY = 'noor-exit-shown-v1';

export const ExitIntentPopup = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(KEY)) return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) trigger();
    };

    let scrolled = 0;
    let lastY = window.scrollY;
    const onScroll = () => {
      const dy = lastY - window.scrollY;
      if (dy > 0) scrolled += dy;
      lastY = window.scrollY;
      if (scrolled > 400 && window.scrollY < 200) trigger();
    };

    let timeoutId: number | undefined;
    const trigger = () => {
      if (sessionStorage.getItem(KEY)) return;
      sessionStorage.setItem(KEY, '1');
      setOpen(true);
    };

    if (isMobile) {
      window.addEventListener('scroll', onScroll, { passive: true });
      timeoutId = window.setTimeout(trigger, 25000);
    } else {
      document.addEventListener('mouseleave', onMouseLeave);
    }

    return () => {
      document.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('scroll', onScroll);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  if (!open) return null;

  const copy = () => {
    navigator.clipboard.writeText('NOOR10');
    toast.success('Code copied — NOOR10');
  };

  return (
    <div className="fixed inset-0 z-[70] bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-5 animate-fade-in" onClick={() => setOpen(false)}>
      <div
        className="relative bg-background max-w-md w-full p-8 md:p-10 text-center shadow-luxe animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
        <div className="h-14 w-14 rounded-full bg-accent/15 flex items-center justify-center mx-auto mb-5">
          <Gift className="h-6 w-6 text-accent" />
        </div>
        <p className="eyebrow">Wait — a gift</p>
        <h2 className="font-display text-3xl md:text-4xl mt-3 leading-tight">Take 10% off your<br/>first order.</h2>
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">A welcome from the atelier. Apply at checkout.</p>
        <div className="mt-6 border border-dashed border-foreground/30 py-4 px-6">
          <p className="font-display text-2xl tracking-luxe">NOOR10</p>
        </div>
        <button onClick={copy} className="mt-5 bg-primary text-primary-foreground text-xs uppercase tracking-luxe px-8 py-3 hover:opacity-90 transition-opacity">
          Copy code
        </button>
        <p className="text-[10px] uppercase tracking-luxe text-muted-foreground mt-4">Valid on orders over PKR 5,000.</p>
      </div>
    </div>
  );
};
