import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from 'sonner';

export type CartItem = {
  id: string; // product id
  name: string;
  slug: string;
  image: string;
  price: number;
  size: string;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeItem: (id: string, size: string) => void;
  updateQty: (id: string, size: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = 'zaineen-cart-v1';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem: CartContextType['addItem'] = (item, qty = 1) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === item.id && i.size === item.size);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
        return next;
      }
      return [...prev, { ...item, quantity: qty }];
    });
    toast.success('Added to bag', { description: `${item.name} • Size ${item.size}` });
    setIsOpen(true);
  };

  const removeItem = (id: string, size: string) =>
    setItems(prev => prev.filter(i => !(i.id === id && i.size === size)));

  const updateQty = (id: string, size: string, qty: number) =>
    setItems(prev => prev.map(i => (i.id === id && i.size === size ? { ...i, quantity: Math.max(1, qty) } : i)));

  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clear, count, subtotal, isOpen, setIsOpen }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
