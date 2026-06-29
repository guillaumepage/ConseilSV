DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;