import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';

const signupSchema = z.object({
  fullName: z.string().trim().min(2, 'Please enter your name').max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(6, 'Minimum 6 characters').max(128),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(128),
});

const Auth = () => {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) nav('/account', { replace: true });
  }, [loading, user, nav]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({ email: fd.get('email'), password: fd.get('password') });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success('Welcome back'); nav('/account'); }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signupSchema.safeParse({
      fullName: fd.get('fullName'), email: fd.get('email'), password: fd.get('password'),
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: parsed.data.fullName },
      },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success('Welcome to Noor & Co.'); nav('/account'); }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="container-luxe flex-1 grid md:grid-cols-2 gap-12 py-16 md:py-24 items-center">
        <div className="max-w-md mx-auto md:mx-0 w-full">
          <p className="eyebrow">The Atelier</p>
          <h1 className="font-display text-4xl md:text-5xl mt-2 mb-3">Welcome.</h1>
          <p className="text-muted-foreground mb-8">Sign in to save favourites, track orders, and access private previews.</p>

          <Tabs defaultValue="login">
            <TabsList className="grid grid-cols-2 w-full rounded-none bg-transparent border-b border-border h-auto p-0">
              <TabsTrigger value="login" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none uppercase tracking-luxe text-xs py-3">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none uppercase tracking-luxe text-xs py-3">Create Account</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-8">
              <form onSubmit={handleLogin} className="space-y-5">
                <div><Label htmlFor="li-email">Email</Label><Input id="li-email" name="email" type="email" required className="mt-2 rounded-none" /></div>
                <div><Label htmlFor="li-pw">Password</Label><Input id="li-pw" name="password" type="password" required className="mt-2 rounded-none" /></div>
                <Button type="submit" disabled={busy} className="w-full rounded-none h-11">{busy ? 'Signing in…' : 'Sign In'}</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup" className="mt-8">
              <form onSubmit={handleSignup} className="space-y-5">
                <div><Label htmlFor="su-name">Full Name</Label><Input id="su-name" name="fullName" required className="mt-2 rounded-none" /></div>
                <div><Label htmlFor="su-email">Email</Label><Input id="su-email" name="email" type="email" required className="mt-2 rounded-none" /></div>
                <div><Label htmlFor="su-pw">Password</Label><Input id="su-pw" name="password" type="password" required minLength={6} className="mt-2 rounded-none" /></div>
                <Button type="submit" disabled={busy} className="w-full rounded-none h-11">{busy ? 'Creating…' : 'Create Account'}</Button>
              </form>
            </TabsContent>
          </Tabs>
          <p className="text-xs text-muted-foreground mt-6"><Link to="/" className="hover:text-foreground">← Back to home</Link></p>
        </div>
        <div className="hidden md:block bg-luxe aspect-[4/5] relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="text-center max-w-sm">
              <p className="eyebrow">Members</p>
              <p className="font-display text-4xl mt-3 leading-tight">Quiet privileges<br /><em className="text-accent not-italic">for the considered.</em></p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Auth;
