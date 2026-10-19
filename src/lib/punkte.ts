// Gamification: belohnt das Eintragen, nie die Menge an Fisch. Punkte werden immer neu berechnet, nicht gespeichert.
import type { Angeltag, Fang, Koeder } from '../db';
import { teile, zeitpunkt, TAG } from './zeit';

export const ALARM = 7;

export const RAENGE: [number, string][] = [
  [0, 'Wurmbader'], [100, 'Stippfischer'], [250, 'Uferläufer'], [500, 'Petrijünger'], [900, 'Gewässerkenner'],
  [1500, 'Uferprofi'], [2400, 'Fischflüsterer'], [3600, 'Wetterversteher'], [5000, 'Altmeister'], [7000, 'Petri-Legende'],
];

export function rangVon(p: number): { i: number; name: string; ab: number; naechster: [number, string] | null } {
  let i = 0;
  RAENGE.forEach((r, j) => { if (p >= r[0]) i = j; });
  return { i, name: RAENGE[i][1], ab: RAENGE[i][0], naechster: RAENGE[i + 1] ?? null };
}

const chronologisch = (tage: Angeltag[]) => tage.slice().sort((a, b) => a.startTs - b.startTs);
const fangScore = (f: Fang, t: Angeltag) => f.score ?? t.wetter.score ?? 0;

export const PUNKTE_TEXT = 'Punkte gibt es fürs Eintragen, nicht für die Menge Fisch: Angeltag 10, Schneidertag 15, live geloggt +5, Wasser-Check +3, Prognose bewertet +2, Köder eingetragen +2, Fangfoto +2, Köder fotografiert +2, neue Art 25, Fang im Alarm-Fenster 20, neuer PB 15, Abzeichen-Stufe 10, Saisonziel 15.';

/** Punkte nur aus Angeltagen und Köderbox (ohne Abzeichen und Saisonziele). */
export function grundpunkte(tage: Angeltag[], koeder: Koeder[] = []): number {
  let p = 0;
  const arten = new Set<string>();
  const best: Record<string, number> = {};
  chronologisch(tage).forEach((t) => {
    p += t.faenge.length ? 10 : 15;
    if (t.live) p += 5;
    if (t.wasserCheck) p += 3;
    if (t.prognoseFeedback) p += 2;
    t.faenge.forEach((f) => {
      if (f.koeder || f.koederId) p += 2;
      if (f.fotoId) p += 2;
      if (!arten.has(f.fischart)) { arten.add(f.fischart); p += 25; }
      if (f.laengeCm) {
        if (best[f.fischart] && f.laengeCm > best[f.fischart]) p += 15;
        best[f.fischart] = Math.max(best[f.fischart] ?? 0, f.laengeCm);
      }
    });
    if (t.faenge.some((f) => fangScore(f, t) >= ALARM)) p += 20;
  });
  return p + koeder.filter((k) => k.fotoId).length * 2;
}

export function punkte(tage: Angeltag[], koeder: Koeder[] = [], jetzt = Date.now()): number {
  const stufen = abzeichen(tage, koeder).reduce((a, b) => a + b.stufe, 0);
  const ziele = saisonzieleAlle(tage, jetzt).filter((z) => z.erreicht).length;
  return grundpunkte(tage, koeder) + stufen * 10 + ziele * 15;
}

// ---------- Abzeichen in Stufen ----------

export type Abzeichen = {
  id: string; n: string; d: string; ic: string; v: number;
  stufen: number[]; // Bronze, Silber, Gold (einstufig: eine Zahl)
  stufe: number; // erreichte Stufen 0–3
  naechstes: number | null;
};

export const STUFEN_NAME = ['', 'Bronze', 'Silber', 'Gold'];

