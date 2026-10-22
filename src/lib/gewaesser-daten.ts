// Gewässerliste für ganz Sachsen, einmal aus OpenStreetMap gebaut und mit der App ausgeliefert.
// Die Suche läuft dann auf dem Gerät: sofort und auch offline.
import { entfernungKm } from './geo';
import { flaechenTyp, istTrinkwasser, type Treffer } from './gewaesser-suche';
import type { GewaesserTyp } from './wassertemp';

/** Stillgewässer: [Name, Typ, Breite, Länge, Fläche ha, Trinkwasser 0/1, OSM-Id] */
export type Still = [string, GewaesserTyp, number, number, number, 0 | 1, string];
/** Fließgewässer: [Name, Typ, Länge km gesamt, Punkte flach [lat, lon, lat, lon, …], OSM-Id] */
export type Fliess = [string, GewaesserTyp, number, number[], string];
export type GewaesserDaten = { stand: string; quelle: string; still: Still[]; fliess: Fliess[] };

// ---------- Bauen (läuft auf GitHub, siehe scripts/gewaesser) ----------

type Pos = [number, number]; // [lon, lat] wie in GeoJSON
export type Feature = {
  properties: Record<string, string | number | undefined>;
  geometry: { type: 'Polygon'; coordinates: Pos[][] } | { type: 'MultiPolygon'; coordinates: Pos[][][] }
    | { type: 'LineString'; coordinates: Pos[] } | { type: 'MultiLineString'; coordinates: Pos[][] } | { type: string; coordinates: unknown };
};

const r4 = (x: number) => Math.round(x * 1e4) / 1e4;

/** Fläche (ha) und Schwerpunkt eines Rings, eben genähert um die Breite des Rings. */
function ring(r: Pos[]): { ha: number; lat: number; lon: number } {
  const lat0 = r[0][1] * (Math.PI / 180), kx = 111.32 * Math.cos(lat0), ky = 110.57;
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const x1 = r[j][0] * kx, y1 = r[j][1] * ky, x2 = r[i][0] * kx, y2 = r[i][1] * ky;
    const f = x1 * y2 - x2 * y1;
    a += f; cx += (x1 + x2) * f; cy += (y1 + y2) * f;
  }
  a /= 2;
  if (!a) return { ha: 0, lat: r[0][1], lon: r[0][0] };
  return { ha: Math.abs(a) * 100, lon: cx / (6 * a) / kx, lat: cy / (6 * a) / ky };
}

function polygon(p: Pos[][]): { ha: number; lat: number; lon: number } {
  const aussen = ring(p[0]);
  const loecher = p.slice(1).reduce((s, r) => s + ring(r).ha, 0);
  return { ...aussen, ha: Math.max(0, aussen.ha - loecher) };
}

