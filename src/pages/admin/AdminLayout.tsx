import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Tag, LogOut } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/coupons', label: 'Coupons', icon: Tag },
];

export const AdminLayout = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, loading } = useUserRole();

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="font-display text-xl">Loading…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-secondary/20 grid md:grid-cols-[240px_1fr]">
      <aside className="hidden md:flex flex-col bg-background border-r border-border">
        <div className="p-6 border-b border-border">
          <p className="font-display text-2xl">Zaineen Clothing</p>
          <p className="eyebrow mt-1">Atelier admin</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 text-sm transition-colors',
                  isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )
              }
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={signOut} className="flex items-center gap-3 px-6 py-4 text-sm border-t border-border text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </aside>

      <div className="md:hidden bg-background border-b border-border p-3 flex gap-2 overflow-x-auto">
        {navItems.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              cn('text-xs uppercase tracking-luxe px-3 py-1.5 border whitespace-nowrap',
                isActive ? 'border-foreground bg-foreground text-background' : 'border-border')
            }
          >
            {n.label}
          </NavLink>
        ))}
      </div>

      <main className="p-5 md:p-10 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};