export function abzeichen(tage: Angeltag[], koeder: Koeder[] = []): Abzeichen[] {
  const alle = tage.flatMap((t) => t.faenge.map((f) => ({ f, t })));
  const proGewaesser = new Map<string, number>();
  tage.forEach((t) => proGewaesser.set(t.gewaesserId, (proGewaesser.get(t.gewaesserId) ?? 0) + 1));
  const koederMitFang = new Set(alle.map(({ f }) => f.koederId || f.koeder).filter(Boolean));
  const roh: Omit<Abzeichen, 'stufe' | 'naechstes'>[] = [
    { id: 'first', n: 'Erster Wurf', d: 'Angeltage eingetragen', ic: 'hook', v: tage.length, stufen: [1, 25, 100] },
    { id: 'honest', n: 'Ehrlicher Angler', d: 'Schneidertage eingetragen', ic: 'check', v: tage.filter((t) => !t.faenge.length).length, stufen: [5, 15, 40] },
    { id: 'dawn', n: 'Frühaufsteher', d: 'Angeltage in der Dämmerung', ic: 'dawn', v: tage.filter((t) => t.wetter.licht === 'daemmerung').length, stufen: [5, 15, 40] },
    { id: 'night', n: 'Nachteule', d: 'Angeltage nachts', ic: 'moon', v: tage.filter((t) => t.wetter.licht === 'nacht').length, stufen: [5, 15, 40] },
    { id: 'species', n: 'Artenkenner', d: 'verschiedene Arten gefangen', ic: 'fish', v: new Set(alle.map(({ f }) => f.fischart)).size, stufen: [3, 8, 15] },
    { id: 'hit', n: 'Treffsicher', d: 'Fänge im Alarm-Fenster', ic: 'target', v: alle.filter(({ f, t }) => fangScore(f, t) >= ALARM).length, stufen: [3, 10, 30] },
    { id: 'bites', n: 'Bissanzeiger', d: 'Bisse protokolliert', ic: 'bell', v: tage.reduce((a, t) => a + (t.bisse || 0), 0), stufen: [50, 200, 750] },
    { id: 'photo', n: 'Fotobeweis', d: 'Fänge mit Foto', ic: 'camera', v: alle.filter(({ f }) => f.fotoId).length, stufen: [10, 40, 150] },
    { id: 'farben', n: 'Farbenlehre', d: 'Köder fotografiert', ic: 'camera', v: koeder.filter((k) => k.fotoId).length, stufen: [10, 25, 60] },
    { id: 'koeder', n: 'Köderflüsterer', d: 'Köder mit Fang', ic: 'hook', v: koederMitFang.size, stufen: [5, 12, 25] },
    { id: 'stamm', n: 'Stammgast', d: 'Angeltage am selben Gewässer', ic: 'pin', v: Math.max(0, ...proGewaesser.values()), stufen: [10, 30, 75] },
    { id: 'explore', n: 'Entdecker', d: 'verschiedene Gewässer', ic: 'map', v: proGewaesser.size, stufen: [5, 12, 25] },
    { id: 'wetterfest', n: 'Wetterfest', d: 'Angeltage bei fallendem Druck und bedecktem Himmel', ic: 'cloud',
      v: tage.filter((t) => t.wetter.luftdruckTrend === 'fallend' && t.wetter.bewoelkung === 'bedeckt').length, stufen: [3, 10, 25] },
    { id: 'myth', n: 'Mythenjäger', d: 'Angeltage, schaltet den Mythen-Check frei', ic: 'lens', v: tage.length, stufen: [20] },
  ];
  return roh.map((a) => {
    const stufe = a.stufen.filter((s) => a.v >= s).length;
    return { ...a, stufe, naechstes: a.stufen[stufe] ?? null };
  });
}

/** Schlüssel der erreichten Stufen, z. B. „honest:2“. */
export const stufenKeys = (l: Abzeichen[]) => l.flatMap((a) => Array.from({ length: a.stufe }, (_, i) => `${a.id}:${i + 1}`));

// ---------- PBs ----------

/** Bisher größte Länge einer Art (ohne den Fang mit ausserId). */
export function bisherBest(faenge: Fang[], art: string, ausserId?: string): number {
  return faenge.reduce((m, f) => (f.fischart === art && f.laengeCm && f.id !== ausserId ? Math.max(m, f.laengeCm) : m), 0);
}

/** PB-Verlauf einer Art: jeder neue Rekord in zeitlicher Reihenfolge. */
export function pbVerlauf(tage: Angeltag[], art: string): { f: Fang; t: Angeltag }[] {
  const l = chronologisch(tage).flatMap((t) => t.faenge.filter((f) => f.fischart === art && f.laengeCm).map((f) => ({ f, t })))
    .sort((a, b) => a.f.zeit - b.f.zeit);
  const out: { f: Fang; t: Angeltag }[] = [];
  let m = 0;
  l.forEach((x) => { if (x.f.laengeCm! > m) { m = x.f.laengeCm!; out.push(x); } });
  return out;
}

