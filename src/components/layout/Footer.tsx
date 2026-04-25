import { Link } from 'react-router-dom';
import { Instagram, Facebook } from 'lucide-react';

export const Footer = () => (
  <footer className="bg-secondary/40 border-t border-border mt-24">
    <div className="container-luxe py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
      <div className="col-span-2 md:col-span-1">
        <h3 className="font-display text-2xl">Noor & Co.</h3>
        <p className="text-sm text-muted-foreground mt-3 max-w-xs leading-relaxed">
          Heirloom craftsmanship. Modern silhouettes. Made for the women who define elegance on their own terms.
        </p>
        <div className="flex gap-3 mt-5">
          <a aria-label="Instagram" href="#" className="text-muted-foreground hover:text-primary transition-colors"><Instagram className="h-4 w-4" /></a>
          <a aria-label="Facebook" href="#" className="text-muted-foreground hover:text-primary transition-colors"><Facebook className="h-4 w-4" /></a>
        </div>
      </div>
      <FooterCol title="Shop" links={[
        { to: '/shop?category=lawn', label: 'Lawn' },
        { to: '/shop?category=pret', label: 'Pret' },
        { to: '/shop?category=festive', label: 'Festive' },
        { to: '/shop?category=bridal', label: 'Bridal' },
      ]} />
      <FooterCol title="Atelier" links={[
        { to: '/', label: 'Our Story' },
        { to: '/', label: 'Craftsmanship' },
        { to: '/', label: 'Sustainability' },
      ]} />
      <FooterCol title="Care" links={[
        { to: '/', label: 'Shipping' },
        { to: '/', label: 'Returns' },
        { to: '/', label: 'Size Guide' },
        { to: '/', label: 'Contact' },
      ]} />
    </div>
    <div className="border-t border-border">
      <div className="container-luxe py-5 flex flex-col md:flex-row gap-2 items-center justify-between text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Noor & Co. All rights reserved.</p>
        <p className="tracking-luxe uppercase">Made with care in Karachi</p>
      </div>
    </div>
  </footer>
);

const FooterCol = ({ title, links }: { title: string; links: { to: string; label: string }[] }) => (
  <div>
    <h4 className="eyebrow mb-4">{title}</h4>
    <ul className="space-y-3">
      {links.map(l => (
        <li key={l.label}>
          <Link to={l.to} className="text-sm text-foreground/80 hover:text-primary transition-colors">{l.label}</Link>
        </li>
      ))}
    </ul>
  </div>
);
