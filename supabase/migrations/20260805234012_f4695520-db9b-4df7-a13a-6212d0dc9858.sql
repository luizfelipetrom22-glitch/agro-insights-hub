REVOKE ALL ON FUNCTION public.handle_new_message() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_message() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_message() FROM authenticated;