// ---------- Saisonziele ----------

export type Saison = 'fruehling' | 'sommer' | 'herbst' | 'winter';
export const SAISON_NAME: Record<Saison, string> = { fruehling: 'Frühling', sommer: 'Sommer', herbst: 'Herbst', winter: 'Winter' };

/** Saison zu einem Zeitpunkt mit Beginn und Ende (Winter = Dez. bis Feb.). */
export function saisonVon(ts: number): { s: Saison; jahr: number; start: number; ende: number } {
  const t = teile(ts);
  const m = t.m;
  const s: Saison = m >= 3 && m <= 5 ? 'fruehling' : m >= 6 && m <= 8 ? 'sommer' : m >= 9 && m <= 11 ? 'herbst' : 'winter';
  const jahr = s === 'winter' && m <= 2 ? t.y - 1 : t.y;
  const startM = { fruehling: 3, sommer: 6, herbst: 9, winter: 12 }[s];
  const start = zeitpunkt(`${jahr}-${String(startM).padStart(2, '0')}-01`, '00:00');
  const endeJ = s === 'winter' ? jahr + 1 : jahr, endeM = s === 'winter' ? 3 : startM + 3;
  const ende = zeitpunkt(`${endeJ}-${String(endeM).padStart(2, '0')}-01`, '00:00');
  return { s, jahr, start, ende };
}

export type Ziel = { id: string; text: string; v: number; ziel: number; erreicht: boolean };

function zieleFuer(tage: Angeltag[], start: number, ende: number): Ziel[] {
  const inS = (von: number, bis: number) => tage.filter((t) => t.startTs >= von && t.startTs < bis);
  const jetztT = inS(start, ende), vorT = inS(start - 365 * TAG, ende - 365 * TAG);
  const vorher = new Set(tage.filter((t) => t.startTs < start).map((t) => t.gewaesserId));
  const neueGw = new Set(jetztT.map((t) => t.gewaesserId).filter((g) => !vorher.has(g))).size;
  const vorherVJ = new Set(tage.filter((t) => t.startTs < start - 365 * TAG).map((t) => t.gewaesserId));
  const neueGwVJ = new Set(vorT.map((t) => t.gewaesserId).filter((g) => !vorherVJ.has(g))).size;
  const checks = jetztT.filter((t) => t.wasserCheck).length, checksVJ = vorT.filter((t) => t.wasserCheck).length;
  const tageZiel = vorT.length ? Math.max(5, Math.ceil(vorT.length * 1.1)) : 8;
  const gwZiel = neueGwVJ ? Math.max(1, neueGwVJ) : 2;
  const checkZiel = checksVJ ? Math.max(3, checksVJ + 1) : 5;
  return [
    { id: 'tage', text: `${tageZiel} Angeltage`, v: jetztT.length, ziel: tageZiel, erreicht: jetztT.length >= tageZiel },
    { id: 'gewaesser', text: `${gwZiel} neue${gwZiel === 1 ? 's Gewässer' : ' Gewässer'}`, v: neueGw, ziel: gwZiel, erreicht: neueGw >= gwZiel },
    { id: 'checks', text: `${checkZiel} Wasser-Checks`, v: checks, ziel: checkZiel, erreicht: checks >= checkZiel },
  ];
}

export function saisonziele(tage: Angeltag[], jetzt = Date.now()) {
  const s = saisonVon(jetzt);
  return { ...s, ziele: zieleFuer(tage, s.start, s.ende), restTage: Math.max(0, Math.ceil((s.ende - jetzt) / TAG)) };
}

/** Alle Ziele aller Saisons seit dem ersten Angeltag (für die Punkte). */
export function saisonzieleAlle(tage: Angeltag[], jetzt = Date.now()): Ziel[] {
  if (!tage.length) return [];
  const erster = Math.min(...tage.map((t) => t.startTs));
  const out: Ziel[] = [];
  let s = saisonVon(erster);
  for (let i = 0; i < 400 && s.start <= jetzt; i++) {
    out.push(...zieleFuer(tage, s.start, s.ende));
    s = saisonVon(s.ende + TAG);
  }
  return out;
}
