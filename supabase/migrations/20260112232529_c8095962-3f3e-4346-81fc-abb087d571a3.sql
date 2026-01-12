-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('client', 'seller', 'admin');

-- Create enum for seller status
CREATE TYPE public.seller_status AS ENUM ('pending', 'approved', 'suspended', 'rejected');

-- Create enum for order status
CREATE TYPE public.order_status AS ENUM ('pending', 'awaiting_payment', 'paid', 'processing', 'completed', 'cancelled');

-- Create enum for payment methods
CREATE TYPE public.payment_method AS ENUM ('multicaixa_express', 'atm_reference', 'paypay', 'visa');

-- Create enum for book type
CREATE TYPE public.book_type AS ENUM ('physical', 'digital', 'both');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  avatar_url TEXT,
  terms_accepted BOOLEAN DEFAULT false,
  terms_accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'client',
  UNIQUE(user_id, role)
);

-- Create seller_profiles table
CREATE TABLE public.seller_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  store_name TEXT NOT NULL,
  store_description TEXT,
  status seller_status DEFAULT 'pending' NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 15.00 NOT NULL,
  terms_accepted BOOLEAN DEFAULT false NOT NULL,
  terms_accepted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create books table
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.seller_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  isbn TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  book_type book_type NOT NULL DEFAULT 'physical',
  stock INTEGER DEFAULT 0,
  category_id UUID REFERENCES public.categories(id),
  cover_image_url TEXT,
  digital_file_url TEXT,
  pages INTEGER,
  publisher TEXT,
  published_year INTEGER,
  language TEXT DEFAULT 'Português',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  status order_status DEFAULT 'pending' NOT NULL,
  payment_method payment_method,
  subtotal DECIMAL(10,2) NOT NULL,
  platform_commission DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  shipping_address TEXT,
  payment_proof_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES public.seller_profiles(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create cart_items table
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, book_id)
);

-- Create payment_settings table (admin configurable)
CREATE TABLE public.payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method payment_method NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  account_holder TEXT,
  account_number TEXT,
  entity_code TEXT,
  additional_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create platform_settings table
CREATE TABLE public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_by UUID REFERENCES auth.users(id)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create digital_purchases table (for tracking digital book access)
CREATE TABLE public.digital_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, book_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_purchases ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- Create function to check if user is seller
CREATE OR REPLACE FUNCTION public.is_seller(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'seller')
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin(auth.uid()));

-- User roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can insert their client role" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id AND role = 'client');

-- Seller profiles policies
CREATE POLICY "Sellers can view their own profile" ON public.seller_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Sellers can update their own profile" ON public.seller_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can create seller profile" ON public.seller_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all seller profiles" ON public.seller_profiles FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Public can view approved sellers" ON public.seller_profiles FOR SELECT USING (status = 'approved');

-- Categories policies
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.is_admin(auth.uid()));

-- Books policies
CREATE POLICY "Anyone can view active books" ON public.books FOR SELECT USING (is_active = true);
CREATE POLICY "Sellers can manage their books" ON public.books FOR ALL USING (
  EXISTS (SELECT 1 FROM public.seller_profiles WHERE id = books.seller_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage all books" ON public.books FOR ALL USING (public.is_admin(auth.uid()));

-- Orders policies
CREATE POLICY "Customers can view their orders" ON public.orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Customers can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers can update their orders" ON public.orders FOR UPDATE USING (auth.uid() = customer_id);
CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Sellers can view orders with their items" ON public.orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.order_items oi JOIN public.seller_profiles sp ON oi.seller_id = sp.id WHERE oi.order_id = orders.id AND sp.user_id = auth.uid())
);

-- Order items policies
CREATE POLICY "Customers can view their order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND customer_id = auth.uid())
);
CREATE POLICY "Customers can create order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND customer_id = auth.uid())
);
CREATE POLICY "Sellers can view their order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.seller_profiles WHERE id = order_items.seller_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage all order items" ON public.order_items FOR ALL USING (public.is_admin(auth.uid()));

-- Cart items policies
CREATE POLICY "Users can manage their cart" ON public.cart_items FOR ALL USING (auth.uid() = user_id);

-- Payment settings policies
CREATE POLICY "Anyone can view active payment methods" ON public.payment_settings FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage payment settings" ON public.payment_settings FOR ALL USING (public.is_admin(auth.uid()));

-- Platform settings policies
CREATE POLICY "Anyone can view platform settings" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage platform settings" ON public.platform_settings FOR ALL USING (public.is_admin(auth.uid()));

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Digital purchases policies
CREATE POLICY "Users can view their purchases" ON public.digital_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create purchases" ON public.digital_purchases FOR INSERT WITH CHECK (true);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilizador'), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (NEW.id, 'Bem-vindo à Livros Angola!', 'A sua conta foi criada com sucesso. Explore o nosso catálogo e descubra os melhores livros.', 'success');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_number TEXT;
BEGIN
  new_number := 'LA' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN new_number;
END;
$$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_seller_profiles_updated_at BEFORE UPDATE ON public.seller_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON public.books FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payment_settings_updated_at BEFORE UPDATE ON public.payment_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
INSERT INTO public.categories (name, slug, description) VALUES
  ('Ficção', 'ficcao', 'Romances, contos e literatura de ficção'),
  ('Não-Ficção', 'nao-ficcao', 'Biografias, ensaios e livros informativos'),
  ('Infantil', 'infantil', 'Livros para crianças e jovens'),
  ('Educação', 'educacao', 'Material didático e livros educativos'),
  ('Negócios', 'negocios', 'Empreendedorismo, finanças e gestão'),
  ('História', 'historia', 'História de Angola e do mundo'),
  ('Poesia', 'poesia', 'Poemas e literatura poética'),
  ('Religião', 'religiao', 'Livros religiosos e espirituais'),
  ('Tecnologia', 'tecnologia', 'Informática e tecnologia'),
  ('Autoajuda', 'autoajuda', 'Desenvolvimento pessoal e motivação');

-- Insert default payment settings
INSERT INTO public.payment_settings (method, is_active, account_holder, account_number, entity_code, additional_info) VALUES
  ('multicaixa_express', true, 'Livros Angola', '923456789', NULL, '{"instructions": "Envie o pagamento para o número indicado e anexe o comprovativo."}'::jsonb),
  ('atm_reference', true, 'Livros Angola', NULL, '12345', '{"reference_prefix": "LA", "instructions": "Use a entidade e referência no seu multibanco."}'::jsonb),
  ('paypay', true, 'Livros Angola', '912345678', NULL, '{"instructions": "Faça a transferência via PayPay e anexe o comprovativo."}'::jsonb),
  ('visa', false, 'Livros Angola', NULL, NULL, '{"instructions": "Pagamento com cartão será disponibilizado em breve."}'::jsonb);

-- Insert default platform settings
INSERT INTO public.platform_settings (key, value, description) VALUES
  ('commission_rate', '15', 'Taxa de comissão da plataforma (%)'),
  ('min_commission', '10', 'Comissão mínima (%)'),
  ('max_commission', '20', 'Comissão máxima (%)'),
  ('client_terms', 'Termos e Condições para Clientes da Livros Angola...', 'Termos para clientes'),
  ('seller_terms', 'Termos e Condições para Vendedores da Livros Angola...', 'Termos para vendedores'),
  ('platform_name', 'Livros Angola', 'Nome da plataforma');