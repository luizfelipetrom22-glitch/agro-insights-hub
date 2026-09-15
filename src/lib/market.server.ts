/** Busca de dados reais de mercado (cotações, dólar, clima e notícias). */

export type Ticker = {
  label: string;
  value: string;
  change: string | null;
  dir: "up" | "down" | "flat";
  hint?: string;
  /** Valor numérico em reais, para cálculos financeiros. */
  numeric?: number;
  /** Variação percentual frente ao fechamento anterior. */
  changePct?: number;
};

export type NewsItem = {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
};

const YAHOO = "https://query1.finance.yahoo.com/v8/finance/chart";
const UA = { "User-Agent": "Mozilla/5.0 (compatible; TerraIntelligence/1.0)" };

type Quote = { price: number; previous: number };

async function yahooQuote(symbol: string): Promise<Quote | null> {
  try {
    const res = await fetch(`${YAHOO}/${encodeURIComponent(symbol)}?interval=1d&range=5d`, {
      headers: UA,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      chart?: { result?: { meta?: { regularMarketPrice?: number; chartPreviousClose?: number } }[] };
    };
    const meta = json.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;
    return {
      price: meta.regularMarketPrice,
      previous: meta.chartPreviousClose ?? meta.regularMarketPrice,
    };
  } catch {
    return null;
  }
}

function pct(current: number, previous: number): { change: string; dir: Ticker["dir"]; delta: number } {
  if (!previous) return { change: "0,0%", dir: "flat", delta: 0 };
  const delta = ((current - previous) / previous) * 100;
  const dir: Ticker["dir"] = delta > 0.05 ? "up" : delta < -0.05 ? "down" : "flat";
  const sign = delta > 0 ? "+" : "";
  return { change: `${sign}${delta.toFixed(1).replace(".", ",")}%`, dir, delta };
}

function brl(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Cotações das principais commodities convertidas para reais. */
export async function fetchTickers(): Promise<{ tickers: Ticker[]; usdBrl: number | null; updatedAt: string }> {
  const [soy, corn, coffee, cattle, usd] = await Promise.all([
    yahooQuote("ZS=F"),
    yahooQuote("ZC=F"),
    yahooQuote("KC=F"),
    yahooQuote("LE=F"),
    yahooQuote("BRL=X"),
  ]);

  const rate = usd?.price ?? null;
  const tickers: Ticker[] = [];

  // Cents de dólar por bushel -> R$ por saca de 60 kg.
  const bagFromBushel = (cents: number, kgPerBushel: number) =>
    rate ? (cents / 100 / kgPerBushel) * 60 * rate : null;
  // Cents de dólar por libra -> R$ por saca de 60 kg (132,277 lb).
  const bagFromPound = (cents: number) => (rate ? (cents / 100) * 132.277 * rate : null);
  // Cents de dólar por libra -> R$ por arroba (15 kg = 33,069 lb).
  const arrobaFromPound = (cents: number) => (rate ? (cents / 100) * 33.069 * rate : null);

  function push(label: string, quote: Quote | null, convert: (v: number) => number | null, hint: string) {
    if (!quote) return;
    const value = convert(quote.price);
    if (value === null) return;
    const { change, dir, delta } = pct(quote.price, quote.previous);
    tickers.push({ label, value: brl(value), change, dir, hint, numeric: value, changePct: delta });
  }

  push("Soja", soy, (v) => bagFromBushel(v, 27.2155), "CBOT convertido para R$/saca 60 kg");
  push("Milho", corn, (v) => bagFromBushel(v, 25.4012), "CBOT convertido para R$/saca 60 kg");
  push("Boi Gordo", cattle, arrobaFromPound, "CME convertido para R$/arroba");
  push("Café", coffee, bagFromPound, "ICE convertido para R$/saca 60 kg");

  if (usd) {
    const { change, dir, delta } = pct(usd.price, usd.previous);
    tickers.push({ label: "Dólar", value: brl(usd.price), change, dir, hint: "USD/BRL", numeric: usd.price, changePct: delta });
  }

  return { tickers, usdBrl: rate, updatedAt: new Date().toISOString() };
}

const WEATHER: Record<number, string> = {
  0: "Céu limpo",
  1: "Predomínio de sol",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Névoa",
  48: "Névoa gelada",
  51: "Garoa fraca",
  53: "Garoa",
  55: "Garoa forte",
  61: "Chuva fraca",
  63: "Chuva",
  65: "Chuva forte",
  71: "Neve fraca",
  73: "Neve",
  75: "Neve forte",
  80: "Pancadas isoladas",
  81: "Pancadas de chuva",
  82: "Pancadas fortes",
  95: "Tempestade",
  96: "Tempestade com granizo",
  99: "Tempestade com granizo",
};

const CAPITALS: Record<string, [number, number, string]> = {
  AC: [-9.97, -67.81, "Rio Branco"], AL: [-9.67, -35.73, "Maceió"], AP: [0.03, -51.07, "Macapá"],
  AM: [-3.12, -60.02, "Manaus"], BA: [-12.97, -38.5, "Salvador"], CE: [-3.73, -38.52, "Fortaleza"],
  DF: [-15.78, -47.93, "Brasília"], ES: [-20.32, -40.34, "Vitória"], GO: [-16.68, -49.25, "Goiânia"],
  MA: [-2.53, -44.3, "São Luís"], MT: [-15.6, -56.1, "Cuiabá"], MS: [-20.44, -54.65, "Campo Grande"],
  MG: [-19.92, -43.94, "Belo Horizonte"], PA: [-1.46, -48.5, "Belém"], PB: [-7.12, -34.86, "João Pessoa"],
  PR: [-25.43, -49.27, "Curitiba"], PE: [-8.05, -34.9, "Recife"], PI: [-5.09, -42.8, "Teresina"],
  RJ: [-22.91, -43.17, "Rio de Janeiro"], RN: [-5.79, -35.21, "Natal"], RS: [-30.03, -51.23, "Porto Alegre"],
  RO: [-8.76, -63.9, "Porto Velho"], RR: [2.82, -60.67, "Boa Vista"], SC: [-27.6, -48.55, "Florianópolis"],
  SP: [-23.55, -46.63, "São Paulo"], SE: [-10.91, -37.07, "Aracaju"], TO: [-10.18, -48.33, "Palmas"],
};

async function geocode(city: string, state: string): Promise<[number, number, string] | null> {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=pt&country=BR`,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      results?: { latitude: number; longitude: number; name: string; admin1?: string }[];
    };
    const hit = json.results?.[0];
    if (!hit) return null;
    return [hit.latitude, hit.longitude, hit.name + (state ? ` — ${state}` : "")];
  } catch {
    return null;
  }
}

export type Weather = {
  place: string;
  temperature: number;
  description: string;
  min: number | null;
  max: number | null;
  rain: number | null;
};

export async function fetchWeather(city?: string, state?: string): Promise<Weather | null> {
  const uf = (state ?? "").toUpperCase();
  const located = (city ? await geocode(city, uf) : null) ?? CAPITALS[uf] ?? CAPITALS["MT"]!;
  const [lat, lon, place] = located;
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_min,temperature_2m_max,precipitation_sum&timezone=America%2FSao_Paulo&forecast_days=1`,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      current?: { temperature_2m?: number; weather_code?: number };
      daily?: { temperature_2m_min?: number[]; temperature_2m_max?: number[]; precipitation_sum?: number[] };
    };
    if (json.current?.temperature_2m === undefined) return null;
    return {
      place,
      temperature: Math.round(json.current.temperature_2m),
      description: WEATHER[json.current.weather_code ?? 0] ?? "Tempo estável",
      min: json.daily?.temperature_2m_min?.[0] ?? null,
      max: json.daily?.temperature_2m_max?.[0] ?? null,
      rain: json.daily?.precipitation_sum?.[0] ?? null,
    };
  } catch {
    return null;
  }
}

