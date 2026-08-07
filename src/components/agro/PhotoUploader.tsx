import { useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { randomFileName, useSignedUrls, type BucketName } from "@/lib/storage";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

/** Upload de várias fotos (bucket privado), com capa, reordenação e remoção. */
export function PhotoUploader({
  bucket = "listing-photos",
  userId,
  value,
  onChange,
  max = 5,
}: {
  bucket?: BucketName;
  userId: string;
  value: string[];
  onChange: (paths: string[]) => void;
  max?: number;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const signed = useSignedUrls(bucket, value);

  async function handleFiles(files: FileList) {
    const remaining = max - value.length;
    if (remaining <= 0) {
      toast.error(`Máximo de ${max} fotos por anúncio.`);
      return;
    }
    setUploading(true);
    const added: string[] = [];
    try {
      for (const file of Array.from(files).slice(0, remaining)) {
        if (!ACCEPTED.includes(file.type)) {
          toast.error(`"${file.name}": use JPG, PNG ou WebP.`);
          continue;
        }
        if (file.size > MAX_BYTES) {
          toast.error(`"${file.name}" passa de 5 MB.`);
          continue;
        }
        const path = `${userId}/${randomFileName(file.name)}`;
        const { error } = await supabase.storage.from(bucket).upload(path, file);
        if (error) throw error;
        added.push(path);
      }
      if (added.length > 0) onChange([...value, ...added]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar a foto.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function move(index: number, delta: number) {
    const next = [...value];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    const current = next[index]!;
    next[index] = next[target]!;
    next[target] = current;
    onChange(next);
  }

  async function remove(index: number) {
    const path = value[index];
    if (!path) return;
    onChange(value.filter((_, i) => i !== index));
    await supabase.storage.from(bucket).remove([path]);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {value.map((path, index) => (
          <figure
            key={path}
            className="relative h-24 w-24 overflow-hidden rounded-xl border border-soil-brown/15 bg-soil-brown/5"
          >
            {signed.data?.[path] ? (
              <img
                src={signed.data[path]}
                alt={`Foto ${index + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className="flex h-full items-center justify-center text-xs text-soil-brown/40">
                …
              </span>
            )}
            {index === 0 && (
              <figcaption className="absolute inset-x-0 top-0 bg-harvest-green/90 py-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-harvest-green-foreground">
                Capa
              </figcaption>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-soil-brown/70 px-1 py-0.5 text-[11px] text-background">
              <button
                type="button"
                aria-label={`Mover foto ${index + 1} para a esquerda`}
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="px-1 disabled:opacity-30"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label={`Remover foto ${index + 1}`}
                onClick={() => void remove(index)}
                className="px-1"
              >
                ✕
              </button>
              <button
                type="button"
                aria-label={`Mover foto ${index + 1} para a direita`}
                onClick={() => move(index, 1)}
                disabled={index === value.length - 1}
                className="px-1 disabled:opacity-30"
              >
                ›
              </button>
            </div>
          </figure>
        ))}

        {value.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="h-24 w-24 rounded-xl border border-dashed border-soil-brown/25 text-xs text-soil-brown/50 transition-colors hover:border-harvest-green hover:text-harvest-green disabled:opacity-50"
          >
            {uploading ? "Enviando…" : "+ Foto"}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void handleFiles(e.target.files);
        }}
      />
      <p className="text-xs text-soil-brown/50">
        Até {max} fotos (JPG, PNG ou WebP, 5 MB cada). A primeira é a capa do anúncio.
      </p>
    </div>
  );
}