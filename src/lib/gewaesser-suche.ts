// Gewässersuche über OpenStreetMap (Overpass), nur innerhalb Sachsens.
// Ergebnisse werden je Ort und Umkreis zwischengespeichert (Fair-Use der Overpass-Server).
import { entfernungKm } from './geo';
import type { GewaesserTyp } from './wassertemp';

export type Treffer = {
  osmId: string; name: string; typ: GewaesserTyp; lat: number; lon: number; distKm: number;
  flaecheHa?: number; laengeKm?: number; trinkwasser: boolean;
};

export type El = {
  type: 'way' | 'relation' | 'node'; id: number; tags?: Record<string, string>;
  center?: { lat: number; lon: number };
  bounds?: { minlat: number; minlon: number; maxlat: number; maxlon: number };
  geometry?: { lat: number; lon: number }[];
};

export const OSM_HINWEIS = '© OpenStreetMap-Mitwirkende, ODbL';
const SERVER = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];

// Trinkwassertalsperren in Sachsen (Landestalsperrenverwaltung). Angeln dort meist verboten.
const TRINKWASSER = ['eibenstock', 'carlsfeld', 'cranzahl', 'sosa', 'muldenberg', 'werda', 'dröda', 'saidenbach', 'neunzehnhain',
  'einsiedel', 'lichtenberg', 'klingenberg', 'lehnmühle', 'gottleuba', 'rauschenbach'];

/**
 * Abfrage: Seen, Teiche, Talsperren und Flüsse mit Namen; Bäche nur auf Wunsch.
 * Nur Umrissrechtecke (bb) statt ganzer Linien, damit die Antwort klein und schnell bleibt.
 */
export function overpassQuery(lat: number, lon: number, radiusKm: number, mitBaechen = false): string {
  const a = `(around:${Math.round(radiusKm * 1000)},${lat.toFixed(4)},${lon.toFixed(4)})(area.sn)`;
  const fliess = mitBaechen ? 'river|canal|stream' : 'river|canal';
  return `[out:json][timeout:40];
area["ISO3166-2"="DE-SN"][admin_level=4]->.sn;
(
  way["natural"="water"]["name"]${a};
  relation["natural"="water"]["name"]${a};
  way["landuse"="reservoir"]["name"]${a};
  way["waterway"~"^(${fliess})$"]["name"]${a};
);
out tags bb qt;`;
}

/** Typ eines Stillgewässers aus den OSM-Merkmalen, oder null wenn es nicht passt (z. B. Rückhaltebecken). */
export function flaechenTyp(t: Record<string, string>): GewaesserTyp | null {
  const n = (t.name ?? '').toLowerCase();
  if (/rückhaltebecken|regenrückhalte|klärteich|klärbecken|löschteich|feuerlösch/.test(n)) return null;
  const w = t.water;
  if (w === 'river' || w === 'stream' || w === 'wastewater' || w === 'basin' || w === 'reflecting_pool' || w === 'moat') return null;
  if (w === 'canal') return 'kanal';
  if (/talsperre|stausee|vorsperre|vorbecken|speicher/.test(n)) return 'talsperre';
  if (/teich|weiher|tümpel/.test(n) || w === 'pond' || w === 'fishpond') return 'teich';
  if (w === 'reservoir' || t.landuse === 'reservoir') return /see\b|see$/.test(n) ? 'see' : 'talsperre';
  return 'see';
}

function flaecheAusBounds(b: NonNullable<El['bounds']>): number {
  const h = (b.maxlat - b.minlat) * 111.32;
  const w = (b.maxlon - b.minlon) * 111.32 * Math.cos(((b.maxlat + b.minlat) / 2) * (Math.PI / 180));
  return h * w * 100 * 0.55; // grobe Schätzung: Gewässer füllen ihr Rechteck etwa zur Hälfte
}

export function istTrinkwasser(name: string, t: Record<string, string> = {}): boolean {
  const n = name.toLowerCase();
  return t.drinking_water === 'yes' || (/talsperre|vorsperre/.test(n) && TRINKWASSER.some((x) => n.includes(x)));
}

