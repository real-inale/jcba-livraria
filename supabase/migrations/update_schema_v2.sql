-- Add payment_method to orders if it doesn't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'orders' and column_name = 'payment_method') then
        alter table public.orders add column payment_method text;
    end if;
end $$;

-- Create notifications table
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text default 'info', -- 'success', 'error', 'info', 'warning'
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS for notifications
alter table public.notifications enable row level security;
create policy "Users can view own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id);
-- System can insert (usually uses service role, but allow users to insert for testing if needed, though typically backend/triggers do this)
create policy "Users can insert own notifications" on public.notifications for insert with check (auth.uid() = user_id);


-- Create payment_settings table
create table if not exists public.payment_settings (
    id uuid default gen_random_uuid() primary key,
    method text not null, -- 'multicaixa_express', etc.
    is_active boolean default true,
    account_holder text,
    account_number text,
    entity_code text,
    additional_info jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Enable RLS for payment_settings
alter table public.payment_settings enable row level security;
create policy "Payment settings are viewable by everyone" on public.payment_settings for select using (true);
create policy "Only admins can modify payment settings" on public.payment_settings for all using (
  exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
);

-- Seed Initial Payment Methods
insert into public.payment_settings (method, is_active, account_holder, account_number, entity_code)
select 'multicaixa_express', true, null, null, null
where not exists (select 1 from public.payment_settings where method = 'multicaixa_express');

insert into public.payment_settings (method, is_active, account_holder, account_number)
select 'atm_reference', true, 'JCBA Livraria', 'AO06.0040.0000.8888.9999.10'
where not exists (select 1 from public.payment_settings where method = 'atm_reference');


-- Create Digital Purchases table
create table if not exists public.digital_purchases (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) not null,
    book_id uuid references public.books(id) not null,
    order_id uuid references public.orders(id),
    download_count integer default 0,
    created_at timestamptz default now(),
    unique(user_id, book_id)
);

alter table public.digital_purchases enable row level security;
create policy "Users can view own digital purchases" on public.digital_purchases for select using (auth.uid() = user_id);


-- Function to generate Order Number
-- Format: LA-{YYYY}{MM}{DD}-{RANDOM}
create or replace function generate_order_number()
returns text
language plpgsql
as $$
declare
  prefix text := 'LA';
  date_part text;
  random_part text;
  new_order_number text;
  exists_count integer;
begin
  date_part := to_char(now(), 'YYYYMMDD');
  
  loop
    -- Generate 4 digit random number
    random_part := lpad(floor(random() * 10000)::text, 4, '0');
    new_order_number := prefix || date_part || random_part;
    
    -- Check uniqueness
    select count(*) into exists_count from public.orders where order_number = new_order_number;
    
    if exists_count = 0 then
      exit;
    end if;
  end loop;
  
  return new_order_number;
end;
$$;


-- Cart Items table
create table if not exists public.cart_items (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    book_id uuid references public.books(id) on delete cascade not null,
    quantity integer default 1 check (quantity > 0),
    created_at timestamptz default now(),
    unique(user_id, book_id)
);

alter table public.cart_items enable row level security;
create policy "Users can view own cart items" on public.cart_items for select using (auth.uid() = user_id);
create policy "Users can insert own cart items" on public.cart_items for insert with check (auth.uid() = user_id);
create policy "Users can update own cart items" on public.cart_items for update using (auth.uid() = user_id);
create policy "Users can delete own cart items" on public.cart_items for delete using (auth.uid() = user_id);


-- Platform Settings table
create table if not exists public.platform_settings (
    id uuid default gen_random_uuid() primary key,
    key text not null unique,
    value text not null,
    description text,
    updated_at timestamptz default now(),
    updated_by uuid references public.profiles(id)
);

alter table public.platform_settings enable row level security;
create policy "Platform settings are viewable by everyone" on public.platform_settings for select using (true);
create policy "Only admins can modify platform settings" on public.platform_settings for all using (
  exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
);


-- Add payment_proof_url to orders if it doesn't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'orders' and column_name = 'payment_proof_url') then
        alter table public.orders add column payment_proof_url text;
    end if;
end $$;


-- Create Indexes for Performance
create index if not exists idx_books_seller_id on public.books(seller_id);
create index if not exists idx_books_category_id on public.books(category_id);
create index if not exists idx_books_is_active_approval on public.books(is_active, approval_status) where is_active = true and approval_status = 'approved';
create index if not exists idx_orders_customer_id on public.orders(customer_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_order_items_seller_id on public.order_items(seller_id);
create index if not exists idx_order_items_book_id on public.order_items(book_id);
create index if not exists idx_cart_items_user_id on public.cart_items(user_id);
create index if not exists idx_notifications_user_id_is_read on public.notifications(user_id, is_read);
create index if not exists idx_seller_profiles_user_id on public.seller_profiles(user_id);
create index if not exists idx_seller_profiles_status on public.seller_profiles(status) where status = 'approved';


-- Seed some default categories
insert into public.categories (name, slug, description)
select 'Romance', 'romance', 'Livros de romance e ficção romântica'
where not exists (select 1 from public.categories where slug = 'romance');

insert into public.categories (name, slug, description)
select 'Técnico', 'tecnico', 'Livros técnicos e profissionais'
where not exists (select 1 from public.categories where slug = 'tecnico');

insert into public.categories (name, slug, description)
select 'Infantil', 'infantil', 'Livros infantis e juvenis'
where not exists (select 1 from public.categories where slug = 'infantil');

insert into public.categories (name, slug, description)
select 'Biografias', 'biografias', 'Biografias e autobiografias'
where not exists (select 1 from public.categories where slug = 'biografias');

insert into public.categories (name, slug, description)
select 'Acadêmico', 'academico', 'Livros acadêmicos e científicos'
where not exists (select 1 from public.categories where slug = 'academico');
