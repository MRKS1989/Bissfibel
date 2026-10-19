// Wetterdaten von Open-Meteo (kostenlos für private Nutzung, kein Schlüssel).
import type { Stunde, WetterReihe } from './prognose';
import { teile, TAG } from './zeit';

const VARS = 'temperature_2m,pressure_msl,cloud_cover,wind_speed_10m,precipitation_probability';
const BASIS = 'https://api.open-meteo.com/v1/forecast';
const ARCHIV = 'https://archive-api.open-meteo.com/v1/archive';

type Antwort = {
  latitude: number; longitude: number;
  hourly: { time: number[]; temperature_2m: (number | null)[]; pressure_msl: (number | null)[]; cloud_cover: (number | null)[];
    wind_speed_10m: (number | null)[]; precipitation_probability?: (number | null)[] };
};

/** Antwort von Open-Meteo in eine Wetterreihe umwandeln. Fehlende Werte übernehmen den letzten bekannten Wert. */
export function parseOpenMeteo(a: Antwort, lat: number, lon: number, abgerufen = Date.now()): WetterReihe {
  const h = a.hourly;
  const stunden: Stunde[] = [];
  let last: Stunde | null = null;
  for (let i = 0; i < h.time.length; i++) {
    const v = (x: (number | null)[] | undefined, fb: number) => (x && x[i] != null ? (x[i] as number) : fb);
    const s: Stunde = {
      ts: h.time[i] * 1000,
      t: v(h.temperature_2m, last?.t ?? NaN),
      p: v(h.pressure_msl, last?.p ?? 1013),
      c: v(h.cloud_cover, last?.c ?? 50),
      w: v(h.wind_speed_10m, last?.w ?? 0),
      rp: v(h.precipitation_probability, 0),
    };
    if (Number.isNaN(s.t)) continue; // Stunde ganz ohne Daten
    stunden.push(s);
    last = s;
  }
  return { lat, lon, abgerufen, stunden };
}

/** Rundet Koordinaten, damit nahe Gewässer dieselben Wetterdaten nutzen (ca. 5 km Raster). */
export const wetterKey = (lat: number, lon: number) => `${(Math.round(lat * 20) / 20).toFixed(2)},${(Math.round(lon * 20) / 20).toFixed(2)}`;

/** Vorhersage mit den letzten 14 Tagen für mehrere Orte in einer Anfrage. */
export async function ladeVorhersage(orte: { lat: number; lon: number }[]): Promise<WetterReihe[]> {
  if (!orte.length) return [];
  const url = `${BASIS}?latitude=${orte.map((o) => o.lat.toFixed(3)).join(',')}&longitude=${orte.map((o) => o.lon.toFixed(3)).join(',')}`
    + `&hourly=${VARS}&past_days=14&forecast_days=7&timezone=Europe%2FBerlin&timeformat=unixtime&wind_speed_unit=kmh`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Wetterdienst antwortet nicht (${r.status})`);
  const j = (await r.json()) as Antwort | Antwort[];
  const arr = Array.isArray(j) ? j : [j];
  return arr.map((a, i) => parseOpenMeteo(a, orte[i].lat, orte[i].lon));
}

/** Wetter rund um ein vergangenes Datum (14 Tage davor für die Wassertemperatur bis 1 Tag danach). */
export async function ladeVergangenheit(lat: number, lon: number, datum: string): Promise<WetterReihe> {
  const ende = teile(Date.parse(datum + 'T12:00:00Z') + TAG).key;
  const start = teile(Date.parse(datum + 'T12:00:00Z') - 15 * TAG).key;
  const alt = Date.now() - Date.parse(datum) > 80 * TAG;
  const vars = alt ? 'temperature_2m,pressure_msl,cloud_cover,wind_speed_10m' : VARS;
  const url = `${alt ? ARCHIV : BASIS}?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}&hourly=${vars}`
    + `&start_date=${start}&end_date=${ende}&timezone=Europe%2FBerlin&timeformat=unixtime&wind_speed_unit=kmh`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Wetterdienst antwortet nicht (${r.status})`);
  return parseOpenMeteo((await r.json()) as Antwort, lat, lon);
}

export const WETTER_QUELLE = 'Wetterdaten: Open-Meteo.com (CC BY 4.0)';
