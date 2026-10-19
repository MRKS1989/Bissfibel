// Lernen aus dem eigenen Fangbuch. Ehrlich: Aussagen erst ab Mindestmengen, immer mit Anzahl Angeltage.
import type { Angeltag } from '../db';
import type { Licht } from './astro';
import { artName } from './arten';
import { druckGruppe, wolkenGruppe } from './prognose';
import type { Bedingungen } from './score';
import type { Truebung, Farbfamilie } from './wasser';
import { clamp, fmt1 } from './zeit';

export const MIN_TAGE_ART = 10;
export const MIN_TAGE_GEWAESSER = 10;
export const MIN_TAGE_MYTHEN = 20;

export type Gruppen = { druck: 'fallend' | 'stabil' | 'steigend'; licht: Licht; wolken: 'klar' | 'wechselnd' | 'bedeckt' };

export const gruppenAus = (b: Bedingungen): Gruppen => ({ druck: druckGruppe(b.dp), licht: b.licht, wolken: wolkenGruppe(b.bewoelkung) });

const tagGruppen = (t: Angeltag): Partial<Gruppen> => ({ druck: t.wetter.luftdruckTrend, licht: t.wetter.licht, wolken: t.wetter.bewoelkung });

export const faengeVon = (t: Angeltag, art?: string) => (art ? t.faenge.filter((f) => f.fischart === art).length : t.faenge.length);

const LABEL: Record<keyof Gruppen, Record<string, string>> = {
  druck: { fallend: 'bei fallendem Luftdruck', stabil: 'bei stabilem Luftdruck', steigend: 'bei steigendem Luftdruck' },
  licht: { daemmerung: 'in der Dämmerung', tag: 'tagsüber', nacht: 'nachts' },
  wolken: { klar: 'bei klarem Himmel', wechselnd: 'bei wechselnder Bewölkung', bedeckt: 'bei bedecktem Himmel' },
};
const gross = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Angeltage, die für diese Art zählen (Zielfisch oder Fang) und Dauer haben. */
export const tageFuerArt = (art: string, tage: Angeltag[]) =>
  tage.filter((t) => (t.zielfisch === art || t.faenge.some((f) => f.fischart === art)) && t.dauerH > 0);

export type Persoenlich =
  | { aktiv: false; n: number }
  | { aktiv: true; n: number; score: number; delta: number; aussage: string; aehnlich: Angeltag[] };

/** Persönlicher Bisswert: ab 10 Angeltagen mit der Art; je Faktor mindestens 3 passende Tage. */
export function persoenlich(art: string, g: Gruppen, tage: Angeltag[], basis: number): Persoenlich {
  const es = tageFuerArt(art, tage), n = es.length;
  if (n < MIN_TAGE_ART) return { aktiv: false, n };
  const std = es.reduce((a, t) => a + t.dauerH, 0), fische = es.reduce((a, t) => a + faengeVon(t, art), 0);
  const R = std ? fische / std : 0;
  if (!R) return { aktiv: false, n };
  const fakten: { k: keyof Gruppen; ratio: number; n: number; label: string }[] = [];
  (['druck', 'licht', 'wolken'] as (keyof Gruppen)[]).forEach((k) => {
    const rs = es.filter((t) => tagGruppen(t)[k] === g[k]);
    if (rs.length < 3) return;
    const h = rs.reduce((a, t) => a + t.dauerH, 0), f = rs.reduce((a, t) => a + faengeVon(t, art), 0);
    fakten.push({ k, ratio: clamp((h ? f / h : 0) / R, 0.4, 2.5), n: rs.length, label: LABEL[k][g[k]] });
  });
  if (!fakten.length) return { aktiv: false, n };
  const pf = Math.exp(fakten.reduce((a, f) => a + Math.log(f.ratio), 0) / fakten.length);
  const w = Math.min(0.5, n / 60);
  const score = clamp(basis * (1 - w) + clamp(basis * pf, 0, 10) * w, 0, 10);
  const top = fakten.slice().sort((a, b) => Math.abs(Math.log(b.ratio)) - Math.abs(Math.log(a.ratio)))[0];
  const aussage = top.ratio >= 1.15
    ? `${gross(top.label)} fängst du ${fmt1(top.ratio)}× so viele ${artName(art)} pro Stunde wie im Schnitt (${top.n} Angeltage).`
    : top.ratio <= 0.85
      ? `${gross(top.label)} fängst du nur ${Math.round(top.ratio * 100)} % deines üblichen Schnitts (${top.n} Angeltage).`
      : 'Diese Bedingungen sind bei dir bisher durchschnittlich.';
  const aehnlich = es
    .filter((t) => faengeVon(t, art) > 0 && (['druck', 'licht', 'wolken'] as (keyof Gruppen)[]).filter((k) => tagGruppen(t)[k] === g[k]).length >= 2)
    .sort((a, b) => faengeVon(b, art) / b.dauerH - faengeVon(a, art) / a.dauerH)
    .slice(0, 2);
  return { aktiv: true, n, score, delta: score - basis, aussage, aehnlich };
}

