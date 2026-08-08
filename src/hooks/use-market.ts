import { useQuery } from "@tanstack/react-query";
import {
  getAgroNews,
  getMarketInsight,
  getMarketTickers,
  getWeather,
} from "@/lib/market.functions";

/** Cotações reais, revalidadas a cada 5 minutos. */
export function useTickers() {
  return useQuery({
    queryKey: ["market-tickers"],
    queryFn: () => getMarketTickers(),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useWeather(city?: string | null, state?: string | null) {
  return useQuery({
    queryKey: ["weather", city ?? "", state ?? ""],
    queryFn: () => getWeather({ data: { city: city ?? null, state: state ?? null } }),
    staleTime: 15 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  });
}

export function useAgroNews(query?: string | null) {
  return useQuery({
    queryKey: ["agro-news", query ?? ""],
    queryFn: () => getAgroNews({ data: { query: query ?? null } }),
    staleTime: 10 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}

export function useMarketInsight() {
  return useQuery({
    queryKey: ["market-insight"],
    queryFn: () => getMarketInsight(),
    staleTime: 30 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
  });
}