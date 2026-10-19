// Entfernungen und Ortssuche (Open-Meteo Geocoding, nur Orte in Sachsen).

export function entfernungKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export type Ort = { name: string; lat: number; lon: number; kreis?: string };

type GeoAntwort = { results?: { name: string; latitude: number; longitude: number; admin1?: string; admin2?: string; admin3?: string; country_code?: string }[] };

/** Nur Treffer in Sachsen. */
export function sachsenTreffer(a: GeoAntwort): Ort[] {
  return (a.results ?? [])
    .filter((r) => r.country_code === 'DE' && r.admin1 === 'Sachsen')
    .map((r) => ({ name: r.name, lat: r.latitude, lon: r.longitude, kreis: r.admin2 ?? r.admin3 }));
}

export async function ortSuchen(q: string, signal?: AbortSignal): Promise<{ orte: Ort[]; ausserhalb: boolean }> {
  const name = q.trim().replace(/,?\s*(sachsen|saxony)$/i, '');
  if (name.length < 2) return { orte: [], ausserhalb: false };
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=20&language=de&countryCode=DE&format=json`;
  const r = await fetch(url, { signal });
  if (!r.ok) throw new Error('Ortssuche nicht erreichbar');
  const j = (await r.json()) as GeoAntwort;
  const orte = sachsenTreffer(j);
  return { orte: orte.slice(0, 6), ausserhalb: !orte.length && !!j.results?.length };
}
