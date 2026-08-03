import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — TerraIntelligence" },
      {
        name: "description",
        content:
          "Acesse seu painel de inteligência de mercado para o agronegócio brasileiro.",
      },
      { property: "og:title", content: "Entrar — TerraIntelligence" },
      {
        property: "og:description",
        content: "Acesse seu painel de inteligência de mercado para o agronegócio.",
      },
    ],
  }),
  beforeLoad: async ({ search }) => {
    // Already signed in? Skip the auth page.
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      const next = (search as { redirect?: string })["redirect"];
      throw redirect({ to: next ? next : "/painel" } as never);
    }
  },
  component: AuthPage,
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: (search.redirect as string) || undefined,
  }),
});

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = search.redirect || "/painel";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
        setError(
          "Conta criada! Verifique seu e-mail para confirmar o cadastro.",
        );
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate({ to: redirectTo as never });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(result.error.message);
      return;
    }
    if (result.redirected) return; // browser redirects to Google
    navigate({ to: redirectTo as never });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-soil-brown lg:grid lg:grid-cols-2">
      {/* Left — brand panel */}
      <div className="relative hidden overflow-hidden bg-harvest-green lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_55%)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-harvest-green-foreground">
          <Link to="/" className="font-serif text-2xl">
            TerraIntelligence
          </Link>
          <div>
            <h1 className="max-w-md font-serif text-4xl leading-tight">
              Inteligência de mercado na palma da mão do produtor.
            </h1>
            <p className="mt-4 max-w-sm text-sm opacity-80">
              Cotações, clima, dólar, notícias e relatórios de IA — tudo em um só
              painel, com alertas premium por WhatsApp.
            </p>
          </div>
          <p className="text-xs opacity-60">
            © {new Date().getFullYear()} TerraIntelligence
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 block font-serif text-2xl text-harvest-green lg:hidden">
            TerraIntelligence
          </Link>

          <h2 className="font-serif text-3xl">
            {mode === "login" ? "Bem-vindo de volta" : "Criar sua conta"}
          </h2>
          <p className="mt-1 text-sm text-soil-brown/60">
            {mode === "login"
              ? "Acesse seu painel de inteligência agrícola."
              : "Comece a acompanhar o mercado do agro em minutos."}
          </p>

          <button
            onClick={handleGoogle}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-lg border border-soil-brown/15 bg-card px-4 py-3 text-sm font-semibold transition-colors hover:bg-soil-brown/5"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
              <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
            </svg>
            Continuar com Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-soil-brown/40">
            <span className="h-px flex-1 bg-soil-brown/10" />
            ou com e-mail
            <span className="h-px flex-1 bg-soil-brown/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-soil-brown/50">
                  Nome
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-soil-brown/15 bg-background px-4 py-2.5 text-sm outline-none focus:border-harvest-green"
                  placeholder="Seu nome"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-soil-brown/50">
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-soil-brown/15 bg-background px-4 py-2.5 text-sm outline-none focus:border-harvest-green"
                placeholder="voce@fazenda.com.br"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-soil-brown/50">
                Senha
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-soil-brown/15 bg-background px-4 py-2.5 text-sm outline-none focus:border-harvest-green"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="rounded-md bg-clay/10 px-3 py-2 text-xs text-clay">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-harvest-green px-4 py-3 text-sm font-semibold text-harvest-green-foreground transition-colors hover:bg-harvest-green/90 disabled:opacity-50"
            >
              {loading
                ? "Aguarde..."
                : mode === "login"
                  ? "Entrar"
                  : "Criar conta"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-soil-brown/60">
            {mode === "login" ? "Ainda não tem conta?" : "Já tem uma conta?"}{" "}
            <button
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError(null);
              }}
              className="font-semibold text-harvest-green underline-offset-2 hover:underline"
            >
              {mode === "login" ? "Cadastre-se" : "Entrar"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
