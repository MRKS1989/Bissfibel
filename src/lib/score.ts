// Bisswert 0–10 je Stunde, Gewässer und Fischart.
// Score = 10 × (0,40·Wasser + 0,22·Licht + 0,12·Bewölkung + 0,10·Wind + 0,11·Luftdruck + 0,05·Mond)
import { ARTEN, artName, type Artprofil } from './arten';
import type { Licht, Mondgruppe } from './astro';

export type Bedingungen = {
  wasserTemp: number; licht: Licht; bewoelkung: number; wind: number;
  dp: number; // Luftdruckänderung über 12 h in hPa
  mond: Mondgruppe;
};

export type Faktoren = { wasser: number; licht: number; bewoelkung: number; wind: number; druck: number; mond: number };
export type Bewertung = { score: number; f: Faktoren };

export const STURM_KMH = 35;
export const ALARM_AB = 9; // „Alarm“ erst ab 9, darunter lohnt keine Meldung
export const GUT_AB = 7;

/** Trapez: 0 unter Minimum, steigt bis Optimum-Beginn, 1 im Optimum, fällt bis Maximum. */
export function trapez(v: number, [a, b, c, d]: readonly number[]): number {
  if (v <= a || v >= d) return 0;
  if (v < b) return (v - a) / (b - a);
  if (v <= c) return 1;
  return (d - v) / (d - c);
}

export function druckFaktor(dp: number, mode: Artprofil['druck']): number {
  if (mode === 'front') return dp < -8 ? 0.7 : dp < -2 ? 0.95 : dp <= 2 ? 0.65 : dp <= 5 ? 0.5 : 0.35;
  return dp < -8 ? 0.4 : dp < -2 ? 0.6 : dp <= 2 ? 0.9 : dp <= 5 ? 0.65 : 0.45;
}

const bereich = (v: number, [lo, hi]: readonly number[], spanne: number, boden: number) =>
  v >= lo && v <= hi ? 1 : Math.max(boden, 1 - (v < lo ? lo - v : v - hi) / spanne);

export const bewoelkungFaktor = (c: number, p: Artprofil) => bereich(c, p.bewoelkung, 45, 0.3);
export const windFaktor = (w: number, p: Artprofil) => (w > STURM_KMH ? 0.1 : bereich(w, p.wind, 14, 0.25));

export function profilVon(art: string): Artprofil {
  return ARTEN[art]?.profil ?? ARTEN.hecht.profil!;
}

export function bewerte(b: Bedingungen, art: string): Bewertung {
  const p = profilVon(art);
  const f: Faktoren = {
    wasser: trapez(b.wasserTemp, p.wasser),
    licht: p.licht[b.licht === 'daemmerung' ? 0 : b.licht === 'tag' ? 1 : 2],
    bewoelkung: b.licht === 'nacht' ? 0.85 : bewoelkungFaktor(b.bewoelkung, p),
    wind: windFaktor(b.wind, p),
    druck: druckFaktor(b.dp, p.druck),
    mond: b.mond === 'Neumond' || b.mond === 'Vollmond' ? 0.6 : 0.5,
  };
  const score = 10 * (0.4 * f.wasser + 0.22 * f.licht + 0.12 * f.bewoelkung + 0.1 * f.wind + 0.11 * f.druck + 0.05 * f.mond);
  return { score, f };
}

/** Bestes 3-Stunden-Fenster eines Tages. scores = Stundenwerte ab Mitternacht (mind. 24, gern mit Folgetag). */
export function bestesFenster(scores: number[], vonStunde = 0): { start: number; avg: number } {
  let best = { start: vonStunde, avg: -1 };
  for (let h = vonStunde; h <= 21; h++) {
    const w = [scores[h], scores[h + 1] ?? scores[h], scores[h + 2] ?? scores[h + 1] ?? scores[h]];
    const avg = (w[0] + w[1] + w[2]) / 3;
    if (avg > best.avg) best = { start: h, avg };
  }
  return best;
}

