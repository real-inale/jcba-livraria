-- Enable RLS
alter table auth.users enable row level security;

-- Create types
create type app_role as enum ('admin', 'seller', 'client');
create type seller_status as enum ('pending', 'approved', 'suspended', 'rejected');
create type book_type as enum ('physical', 'digital', 'both');
create type order_status as enum ('pending', 'awaiting_payment', 'paid', 'processing', 'completed', 'cancelled');
create type book_approval_status as enum ('pending', 'approved', 'rejected');

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  email text,
  phone text,
  address text,
  avatar_url text,
  terms_accepted boolean default false,
  terms_accepted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- User Roles table
create table public.user_roles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role app_role default 'client',
  created_at timestamptz default now(),
  unique(user_id, role)
);

-- Seller Profiles
create table public.seller_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  store_name text not null,
  store_description text,
  status seller_status default 'pending',
  commission_rate numeric default 10.0, -- Default 10% commission
  terms_accepted boolean default false,
  terms_accepted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- Categories
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  created_at timestamptz default now()
);

-- Books
create table public.books (
  id uuid default gen_random_uuid() primary key,
  seller_id uuid references public.seller_profiles(id) on delete cascade not null,
  title text not null,
  author text not null,
  description text,
  isbn text,
  price numeric not null,
  original_price numeric,
  book_type book_type default 'physical',
  stock integer default 1,
  category_id uuid references public.categories(id),
  cover_image_url text,
  digital_file_url text,
  pages integer,
  publisher text,
  published_year integer,
  language text default 'Português',
  
  -- Approval Workflow
  approval_status book_approval_status default 'pending',
  is_active boolean default false, -- Only true if approved AND seller activates it
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Orders
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  order_number text not null unique,
  customer_id uuid references public.profiles(id) not null,
  status order_status default 'pending',
  subtotal numeric default 0,
  platform_commission numeric default 0,
  total numeric default 0,
  shipping_address text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Order Items
create table public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  book_id uuid references public.books(id),
  seller_id uuid references public.seller_profiles(id),
  quantity integer default 1,
  unit_price numeric not null,
  commission_amount numeric default 0,
  created_at timestamptz default now()
);

-- RLS Policies (Security) --

alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

alter table public.user_roles enable row level security;
create policy "Read roles" on public.user_roles for select using (true);
-- Only admins/system can insert roles (we'll handle role assignment via trigger or admin function)

alter table public.seller_profiles enable row level security;
create policy "Public sellers viewable" on public.seller_profiles for select using (status = 'approved');
create policy "Own seller profile viewable" on public.seller_profiles for select using (auth.uid() = user_id);
create policy "Users can create seller profile" on public.seller_profiles for insert with check (auth.uid() = user_id);

alter table public.books enable row level security;
create policy "Approved books are viewable by everyone" on public.books for select using (is_active = true and approval_status = 'approved');
create policy "Sellers can see own books" on public.books for select using (seller_id in (select id from public.seller_profiles where user_id = auth.uid()));
create policy "Sellers can insert books" on public.books for insert with check (seller_id in (select id from public.seller_profiles where user_id = auth.uid()));
create policy "Sellers can update own books" on public.books for update using (seller_id in (select id from public.seller_profiles where user_id = auth.uid()));

-- Functions --

-- Trigger to create profile on signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  
  -- Assign default 'client' role
  insert into public.user_roles (user_id, role)
  values (new.id, 'client');
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger for Admin Book Aproval (Optional, can be done in app logic)
-- But ensuring is_active is false if approval is pending is good practice.
