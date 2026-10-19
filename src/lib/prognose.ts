// Verbindet Wetterreihe, Wassertemperatur, Sonne, Mond und Artprofil zur 7-Tage-Prognose.
import { lichtKlasse, mond, type Licht, type Mondgruppe } from './astro';
import { bestesFenster, bewerte, type Bedingungen, type Bewertung } from './score';
import { wasserTempReihe, wasserTempZu, type GewaesserTyp } from './wassertemp';
import { teile, STUNDE } from './zeit';

/** Eine Wetterstunde (Werte von Open-Meteo). */
export type Stunde = {
  ts: number; // Beginn der Stunde (ms)
  t: number; // Lufttemperatur °C
  p: number; // Luftdruck auf Meereshöhe hPa
  c: number; // Bewölkung %
  w: number; // Wind km/h
  rp: number; // Regenwahrscheinlichkeit %
};

export type WetterReihe = { lat: number; lon: number; abgerufen: number; stunden: Stunde[] };

export type Ort = { lat: number; lon: number; typ: GewaesserTyp };

export type StundenWert = { ts: number; h: number; s: Stunde; b: Bedingungen; bew: Bewertung };
export type TagesPrognose = { key: string; start: number; stunden: StundenWert[]; bestes: { start: number; avg: number; ts: number } };

/** Hilfsdaten für einen Ort: Tagesgrenzen, Wassertemperatur. Einmal je Reihe und Gewässertyp berechnen. */
export function vorbereiten(reihe: WetterReihe, typ: GewaesserTyp) {
  const tage: { key: string; start: number; idx: number[] }[] = [];
  reihe.stunden.forEach((s, i) => {
    const k = teile(s.ts).key;
    const last = tage[tage.length - 1];
    if (last && last.key === k) last.idx.push(i);
    else tage.push({ key: k, start: s.ts, idx: [i] });
  });
  const mittel = tage.map((d) => d.idx.reduce((a, i) => a + reihe.stunden[i].t, 0) / d.idx.length);
  const wt = wasserTempReihe(mittel, typ);
  return { tage, tagStart: tage.map((d) => d.start), wt };
}

export type Vorbereitet = ReturnType<typeof vorbereiten>;

/** Bedingungen der Stunde i der Reihe. */
export function bedingungen(reihe: WetterReihe, v: Vorbereitet, i: number): Bedingungen {
  const s = reihe.stunden[i];
  const vor = reihe.stunden[i - 12];
  return {
    wasserTemp: wasserTempZu(s.ts, v.tagStart, v.wt),
    licht: lichtKlasse(s.ts, reihe.lat, reihe.lon),
    bewoelkung: s.c,
    wind: s.w,
    dp: vor ? s.p - vor.p : 0,
    mond: mond(s.ts).gruppe,
  };
}

/** Index der Stunde, die ts enthält, oder -1. */
export function stundenIndex(reihe: WetterReihe, ts: number): number {
  const st = reihe.stunden;
  if (!st.length) return -1;
  const i = Math.floor((ts - st[0].ts) / STUNDE);
  return i >= 0 && i < st.length ? i : -1;
}

/** Prognose ab dem Tag von `ab` für bis zu 7 Tage. */
export function prognose(reihe: WetterReihe, typ: GewaesserTyp, art: string, ab = Date.now(), tageAnzahl = 7): TagesPrognose[] {
  const v = vorbereiten(reihe, typ);
  const heute = teile(ab).key;
  const erster = v.tage.findIndex((d) => d.key >= heute);
  if (erster < 0) return [];
  const out: TagesPrognose[] = [];
  for (let d = erster; d < v.tage.length && out.length < tageAnzahl; d++) {
    const tag = v.tage[d];
    if (tag.idx.length < 20) continue; // unvollständiger Tag am Rand der Daten
    const idx = tag.idx.concat(v.tage[d + 1]?.idx.slice(0, 2) ?? []);
    const werte: StundenWert[] = idx.map((i) => {
      const b = bedingungen(reihe, v, i);
      return { ts: reihe.stunden[i].ts, h: teile(reihe.stunden[i].ts).h, s: reihe.stunden[i], b, bew: bewerte(b, art) };
    });
    const tagWerte = werte.slice(0, tag.idx.length);
    // Für heute nur Fenster, die noch nicht vorbei sind.
    let von = 0;
    if (tag.key === heute) von = Math.max(0, Math.min(21, tagWerte.findIndex((w) => w.ts + 3 * STUNDE > ab)));
    const best = bestesFenster(werte.map((w) => w.bew.score), von);
    out.push({ key: tag.key, start: tag.start, stunden: tagWerte, bestes: { ...best, ts: werte[best.start].ts } });
  }
  return out;
}

export type Schnappschuss = {
  luftdruckTrend: 'fallend' | 'stabil' | 'steigend'; luftdruckHpa: number; dp: number;
  bewoelkung: 'klar' | 'wechselnd' | 'bedeckt'; bewoelkungProzent: number; windKmh: number;
  regenWahrscheinlichkeit: number; lufttemp: number;
  licht: Licht; mond: Mondgruppe; wasserTempGeschaetzt: number; score: number;
};

export const druckGruppe = (dp: number): Schnappschuss['luftdruckTrend'] => (dp < -2 ? 'fallend' : dp > 2 ? 'steigend' : 'stabil');
export const wolkenGruppe = (c: number): Schnappschuss['bewoelkung'] => (c > 70 ? 'bedeckt' : c < 30 ? 'klar' : 'wechselnd');

/** Wetter-Schnappschuss für einen Zeitpunkt, oder null wenn die Reihe ihn nicht abdeckt. */
export function schnappschuss(reihe: WetterReihe, typ: GewaesserTyp, art: string, ts: number): Schnappschuss | null {
  const i = stundenIndex(reihe, ts);
  if (i < 12) return null;
  const v = vorbereiten(reihe, typ);
  const b = bedingungen(reihe, v, i);
  const s = reihe.stunden[i];
  return {
    luftdruckTrend: druckGruppe(b.dp), luftdruckHpa: Math.round(s.p), dp: Math.round(b.dp * 10) / 10,
    bewoelkung: wolkenGruppe(s.c), bewoelkungProzent: Math.round(s.c), windKmh: Math.round(s.w),
    regenWahrscheinlichkeit: Math.round(s.rp), lufttemp: Math.round(s.t * 10) / 10,
    licht: b.licht, mond: b.mond, wasserTempGeschaetzt: Math.round(b.wasserTemp * 10) / 10,
    score: Math.round(bewerte(b, art).score * 10) / 10,
  };
}
