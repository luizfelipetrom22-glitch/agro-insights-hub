import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchSessionProfile } from "@/hooks/use-profile";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        throw redirect({
          to: "/auth",
          search: { redirect: location.href },
        });
      }
      if (!location.pathname.startsWith("/bem-vindo")) {
        const session = await fetchSessionProfile();
        if (session && !session.hasChosenType) {
          throw redirect({ to: "/bem-vindo" });
        }
      }
    } catch (err) {
      // Re-throw TanStack redirects.
      if (err && typeof err === "object" && "to" in err) throw err;
      // Could not read the session (e.g. SSR without browser storage) —
      // fall through; the client-side guard below still gates the route.
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    // Client-side safety net: redirect if the session is lost while mounted.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate({ to: "/auth", search: {} });
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/auth", search: {} });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  return <Outlet />;
}