function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function tag(block: string, name: string): string {
  const match = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  if (!match?.[1]) return "";
  return decodeEntities(match[1].replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, "").trim());
}

/** Notícias reais do agronegócio via feed do Google Notícias (pt-BR). */
export async function fetchNews(query = "agronegócio", limit = 6): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`,
      { headers: UA },
    );
    if (!res.ok) return [];
    const xml = await res.text();
    const items = xml.split("<item>").slice(1, limit + 1);
    return items.map((block) => {
      const title = tag(block, "title");
      const source = tag(block, "source");
      return {
        title: source && title.endsWith(source) ? title.slice(0, -(source.length + 3)).trim() : title,
        link: tag(block, "link"),
        source: source || "Google Notícias",
        publishedAt: tag(block, "pubDate"),
      };
    });
  } catch {
    return [];
  }
}

export const HISTORY_PRODUCTS = {
  Soja: { symbol: "ZS=F", unit: "R$/saca 60 kg", kind: "bushel", factor: 27.2155 },
  Milho: { symbol: "ZC=F", unit: "R$/saca 60 kg", kind: "bushel", factor: 25.4012 },
  Café: { symbol: "KC=F", unit: "R$/saca 60 kg", kind: "pound", factor: 132.277 },
  "Boi Gordo": { symbol: "LE=F", unit: "R$/arroba", kind: "pound", factor: 33.069 },
} as const;

export type HistoryProduct = keyof typeof HISTORY_PRODUCTS;

export type PriceHistory = {
  product: string;
  unit: string;
  months: { month: string; price: number }[];
  lastYearAvg: number | null;
  previousYearAvg: number | null;
  changePct: number | null;
};

/** Série mensal real dos últimos 24 meses, convertida para reais. */
export async function fetchHistory(product: HistoryProduct): Promise<PriceHistory | null> {
  const config = HISTORY_PRODUCTS[product];
  try {
    const [res, usd] = await Promise.all([
      fetch(`${YAHOO}/${encodeURIComponent(config.symbol)}?interval=1mo&range=2y`, { headers: UA }),
      yahooQuote("BRL=X"),
    ]);
    if (!res.ok || !usd) return null;
    const json = (await res.json()) as {
      chart?: {
        result?: {
          timestamp?: number[];
          indicators?: { quote?: { close?: (number | null)[] }[] };
        }[];
      };
    };
    const result = json.chart?.result?.[0];
    const stamps = result?.timestamp ?? [];
    const closes = result?.indicators?.quote?.[0]?.close ?? [];
    const months: { month: string; price: number }[] = [];
    for (let i = 0; i < stamps.length; i += 1) {
      const close = closes[i];
      const stamp = stamps[i];
      if (close === null || close === undefined || stamp === undefined) continue;
      const brlValue =
        config.kind === "bushel"
          ? (close / 100 / config.factor) * 60 * usd.price
          : (close / 100) * config.factor * usd.price;
      months.push({
        month: new Date(stamp * 1000).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        price: Math.round(brlValue * 100) / 100,
      });
    }
    const avg = (list: { price: number }[]) =>
      list.length ? list.reduce((sum, m) => sum + m.price, 0) / list.length : null;
    const lastYear = months.slice(-12);
    const previousYear = months.slice(-24, -12);
    const lastYearAvg = avg(lastYear);
    const previousYearAvg = avg(previousYear);
    return {
      product,
      unit: config.unit,
      months,
      lastYearAvg,
      previousYearAvg,
      changePct:
        lastYearAvg !== null && previousYearAvg
          ? ((lastYearAvg - previousYearAvg) / previousYearAvg) * 100
          : null,
    };
  } catch {
    return null;
  }
}

/** Análise curta escrita por IA a partir das cotações reais do momento. */
export async function generateInsight(tickers: Ticker[]): Promise<string | null> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key || tickers.length === 0) return null;
  const resumo = tickers.map((t) => `${t.label}: ${t.value} (${t.change ?? "estável"})`).join("; ");
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Você é analista de mercado agrícola brasileiro. Escreva em português do Brasil, 2 frases, tom direto e prático para o produtor. Nada de saudações nem listas.",
          },
          { role: "user", content: `Cotações de agora: ${resumo}. Comente o momento e o que o produtor deve observar.` },
        ],
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return json.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}