// Wetter-Schnappschuss für einen Angeltag: aus dem Zwischenspeicher, sonst nachträglich von Open-Meteo.
import { cacheLesen, type Gewaesser, type WetterSchnappschuss } from '../db';
import { lichtKlasse, mond } from '../lib/astro';
import { schnappschuss, type WetterReihe } from '../lib/prognose';
import { ladeVergangenheit, wetterKey } from '../lib/wetter';
import { teile } from '../lib/zeit';

/** Liefert immer Licht und Mond (lokal berechnet); Wetterwerte nur, wenn verfügbar. */
export async function schnappschussLaden(w: Pick<Gewaesser, 'lat' | 'lon' | 'typ'>, art: string, ts: number): Promise<{ s: WetterSchnappschuss; mitWetter: boolean }> {
  const basis: WetterSchnappschuss = { licht: lichtKlasse(ts, w.lat, w.lon), mond: mond(ts).gruppe };
  const c = await cacheLesen<WetterReihe>('wetter:' + wetterKey(w.lat, w.lon));
  let s = c ? schnappschuss(c.v, w.typ, art, ts) : null;
  if (!s && navigator.onLine) {
    try { s = schnappschuss(await ladeVergangenheit(w.lat, w.lon, teile(ts).key), w.typ, art, ts); } catch { /* ohne Netz */ }
  }
  return s ? { s: { ...basis, ...s }, mitWetter: true } : { s: basis, mitWetter: false };
}

/** Aktueller Bisswert für das Gewässer aus dem Zwischenspeicher. */
export function bisswertJetzt(reihe: WetterReihe | null, w: Pick<Gewaesser, 'typ'>, art: string, ts = Date.now()): number | null {
  if (!reihe) return null;
  return schnappschuss(reihe, w.typ, art, ts)?.score ?? null;
}
