import { createServerFn } from "@tanstack/react-start";
import { fetchNews, fetchTickers, fetchWeather, generateInsight } from "./market.server";

export const getMarketTickers = createServerFn({ method: "GET" }).handler(async () => fetchTickers());

export const getWeather = createServerFn({ method: "GET" })
  .inputValidator((input: { city?: string | null; state?: string | null }) => input)
  .handler(async ({ data }) => fetchWeather(data.city ?? undefined, data.state ?? undefined));

export const getAgroNews = createServerFn({ method: "GET" })
  .inputValidator((input: { query?: string | null }) => input)
  .handler(async ({ data }) => fetchNews(data.query?.trim() || "agronegócio"));

export const getMarketInsight = createServerFn({ method: "GET" }).handler(async () => {
  const { tickers, updatedAt } = await fetchTickers();
  const text = await generateInsight(tickers);
  return { text, updatedAt };
});