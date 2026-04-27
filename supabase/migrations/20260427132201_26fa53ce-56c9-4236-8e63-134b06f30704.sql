-- Phase 2 retry (fix trigger syntax)

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 5;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value numeric NOT NULL CHECK (discount_value >= 0),
  min_subtotal numeric NOT NULL DEFAULT 0,
  max_uses integer,
  uses_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone view active coupons" ON public.coupons;
CREATE POLICY "Anyone view active coupons" ON public.coupons FOR SELECT USING (active = true);
DROP POLICY IF EXISTS "Admins manage coupons" ON public.coupons;
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL USING (has_role(auth.uid(), 'admin'));

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS discount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subtotal numeric,
  ADD COLUMN IF NOT EXISTS shipping_fee numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS trg_orders_updated ON public.orders;
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  user_id uuid,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_views_product ON public.product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_created ON public.product_views(created_at DESC);
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone insert views" ON public.product_views;
CREATE POLICY "Anyone insert views" ON public.product_views FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins view all views" ON public.product_views;
CREATE POLICY "Admins view all views" ON public.product_views FOR SELECT USING (has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  items jsonb NOT NULL,
  subtotal numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone insert abandoned" ON public.abandoned_carts;
CREATE POLICY "Anyone insert abandoned" ON public.abandoned_carts FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins view abandoned" ON public.abandoned_carts;
CREATE POLICY "Admins view abandoned" ON public.abandoned_carts FOR SELECT USING (has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_session_key ON public.chat_sessions(session_key);
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone insert chat session" ON public.chat_sessions;
CREATE POLICY "Anyone insert chat session" ON public.chat_sessions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone read own session by key" ON public.chat_sessions;
CREATE POLICY "Anyone read own session by key" ON public.chat_sessions FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON public.chat_messages(session_id, created_at);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone insert chat message" ON public.chat_messages;
CREATE POLICY "Anyone insert chat message" ON public.chat_messages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone read chat message" ON public.chat_messages;
CREATE POLICY "Anyone read chat message" ON public.chat_messages FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins view subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins view subscribers" ON public.newsletter_subscribers FOR SELECT USING (has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare user_count int;
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  select count(*) into user_count from public.user_roles;
  if user_count = 0 then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'user');
  end if;
  return new;
end;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.increment_product_view(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  update public.products set views_count = views_count + 1 where id = p_product_id;
end;
$$;

CREATE OR REPLACE FUNCTION public.validate_coupon(p_code text, p_subtotal numeric)
RETURNS TABLE(valid boolean, message text, discount numeric, discount_type text, code text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
declare c public.coupons;
declare d numeric := 0;
begin
  select * into c from public.coupons where lower(coupons.code) = lower(p_code) and active = true;
  if not found then
    return query select false, 'Invalid coupon', 0::numeric, ''::text, p_code; return;
  end if;
  if c.expires_at is not null and c.expires_at < now() then
    return query select false, 'Coupon expired', 0::numeric, ''::text, p_code; return;
  end if;
  if c.max_uses is not null and c.uses_count >= c.max_uses then
    return query select false, 'Coupon limit reached', 0::numeric, ''::text, p_code; return;
  end if;
  if p_subtotal < c.min_subtotal then
    return query select false, 'Minimum order not met', 0::numeric, ''::text, p_code; return;
  end if;
  if c.discount_type = 'percent' then
    d := round(p_subtotal * (c.discount_value / 100.0));
  else
    d := c.discount_value;
  end if;
  return query select true, 'Applied', d, c.discount_type, c.code;
end;
$$;
