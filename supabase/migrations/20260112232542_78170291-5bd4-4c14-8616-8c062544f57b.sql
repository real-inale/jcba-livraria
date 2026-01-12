-- Fix function search path issues
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
BEGIN
  new_number := 'LA' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN new_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix overly permissive RLS policies for notifications and digital_purchases
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create purchases" ON public.digital_purchases;

-- Create more restrictive policies - only authenticated users can have notifications/purchases created for them
CREATE POLICY "Notifications can be created for authenticated users" ON public.notifications 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Digital purchases can be created for authenticated users" ON public.digital_purchases 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);