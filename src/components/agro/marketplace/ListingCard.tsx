import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import type { Tables } from "@/integrations/supabase/types";
import { formatBRL, formatQuantity } from "@/lib/marketplace";
import { useSignedUrls } from "@/lib/storage";

export type Listing = Tables<"listings">;

const PRODUCT_ICON: Record<string, string> = {
  Soja: "🌱",
  Milho: "🌽",
  Café: "☕",
  "Boi Gordo": "🐂",
  Trigo: "🌾",
  Algodão: "🧵",
  Feijão: "🫘",
  Arroz: "🍚",
  Leite: "🥛",
  Laranja: "🍊",
  Hortaliças: "🥬",
};

export function ListingCard({
  listing,
  favorited,
  onToggleFavorite,
  footer,
  photoUrl,
}: {
  listing: Listing;
  favorited?: boolean;
  onToggleFavorite?: (listing: Listing) => void;
  footer?: ReactNode;
  /** URL assinada da capa, quando resolvida em lote pela página. */
  photoUrl?: string | undefined;
}) {
  const cover = listing.photos?.[0];
  const fallback = useSignedUrls("listing-photos", photoUrl ? [] : [cover]);
  const resolved = photoUrl ?? (cover ? fallback.data?.[cover] : undefined);

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-soil-brown/10 bg-card p-5">
      <div>
        <div className="mb-4 flex h-40 items-center justify-center overflow-hidden rounded-xl bg-soil-brown/5">
          {resolved ? (
            <img
              src={resolved}
              alt={`Foto do anúncio de ${listing.product}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-4xl opacity-40" aria-hidden>
              {PRODUCT_ICON[listing.product] ?? "🌾"}
            </span>
          )}
        </div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-xl leading-tight">{listing.product}</h3>
            <p className="text-xs uppercase tracking-wide text-soil-brown/50">
              {[listing.city, listing.state].filter(Boolean).join(" — ") || "Local não informado"}
            </p>
          </div>
          {onToggleFavorite && (
            <button
              type="button"
              aria-label={favorited ? "Remover dos favoritos" : "Salvar nos favoritos"}
              onClick={() => onToggleFavorite(listing)}
              className={`rounded-full border px-2.5 py-1 text-sm transition-colors ${
                favorited
                  ? "border-clay bg-clay/10 text-clay"
                  : "border-soil-brown/15 text-soil-brown/40 hover:text-clay"
              }`}
            >
              {favorited ? "★" : "☆"}
            </button>
          )}
        </div>

        {listing.description && (
          <p className="mt-3 line-clamp-3 text-sm text-soil-brown/70">{listing.description}</p>
        )}

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-soil-brown/40">Quantidade</dt>
            <dd className="font-semibold">{formatQuantity(listing.quantity, listing.unit)}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-soil-brown/40">Preço</dt>
            <dd className="font-semibold text-harvest-green">{formatBRL(listing.price)}</dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {listing.organic && <Tag>Orgânico</Tag>}
          {listing.family_farming && <Tag>Agricultura familiar</Tag>}
          {listing.certifications.map((c) => (
            <Tag key={c}>{c}</Tag>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <Link
          to="/produtor/$id"
          params={{ id: listing.user_id }}
          className="text-xs font-semibold text-harvest-green underline-offset-4 hover:underline"
        >
          Ver produtor
        </Link>
        {footer}
      </div>
    </article>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-soil-brown/5 px-2 py-0.5 text-[11px] text-soil-brown/60">
      {children}
    </span>
  );
}
