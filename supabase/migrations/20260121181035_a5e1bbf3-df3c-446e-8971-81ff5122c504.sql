-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to notify admins when seller registers
CREATE OR REPLACE FUNCTION public.notify_admins_new_seller()
RETURNS TRIGGER AS $$
DECLARE
  admin_user RECORD;
  seller_name TEXT;
BEGIN
  -- Get seller's name from profiles
  SELECT full_name INTO seller_name FROM public.profiles WHERE id = NEW.user_id;
  
  -- Create notification for each admin
  FOR admin_user IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      admin_user.user_id,
      'Novo Vendedor Pendente',
      'O vendedor "' || NEW.store_name || '" (' || COALESCE(seller_name, 'Sem nome') || ') solicitou aprovação para vender na plataforma.',
      'seller_pending'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new seller registrations
DROP TRIGGER IF EXISTS on_seller_created ON public.seller_profiles;
CREATE TRIGGER on_seller_created
  AFTER INSERT ON public.seller_profiles
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.notify_admins_new_seller();

-- Add seller_profile_id column to notifications for linking
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS reference_id uuid,
ADD COLUMN IF NOT EXISTS reference_type text;