/** Overpass-Antwort in eine Trefferliste umwandeln. Flüsse werden nach Namen zusammengefasst. */
export function parseOverpass(els: El[], home: { lat: number; lon: number }, radiusKm: number): Treffer[] {
  const out: Treffer[] = [];
  const fluesse = new Map<string, { typ: GewaesserTyp; dist: number; lat: number; lon: number; laenge: number; id: string; tags: Record<string, string> }>();

  for (const e of els) {
    const t = e.tags ?? {};
    const name = t.name?.trim();
    if (!name) continue;
    const b = e.bounds;
    const mitte = e.center ?? (b ? { lat: (b.minlat + b.maxlat) / 2, lon: (b.minlon + b.maxlon) / 2 } : undefined);
    if (t.waterway) {
      const typ: GewaesserTyp = t.waterway === 'canal' ? 'kanal' : t.waterway === 'stream' ? 'bach' : 'fluss';
      let bp: { lat: number; lon: number } | undefined, best = Infinity, laenge = 0;
      if (e.geometry?.length) {
        e.geometry.forEach((p, i) => {
          const d = entfernungKm(home, p);
          if (d < best) { best = d; bp = p; }
          if (i && d <= radiusKm) laenge += entfernungKm(e.geometry![i - 1], p);
        });
      } else if (b) {
        // Nächster Punkt des Abschnitts ≈ nächster Punkt seines Rechtecks; Länge ≈ Diagonale.
        bp = { lat: Math.min(b.maxlat, Math.max(b.minlat, home.lat)), lon: Math.min(b.maxlon, Math.max(b.minlon, home.lon)) };
        best = entfernungKm(home, bp);
        if (best <= radiusKm) laenge = entfernungKm({ lat: b.minlat, lon: b.minlon }, { lat: b.maxlat, lon: b.maxlon }) * 0.9;
      } else if (mitte) { bp = mitte; best = entfernungKm(home, mitte); }
      if (!bp) continue;
      const k = `${typ}|${name}`;
      const alt = fluesse.get(k);
      if (!alt) fluesse.set(k, { typ, dist: best, lat: bp.lat, lon: bp.lon, laenge, id: `${e.type}/${e.id}`, tags: t });
      else {
        alt.laenge += laenge;
        if (best < alt.dist) Object.assign(alt, { dist: best, lat: bp.lat, lon: bp.lon, id: `${e.type}/${e.id}` });
      }
      continue;
    }
    const typ = flaechenTyp(t);
    const c = mitte;
    if (!typ || !c) continue;
    const ha = e.bounds ? flaecheAusBounds(e.bounds) : undefined;
    if (ha != null && ha < 0.5) continue;
    out.push({
      osmId: `${e.type}/${e.id}`, name, typ, lat: c.lat, lon: c.lon, distKm: entfernungKm(home, c),
      flaecheHa: ha != null ? Math.round(ha * 10) / 10 : undefined, trinkwasser: istTrinkwasser(name, t),
    });
  }
  for (const [k, f] of fluesse) {
    out.push({
      osmId: f.id, name: k.split('|')[1], typ: f.typ, lat: f.lat, lon: f.lon, distKm: f.dist,
      laengeKm: f.laenge ? Math.round(f.laenge) : undefined, trinkwasser: false,
    });
  }
  // Gleichnamige Stillgewässer dicht beieinander (Teile eines Sees) zusammenfassen.
  const seen: Treffer[] = [];
  out.sort((a, b) => a.distKm - b.distKm).forEach((t) => {
    const dup = seen.find((s) => s.name === t.name && s.typ === t.typ && entfernungKm(s, t) < 1.5);
    if (dup) { if (t.flaecheHa && dup.flaecheHa) dup.flaecheHa += t.flaecheHa; }
    else seen.push(t);
  });
  return seen.filter((t) => t.distKm <= radiusKm + 0.5).map((t) => ({ ...t, distKm: Math.round(t.distKm * 10) / 10 }));
}

export async function sucheGewaesser(home: { lat: number; lon: number }, radiusKm: number, mitBaechen = false, signal?: AbortSignal): Promise<Treffer[]> {
  const body = 'data=' + encodeURIComponent(overpassQuery(home.lat, home.lon, radiusKm, mitBaechen));
  let fehler: unknown = null;
  for (const url of SERVER) {
    try {
      const r = await fetch(url, { method: 'POST', body, signal, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      if (!r.ok) throw new Error(`Overpass ${r.status}`);
      const j = (await r.json()) as { elements: El[] };
      return parseOverpass(j.elements, home, radiusKm);
    } catch (e) {
      if (signal?.aborted) throw e;
      fehler = e;
    }
  }
  throw fehler ?? new Error('Gewässersuche fehlgeschlagen');
}
