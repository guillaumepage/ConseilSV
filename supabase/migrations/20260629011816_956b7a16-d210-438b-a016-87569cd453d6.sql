
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false;

-- Auto-approve existing admins and the two seed admin emails
UPDATE public.profiles SET approved = true
WHERE id IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
   OR LOWER(email) IN ('guillaume.page09@gmail.com', 'noemie.duval@hotmail.com');

-- Update new-user trigger to auto-approve admin emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_seed_admin boolean := LOWER(NEW.email) IN ('guillaume.page09@gmail.com', 'noemie.duval@hotmail.com');
BEGIN
  INSERT INTO public.profiles (id, email, full_name, approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    is_seed_admin
  );

  IF is_seed_admin THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  RETURN NEW;
END;
$function$;