export type Stufe = 'g' | 'w' | 'b';
export const stufe = (s: number): [Stufe, string] =>
  s >= GUT_AB ? ['g', 'Gute Chancen'] : s >= 5 ? ['w', 'Mittel'] : ['b', 'Eher schwach'];

// ---------- Begründungen, je Art formuliert ----------

export type Urteil = { text: string; ok: boolean | null };

export function druckText(dp: number, art: string): string {
  const p = profilVon(art);
  if (dp < -8) return 'Luftdruck fällt stark – Unwetter möglich, Sicherheit geht vor';
  if (dp < -2) return p.druck === 'front' ? 'Luftdruck fällt – vor Fronten oft aktiv' : 'Luftdruck fällt – Friedfische werden oft vorsichtig';
  if (dp <= 2) return p.druck === 'front' ? 'Luftdruck stabil – neutral' : 'Luftdruck stabil – passt';
  return 'Luftdruck steigt – nach Fronten oft zäh';
}

export function lichtText(b: Bedingungen, f: Faktoren, art: string): string {
  const p = profilVon(art), n = artName(art);
  if (b.licht === 'nacht') return 'Nacht – ' + (p.licht[2] >= 0.8 ? `${n} ist nachtaktiv` : `für ${n} eher ungünstig`);
  const c = Math.round(b.bewoelkung);
  const pre = (b.licht === 'daemmerung' ? 'Dämmerung, ' : '') + `Bewölkung ${c} %`;
  if (f.bewoelkung >= 0.99) return `${pre} – passt (ideal ${p.bewoelkung[0]}–${p.bewoelkung[1]} %)`;
  return `${pre} – ` + (c < p.bewoelkung[0] ? `zu sonnig für ${n}` : `zu trüb für ${n}`);
}

export function windText(b: Bedingungen, f: Faktoren, art: string): string {
  const p = profilVon(art), n = artName(art), w = Math.round(b.wind);
  if (w > STURM_KMH) return `Sturm (${w} km/h) – bitte nicht ans Wasser`;
  if (f.wind >= 0.99) return `Wind ${w} km/h – ` + (w < 5 ? `fast windstill, passt für ${n}` : `leichte Wellen, passt für ${n}`);
  return `Wind ${w} km/h – ` + (w < p.wind[0] ? 'zu ruhig, glatte Oberfläche' : `zu viel Wind für ${n}`);
}

/** Teil nach dem Gedankenstrich, z. B. „passt für Zander“. */
export const nachStrich = (t: string) => t.split(' – ').slice(1).join(' – ') || t;

/** Farbige Plaketten für die gewählte Art. */
export function urteile(b: Bedingungen, f: Faktoren, art: string): { licht: Urteil; wasser: Urteil; druck: Urteil; wind: Urteil } {
  const p = profilVon(art);
  const lt = lichtText(b, f, art);
  const dt = druckText(b.dp, art);
  const wt = windText(b, f, art);
  return {
    licht: { text: 'Licht: ' + nachStrich(lt).replace(/ \(ideal.*\)/, ''), ok: f.bewoelkung >= 0.99 || (b.licht === 'nacht' && p.licht[2] >= 0.8) },
    wasser: {
      text: 'Wasser: ' + (f.wasser >= 0.95 ? 'ideal' : b.wasserTemp < p.wasser[1] ? 'etwas kühl' : 'etwas warm'),
      ok: f.wasser >= 0.95,
    },
    druck: { text: 'Druck: ' + nachStrich(dt), ok: /passt|aktiv/.test(dt) ? true : /neutral/.test(dt) ? null : false },
    wind: { text: nachStrich(wt), ok: f.wind >= 0.99 },
  };
}

/** Warnung bei Sturm oder stark fallendem Luftdruck. Nie zum Angeln ermuntern. */
export function sicherheitsWarnung(windMax: number, dpMin: number): string | null {
  if (windMax > STURM_KMH) return `Sturm möglich (bis ${Math.round(windMax)} km/h). Bitte nicht ans Wasser, Sicherheit geht vor.`;
  if (dpMin < -8) return 'Luftdruck fällt stark – Unwetter möglich. Wetter im Blick behalten, Sicherheit geht vor.';
  return null;
}
