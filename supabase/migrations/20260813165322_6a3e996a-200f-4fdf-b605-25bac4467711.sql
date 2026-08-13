REVOKE ALL ON FUNCTION public.is_blocked_pair(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_blocked_pair(uuid, uuid) TO service_role;

REVOKE ALL ON FUNCTION public.can_send_message(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_send_message(uuid, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.open_reports_count(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.open_reports_count(uuid) TO authenticated, service_role;