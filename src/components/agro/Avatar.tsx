import { useSignedUrls } from "@/lib/storage";

function initials(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

/** Foto de perfil (bucket privado `avatars`) com fallback nas iniciais do nome. */
export function Avatar({
  path,
  name,
  size = 40,
  className = "",
}: {
  path?: string | null;
  name?: string | null | undefined;
  size?: number;
  className?: string;
}) {
  const signed = useSignedUrls("avatars", [path]);
  const url = path ? signed.data?.[path] : undefined;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-harvest-green font-semibold text-harvest-green-foreground ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36) }}
      aria-hidden={!name}
    >
      {url ? (
        <img
          src={url}
          alt={name ? `Foto de ${name}` : "Foto de perfil"}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}