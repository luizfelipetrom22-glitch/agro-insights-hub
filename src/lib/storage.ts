import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BucketName = "listing-photos" | "avatars" | "chat-attachments";

export async function createSignedUrl(
  bucket: BucketName,
  path: string,
  expiresIn = 3600,
): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) return null;
  return data?.signedUrl ?? null;
}

export async function createSignedUrls(
  bucket: BucketName,
  paths: string[],
  expiresIn = 3600,
): Promise<Record<string, string>> {
  const clean = paths.filter(Boolean);
  if (clean.length === 0) return {};
  const { data, error } = await supabase.storage.from(bucket).createSignedUrls(clean, expiresIn);
  if (error || !data) return {};
  const map: Record<string, string> = {};
  for (const item of data) {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  }
  return map;
}

/** Resolve caminhos de storage em URLs assinadas (buckets privados). */
export function useSignedUrls(bucket: BucketName, paths: (string | null | undefined)[]) {
  const clean = Array.from(new Set(paths.filter((p): p is string => Boolean(p))));
  return useQuery({
    queryKey: ["signed-urls", bucket, clean.slice().sort().join("|")],
    enabled: clean.length > 0,
    staleTime: 30 * 60 * 1000,
    queryFn: () => createSignedUrls(bucket, clean),
  });
}

export function randomFileName(originalName: string): string {
  const ext = originalName.includes(".") ? originalName.split(".").pop() : "bin";
  return `${crypto.randomUUID()}.${ext}`;
}