import { BASE_INFO_URL } from "../../config";

export interface MinaExchange {
  id: string;
  enabled: boolean;
  name: string;
  iconUrl: string;
  url: string;
  description: Record<string, string>;
}

export interface MinaExchangesConfig {
  schemaVersion: 1;
  enabled: boolean;
  exchanges: MinaExchange[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function parseMinaExchangesConfig(value: unknown): MinaExchangesConfig | null {
  if (!isObject(value) || value.schemaVersion !== 1 ||
      typeof value.enabled !== "boolean" || !Array.isArray(value.exchanges)) return null;

  try {
    const exchanges = (value.exchanges as MinaExchange[]).map((item) => ({
      ...item,
      iconUrl: new URL(item.iconUrl, BASE_INFO_URL).href,
      description: item.description ?? {},
    }));
    return { schemaVersion: 1, enabled: value.enabled, exchanges };
  } catch {
    return null;
  }
}

export function parseMinaExchangesCache(value: unknown): MinaExchangesConfig | null {
  if (!isObject(value)) return null;
  return parseMinaExchangesConfig(value.config);
}

export function getExchangeDescription(exchange: MinaExchange, language: string): string {
  const normalized = language.replace(/-/g, "_");
  const base = normalized.split("_")[0] || "en";
  return exchange.description[normalized] ||
    exchange.description[base === "zh" ? "zh_CN" : base] || exchange.description.en || "";
}
