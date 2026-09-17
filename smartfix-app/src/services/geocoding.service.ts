import "server-only";
import { AppError } from "@/src/errors/AppError";
import type { GeoPoint } from "@/src/types/discovery";

const cache = new Map<string, { value: GeoPoint[]; expires: number }>();
const pending = new Map<string, Promise<GeoPoint[]>>();
let queue: Promise<unknown> = Promise.resolve();

function coordinate(value: unknown, max: number) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && Math.abs(n) <= max ? n : null;
}

// Public place queries only: never send names, account IDs or house numbers.
// Deduplicate, cache and serialize lookups; fetch cache survives process restarts in Next.
export function locate(query: string): Promise<GeoPoint[]> {
  const key = query.trim().toLocaleLowerCase("pt-BR");
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return Promise.resolve(hit.value);
  const running = pending.get(key);
  if (running) return running;
  if (pending.size >= 20) return Promise.reject(new AppError("Muitas buscas em andamento. Aguarde um momento e tente novamente.", 429, "LOCATION_BUSY"));
  const job = queue.then(async () => {
    try {
      const value = await lookup(query);
      if (cache.size >= 1000) cache.delete(cache.keys().next().value!);
      cache.set(key, { value, expires: Date.now() + (value.length ? 86400000 : 60000) });
      return value;
    } finally {
      pending.delete(key);
    }
  });
  queue = job.catch(() => {}).then(() => new Promise((resolve) => setTimeout(resolve, 300)));
  pending.set(key, job);
  return job;
}

async function lookup(query: string): Promise<GeoPoint[]> {
  const cep = query.replace(/\D/g, "");
  const isCep = /^[\d\s-]+$/.test(query) && cep.length === 8;
  const url = isCep ? new URL(`https://brasilapi.com.br/api/cep/v2/${cep}`)
    : new URL(process.env.PHOTON_API_URL || "https://photon.komoot.io/api/");
  if (!isCep) {
    url.searchParams.set("q", `${query}, Brasil`);
    url.searchParams.set("limit", "6");
    url.searchParams.set("layer", "city");
  }
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "SmartFix/1.0 (https://github.com/GeanAbreu/SmartFix)" },
      next: { revalidate: 86400 } });
  } catch {
    throw new AppError("O serviço de localização está indisponível. Tente novamente ou use sua localização.", 503, "GEOCODING_UNAVAILABLE");
  }
  if (response.status === 404) return [];
  if (!response.ok) throw new AppError("Não foi possível consultar a localização agora. Tente novamente.", 503, "GEOCODING_UNAVAILABLE");
  const data = await response.json();
  if (isCep) {
    const lat = coordinate(data.location?.coordinates?.latitude, 90);
    const lng = coordinate(data.location?.coordinates?.longitude, 180);
    if (lat === null || lng === null) return [];
    return [{ lat, lng, label: [data.street, data.city, data.state].filter(Boolean).join(" · "), precision: "cep" }];
  }
  const results: GeoPoint[] = [];
  for (const feature of data.features ?? []) {
    if (feature.properties?.countrycode?.toUpperCase() !== "BR") continue;
    const lat = coordinate(feature.geometry?.coordinates?.[1], 90);
    const lng = coordinate(feature.geometry?.coordinates?.[0], 180);
    if (lat === null || lng === null) continue;
    const label = [feature.properties.name, feature.properties.state].filter(Boolean).join(" · ");
    if (!results.some((item) => item.label === label)) results.push({ lat, lng, label, precision: "city" });
  }
  return results;
}
