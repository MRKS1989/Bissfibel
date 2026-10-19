// Pegel der Elbe über Pegelonline (Wasserstraßen- und Schifffahrtsverwaltung des Bundes, frei nutzbar).
// Nur Hinweis, fließt nicht in den Bisswert ein.
import { artName, istRaubfisch } from './arten';
import { entfernungKm } from './geo';

const API = 'https://www.pegelonline.wsv.de/webservices/rest-api/v2';
export const PEGEL_QUELLE = 'Pegeldaten: Pegelonline, WSV';

export type PegelTrend = 'fallend' | 'steigend' | 'normal' | 'hoch';
export type Station = { uuid: string; name: string; lat: number; lon: number };
export type PegelStand = { stand: number; trend: PegelTrend; zeit: number; mw?: number; mhw?: number };

/** Pegel nur für Flüsse, deren Name „Elbe“ enthält. */
export const hatPegel = (w: { typ: string; name: string }) => w.typ === 'fluss' && /elbe/i.test(w.name) && !/elster/i.test(w.name);

export function naechsteStation(stationen: Station[], p: { lat: number; lon: number }): Station | null {
  let best: Station | null = null, d = Infinity;
  stationen.forEach((s) => { const x = entfernungKm(s, p); if (x < d) { d = x; best = s; } });
  return d < 60 ? best : null;
}

/** Trend aus Messwerten (cm, älteste zuerst) und Kennwerten Mittelwasser (MW) / mittleres Hochwasser (MHW). */
export function pegelTrend(werte: { zeit: number; cm: number }[], mw?: number, mhw?: number): PegelTrend {
  if (!werte.length) return 'normal';
  const jetzt = werte[werte.length - 1];
  if (mhw != null && jetzt.cm >= mhw) return 'hoch';
  const vor24 = werte.find((w) => w.zeit >= jetzt.zeit - 24 * 36e5) ?? werte[0];
  const diff = jetzt.cm - vor24.cm;
  const maxVorher = Math.max(...werte.map((w) => w.cm));
  if (diff <= -10 && (mw == null || maxVorher > mw)) return 'fallend';
  if (diff >= 10) return 'steigend';
  return 'normal';
}

export function pegelRat(t: PegelTrend, art: string): string {
  if (t === 'hoch') return 'Hochwasser: starke Strömung, Treibgut, rutschige Ufer. Bitte nicht ans Wasser.';
  if (t === 'fallend') return 'Fallendes Wasser nach erhöhtem Pegel gilt als gute Zeit' + (istRaubfisch(art) ? ', besonders an Buhnen und Strömungskanten.' : '.');
  if (t === 'steigend') return ['aal', 'zander', 'wels', 'barbe', 'quappe'].includes(art)
    ? `Leicht steigendes, trübes Wasser bringt ${artName(art)} oft in Ufernähe.`
    : 'Steigendes Wasser macht viele Fische unruhig. Ruhige Bereiche hinter Buhnen suchen.';
  return 'Normaler Wasserstand, keine Besonderheit.';
}

export const TREND_TEXT: Record<PegelTrend, string> = {
  fallend: 'fällt nach erhöhtem Wasserstand', steigend: 'steigt', normal: 'stabil', hoch: 'Hochwasser, über dem mittleren Hochwasser',
};

export async function ladeStationen(): Promise<Station[]> {
  const r = await fetch(`${API}/stations.json?waters=ELBE`);
  if (!r.ok) throw new Error('Pegelonline nicht erreichbar');
  const j = (await r.json()) as { uuid: string; shortname: string; latitude?: number; longitude?: number }[];
  return j.filter((s) => s.latitude && s.longitude).map((s) => ({ uuid: s.uuid, name: s.shortname, lat: s.latitude!, lon: s.longitude! }));
}

export async function ladePegel(uuid: string): Promise<PegelStand> {
  const [m, k] = await Promise.all([
    fetch(`${API}/stations/${uuid}/W/measurements.json?start=P3D`).then((r) => r.json() as Promise<{ timestamp: string; value: number }[]>),
    fetch(`${API}/stations/${uuid}/W.json?includeCharacteristicValues=true`).then((r) => r.json() as Promise<{ characteristicValues?: { shortname: string; value: number }[] }>),
  ]);
  const werte = m.map((x) => ({ zeit: Date.parse(x.timestamp), cm: x.value }));
  const kv = (n: string) => k.characteristicValues?.find((c) => c.shortname === n)?.value;
  const mw = kv('MW'), mhw = kv('MHW');
  const last = werte[werte.length - 1];
  return { stand: last?.cm ?? NaN, zeit: last?.zeit ?? Date.now(), trend: pegelTrend(werte, mw, mhw), mw, mhw };
}
