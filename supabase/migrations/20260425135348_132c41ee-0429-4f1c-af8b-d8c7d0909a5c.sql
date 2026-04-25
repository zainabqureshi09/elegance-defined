
-- Roles enum and table
create type public.app_role as enum ('admin', 'user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;

-- Products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  fabric text,
  price numeric(10,2) not null,
  sale_price numeric(10,2),
  images text[] not null default '{}',
  category_id uuid references public.categories(id) on delete set null,
  sizes text[] not null default array['S','M','L','XL'],
  colors text[] not null default '{}',
  stock int not null default 0,
  featured boolean not null default false,
  trending boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;
create index on public.products(category_id);
create index on public.products(featured);
create index on public.products(trending);

-- Wishlists
create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
alter table public.wishlists enable row level security;

-- Orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending',
  total numeric(10,2) not null,
  payment_method text not null default 'cod',
  shipping_name text not null,
  shipping_phone text not null,
  shipping_address text not null,
  shipping_city text not null,
  shipping_country text not null default 'Pakistan',
  notes text,
  created_at timestamptz not null default now()
);
alter table public.orders enable row level security;

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  size text,
  quantity int not null,
  price numeric(10,2) not null
);
alter table public.order_items enable row level security;

-- Reviews
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  title text,
  comment text,
  created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;

-- updated_at trigger
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated before update on public.profiles
for each row execute function public.tg_set_updated_at();
create trigger products_updated before update on public.products
for each row execute function public.tg_set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- RLS Policies

-- profiles
create policy "View own profile" on public.profiles for select using (auth.uid() = id);
create policy "Update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- user_roles
create policy "View own roles" on public.user_roles for select using (auth.uid() = user_id);
create policy "Admins manage roles" on public.user_roles for all using (public.has_role(auth.uid(), 'admin'));

-- categories: public read, admin write
create policy "Anyone view categories" on public.categories for select using (true);
create policy "Admins manage categories" on public.categories for all using (public.has_role(auth.uid(), 'admin'));

-- products: public read, admin write
create policy "Anyone view products" on public.products for select using (true);
create policy "Admins manage products" on public.products for all using (public.has_role(auth.uid(), 'admin'));

-- wishlists
create policy "View own wishlist" on public.wishlists for select using (auth.uid() = user_id);
create policy "Add to own wishlist" on public.wishlists for insert with check (auth.uid() = user_id);
create policy "Remove from own wishlist" on public.wishlists for delete using (auth.uid() = user_id);

-- orders
create policy "View own orders" on public.orders for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "Create own orders" on public.orders for insert with check (auth.uid() = user_id or user_id is null);
create policy "Admins update orders" on public.orders for update using (public.has_role(auth.uid(), 'admin'));

-- order_items
create policy "View own order items" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.has_role(auth.uid(), 'admin')))
);
create policy "Create order items with order" on public.order_items for insert with check (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or o.user_id is null))
);

-- reviews
create policy "Anyone view reviews" on public.reviews for select using (true);
create policy "Users create own reviews" on public.reviews for insert with check (auth.uid() = user_id);
create policy "Users update own reviews" on public.reviews for update using (auth.uid() = user_id);
create policy "Users delete own reviews" on public.reviews for delete using (auth.uid() = user_id);