/** GeoJSON-Objekte (aus osmium export) in die kompakte Liste umwandeln. */
export function baueDaten(features: Feature[], stand: string): GewaesserDaten {
  const still: Still[] = [];
  const linien = new Map<string, { name: string; typ: GewaesserTyp; teile: Pos[][]; id: string }>();

  for (const f of features) {
    const t = Object.fromEntries(Object.entries(f.properties).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]));
    const name = t.name?.trim();
    if (!name) continue;
    const id = `${t['@type'] ?? ''}/${t['@id'] ?? ''}`;
    const g = f.geometry;
    if (t.waterway && (g.type === 'LineString' || g.type === 'MultiLineString')) {
      const typ: GewaesserTyp = t.waterway === 'canal' ? 'kanal' : t.waterway === 'stream' ? 'bach' : t.waterway === 'river' ? 'fluss' : 'bach';
      if (!['river', 'canal', 'stream'].includes(t.waterway)) continue;
      const k = `${typ}|${name}`;
      const teile = g.type === 'LineString' ? [g.coordinates as Pos[]] : (g.coordinates as Pos[][]);
      const l = linien.get(k);
      if (l) l.teile.push(...teile); else linien.set(k, { name, typ, teile: [...teile], id });
      continue;
    }
    if (g.type !== 'Polygon' && g.type !== 'MultiPolygon') continue;
    const typ = flaechenTyp(t);
    if (!typ) continue;
    const polys = g.type === 'Polygon' ? [g.coordinates as Pos[][]] : (g.coordinates as Pos[][][]);
    const teile = polys.map(polygon);
    const ha = teile.reduce((s, p) => s + p.ha, 0);
    if (ha < 0.5) continue;
    const gross = teile.sort((a, b) => b.ha - a.ha)[0];
    still.push([name, typ, r4(gross.lat), r4(gross.lon), Math.round(ha * 10) / 10, istTrinkwasser(name, t) ? 1 : 0, id]);
  }

  // Gleichnamige Teile eines Sees dicht beieinander zusammenfassen.
  const zusammen: Still[] = [];
  still.sort((a, b) => b[4] - a[4]).forEach((s) => {
    const d = zusammen.find((z) => z[0] === s[0] && z[1] === s[1] && entfernungKm({ lat: z[2], lon: z[3] }, { lat: s[2], lon: s[3] }) < 1.5);
    if (d) d[4] = Math.round((d[4] + s[4]) * 10) / 10; else zusammen.push(s);
  });

  // Flüsse: alle Abschnitte eines Namens, Punkte etwa alle 500 m für die Entfernung.
  const fliess: Fliess[] = [...linien.values()].map(({ name, typ, teile, id }) => {
    let km = 0;
    const pts: number[] = [];
    teile.forEach((linie) => {
      let last: Pos | null = null;
      linie.forEach((p, i) => {
        if (i) {
          const a = linie[i - 1];
          const seg = entfernungKm({ lat: a[1], lon: a[0] }, { lat: p[1], lon: p[0] });
          km += seg;
          // Lange gerade Abschnitte mit Zwischenpunkten auffüllen (höchstens 500 m Abstand).
          const n = Math.floor(seg / 0.5);
          for (let j = 1; j <= n; j++) {
            const f = j / (n + 1);
            pts.push(r4(a[1] + (p[1] - a[1]) * f), r4(a[0] + (p[0] - a[0]) * f));
          }
        }
        if (!last || i === linie.length - 1 || entfernungKm({ lat: last[1], lon: last[0] }, { lat: p[1], lon: p[0] }) >= 0.5) {
          pts.push(r4(p[1]), r4(p[0]));
          last = p;
        }
      });
    });
    return [name, typ, Math.round(km), pts, id];
  });

  return { stand, quelle: '© OpenStreetMap-Mitwirkende, ODbL', still: zusammen, fliess };
}

// ---------- Suchen (in der App) ----------

export function sucheInDaten(d: GewaesserDaten, home: { lat: number; lon: number }, radiusKm: number, mitBaechen = false): Treffer[] {
  const out: Treffer[] = [];
  for (const [name, typ, lat, lon, ha, tw, id] of d.still) {
    const dist = entfernungKm(home, { lat, lon });
    if (dist <= radiusKm) out.push({ osmId: id, name, typ, lat, lon, distKm: Math.round(dist * 10) / 10, flaecheHa: ha, trinkwasser: !!tw });
  }
  for (const [name, typ, , pts, id] of d.fliess) {
    if (typ === 'bach' && !mitBaechen) continue;
    let best = Infinity, bi = 0, laenge = 0, vorher: { lat: number; lon: number; d: number } | null = null;
    for (let i = 0; i < pts.length; i += 2) {
      const p = { lat: pts[i], lon: pts[i + 1] };
      const dd = entfernungKm(home, p);
      if (dd < best) { best = dd; bi = i; }
      if (vorher && dd <= radiusKm && vorher.d <= radiusKm) {
        const s = entfernungKm(vorher, p);
        if (s < 2) laenge += s; // Sprünge zwischen getrennten Abschnitten nicht mitzählen
      }
      vorher = { ...p, d: dd };
    }
    if (best <= radiusKm) out.push({ osmId: id, name, typ, lat: pts[bi], lon: pts[bi + 1], distKm: Math.round(best * 10) / 10, laengeKm: Math.max(1, Math.round(laenge)), trinkwasser: false });
  }
  return out.sort((a, b) => a.distKm - b.distKm);
}

let geladen: Promise<GewaesserDaten | null> | null = null;

/** Lädt die mitgelieferte Gewässerliste einmal (danach aus dem Speicher, auch offline). */
export function ladeGewaesserDaten(): Promise<GewaesserDaten | null> {
  geladen ??= fetch('./gewaesser-sachsen.json')
    .then((r) => (r.ok ? (r.json() as Promise<GewaesserDaten>) : null))
    .catch(() => { geladen = null; return null; });
  return geladen;
}