export type GewaesserLernen =
  | { aktiv: false; n: number }
  | { aktiv: true; n: number; faktor: number; gewicht: number; aussage: string };

/** Lernen pro Gewässer: erst ab 10 Angeltagen an diesem Gewässer, Faktor 0,6–1,6 plus Korrektur aus dem Prognose-Feedback. */
export function gewaesserLernen(gewaesserId: string, name: string, tage: Angeltag[]): GewaesserLernen {
  const hier = tage.filter((t) => t.gewaesserId === gewaesserId && t.dauerH > 0), n = hier.length;
  if (n < MIN_TAGE_GEWAESSER) return { aktiv: false, n };
  const rate = (l: Angeltag[]) => { const h = l.reduce((a, t) => a + t.dauerH, 0); return h ? l.reduce((a, t) => a + t.faenge.length, 0) / h : 0; };
  const gesamt = rate(tage.filter((t) => t.dauerH > 0));
  let faktor = gesamt ? clamp(rate(hier) / gesamt, 0.6, 1.6) : 1;
  const roh = faktor;
  const hoch = hier.filter((t) => t.prognoseFeedback && (t.wetter.score ?? 0) >= 7);
  const mittel = hier.filter((t) => t.prognoseFeedback && (t.wetter.score ?? 0) >= 4 && (t.wetter.score ?? 0) < 7);
  if (hoch.length) faktor *= 1 - 0.1 * (hoch.filter((t) => t.prognoseFeedback === 'nein').length / hoch.length);
  if (mittel.length) faktor *= 1 + 0.1 * (mittel.filter((t) => t.prognoseFeedback === 'ja').length / mittel.length);
  const gewicht = Math.min(0.4, n / 50);
  const aussage = roh >= 1.1
    ? `${name}: Hier fängst du ${fmt1(roh)}× so gut wie im Schnitt (${n} Angeltage).`
    : roh <= 0.9
      ? `${name}: Hier fängst du etwas schlechter als im Schnitt, ${Math.round(roh * 100)} % (${n} Angeltage).`
      : `${name}: Hier fängst du etwa so gut wie im Schnitt (${n} Angeltage).`;
  return { aktiv: true, n, faktor, gewicht, aussage };
}

export function mitGewaesser(score: number, g: GewaesserLernen): number {
  if (!g.aktiv) return score;
  return clamp(score * (1 - g.gewicht) + Math.min(10, score * g.faktor) * g.gewicht, 0, 10);
}

// ---------- Mythen-Check ----------

export type MythosGruppe = { gruppe: string; label: string; n: number; rate: number };
export type Mythos = { titel: string; gruppen: MythosGruppe[]; urteil: string };

const MYTHEN: [string, (t: Angeltag) => string | undefined, string[], Record<string, string>][] = [
  ['Luftdruck', (t) => t.wetter.luftdruckTrend, ['fallend', 'stabil', 'steigend'], {}],
  ['Tageszeit', (t) => t.wetter.licht, ['daemmerung', 'tag', 'nacht'], { daemmerung: 'Dämmerung', tag: 'Tag', nacht: 'Nacht' }],
  ['Bewölkung', (t) => t.wetter.bewoelkung, ['klar', 'wechselnd', 'bedeckt'], {}],
  ['Wassertrübung', (t) => t.wetter.truebung, ['klar', 'leicht', 'trueb', 'braun'], { klar: 'Klar', leicht: 'Leicht trüb', trueb: 'Stark trüb', braun: 'Moorwasser' }],
  ['Mond', (t) => t.wetter.mond, ['Neumond', 'zunehmend', 'Vollmond', 'abnehmend'], {}],
];

export function mythenCheck(tage: Angeltag[], wert: 'fische' | 'bisse' = 'fische'): Mythos[] {
  return MYTHEN.map(([titel, get, gruppen, lab]) => {
    const agg = gruppen.map((g) => {
      const r = tage.filter((t) => get(t) === g && t.dauerH > 0);
      const h = r.reduce((a, t) => a + t.dauerH, 0);
      const f = r.reduce((a, t) => a + (wert === 'fische' ? t.faenge.length : Math.max(t.bisse, t.faenge.length)), 0);
      return { gruppe: g, label: lab[g] ?? g, n: r.length, rate: h ? f / h : 0 };
    });
    const ok = agg.filter((a) => a.n >= 4);
    let urteil = 'Noch zu wenige Angeltage je Gruppe.';
    if (ok.length >= 2) {
      const hi = ok.reduce((a, b) => (b.rate > a.rate ? b : a)), lo = ok.reduce((a, b) => (b.rate < a.rate ? b : a));
      const ratio = lo.rate ? hi.rate / lo.rate : 9;
      urteil = ratio >= 1.5 ? `Deutlich: „${hi.label}“ bringt etwa ${fmt1(Math.min(ratio, 9))}× so viel ${wert === 'fische' ? 'Fisch' : 'Bisse'} pro Stunde.`
        : ratio >= 1.2 ? `Leichter Vorteil für „${hi.label}“, kann Zufall sein.` : 'Kein klarer Effekt.';
    }
    return { titel, gruppen: agg, urteil };
  });
}

// ---------- Was bei dir fängt (Köderfarbe je Trübung) ----------

export function farbAuswertung(t: Truebung, tage: Angeltag[], art?: string): { farbe: Farbfamilie; n: number; gesamt: number } | null {
  const cnt = new Map<Farbfamilie, number>();
  let gesamt = 0;
  tage.forEach((d) => {
    if (d.wetter.truebung !== t) return;
    d.faenge.forEach((f) => {
      if (!f.koederFarbe || (art && f.fischart !== art)) return;
      cnt.set(f.koederFarbe, (cnt.get(f.koederFarbe) ?? 0) + 1);
      gesamt++;
    });
  });
  const top = [...cnt.entries()].sort((a, b) => b[1] - a[1])[0];
  return top && gesamt >= 3 ? { farbe: top[0], n: top[1], gesamt } : null;
}

export function koederAuswertung(t: Truebung, tage: Angeltag[], art?: string): { koeder: string; n: number } | null {
  const cnt = new Map<string, number>();
  tage.forEach((d) => {
    if (d.wetter.truebung !== t) return;
    d.faenge.forEach((f) => {
      if (f.koeder && (!art || f.fischart === art)) cnt.set(f.koeder.trim(), (cnt.get(f.koeder.trim()) ?? 0) + 1);
    });
  });
  const top = [...cnt.entries()].sort((a, b) => b[1] - a[1])[0];
  return top && top[1] >= 2 ? { koeder: top[0], n: top[1] } : null;
}

export const EHRLICH_HINWEIS = 'Zeigt, womit du gefangen hast, nicht welche Farbe besser ist: Was man oft fischt, fängt auch öfter.';
