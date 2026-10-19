// Jahresrückblick: nur aus eigenen Daten. Ab 1. Dezember für das laufende Jahr, jederzeit für vergangene Jahre.
import type { Angeltag, Fang, Koeder } from '../db';
import { abzeichen, punkte, rangVon, stufenKeys } from './punkte';
import { farbAuswertung } from './lernen';
import type { Farbfamilie, Truebung } from './wasser';
import { teile, zeitpunkt } from './zeit';

const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

export type Rueckblick = {
  jahr: number; tage: number; stunden: number; faenge: number; schneider: number;
  neuePBs: { f: Fang; t: Angeltag; vorher: number }[];
  meistGewaesser: { name: string; n: number } | null;
  bestesGewaesser: { name: string; rate: number; n: number } | null;
  besterKoeder: { name: string; n: number } | null;
  farben: { truebung: Truebung; farbe: Farbfamilie; n: number; gesamt: number }[];
  besterMonat: { name: string; rate: number; n: number } | null;
  rangStart: string; rangEnde: string; punkteJahr: number;
  neueAbzeichen: string[];
};

export function verfuegbareJahre(tage: Angeltag[], jetzt = Date.now()): number[] {
  const t = teile(jetzt);
  const jahre = new Set(tage.map((d) => +d.datum.slice(0, 4)));
  return [...jahre].filter((j) => j < t.y || (j === t.y && t.m === 12)).sort((a, b) => b - a);
}

export function rueckblick(alle: Angeltag[], jahr: number, koeder: Koeder[] = []): Rueckblick {
  const start = zeitpunkt(`${jahr}-01-01`, '00:00'), ende = zeitpunkt(`${jahr + 1}-01-01`, '00:00');
  const tage = alle.filter((t) => t.startTs >= start && t.startTs < ende);
  const vorher = alle.filter((t) => t.startTs < start), bisEnde = alle.filter((t) => t.startTs < ende);
  const rate = (l: Angeltag[]) => { const h = l.reduce((a, t) => a + t.dauerH, 0); return h ? l.reduce((a, t) => a + t.faenge.length, 0) / h : 0; };

  // Neue PBs im Jahr (ein Fang schlägt den bisherigen Rekord seiner Art)
  const best: Record<string, number> = {};
  const neuePBs: Rueckblick['neuePBs'] = [];
  bisEnde.slice().sort((a, b) => a.startTs - b.startTs).forEach((t) => t.faenge.forEach((f) => {
    if (!f.laengeCm) return;
    const b = best[f.fischart] ?? 0;
    if (f.laengeCm > b) { if (t.startTs >= start) neuePBs.push({ f, t, vorher: b }); best[f.fischart] = f.laengeCm; }
  }));

  const proGw = new Map<string, Angeltag[]>();
  tage.forEach((t) => proGw.set(t.gewaesserName, [...(proGw.get(t.gewaesserName) ?? []), t]));
  const gw = [...proGw.entries()];
  const meist = gw.sort((a, b) => b[1].length - a[1].length)[0];
  const bestGw = gw.filter(([, l]) => l.length >= 2).map(([name, l]) => ({ name, rate: rate(l), n: l.length })).sort((a, b) => b.rate - a.rate)[0];

  const kz = new Map<string, number>();
  tage.forEach((t) => t.faenge.forEach((f) => { if (f.koeder) kz.set(f.koeder, (kz.get(f.koeder) ?? 0) + 1); }));
  const bk = [...kz.entries()].sort((a, b) => b[1] - a[1])[0];

  const farben = (['klar', 'leicht', 'trueb', 'braun'] as Truebung[])
    .map((tr) => { const r = farbAuswertung(tr, tage); return r ? { truebung: tr, ...r } : null; })
    .filter(Boolean) as Rueckblick['farben'];

  const proMonat = new Map<number, Angeltag[]>();
  tage.forEach((t) => { const m = +t.datum.slice(5, 7) - 1; proMonat.set(m, [...(proMonat.get(m) ?? []), t]); });
  const bm = [...proMonat.entries()].filter(([, l]) => l.length >= 2).map(([m, l]) => ({ name: MONATE[m], rate: rate(l), n: l.length })).sort((a, b) => b.rate - a.rate)[0];

  const kVor = koeder.filter((k) => k.angelegt < start), kEnde = koeder.filter((k) => k.angelegt < ende);
  const pVor = punkte(vorher, kVor, start - 1), pEnde = punkte(bisEnde, kEnde, ende - 1);
  const aVor = stufenKeys(abzeichen(vorher, kVor));
  const aEnde = abzeichen(bisEnde, kEnde);
  const neueAbzeichen = [...new Set(stufenKeys(aEnde).filter((k) => !aVor.includes(k)).map((k) => aEnde.find((a) => a.id === k.split(':')[0])!.n))];

  return {
    jahr, tage: tage.length, stunden: Math.round(tage.reduce((a, t) => a + t.dauerH, 0) * 10) / 10,
    faenge: tage.reduce((a, t) => a + t.faenge.length, 0), schneider: tage.filter((t) => !t.faenge.length).length,
    neuePBs, meistGewaesser: meist ? { name: meist[0], n: meist[1].length } : null, bestesGewaesser: bestGw ?? null,
    besterKoeder: bk ? { name: bk[0], n: bk[1] } : null, farben, besterMonat: bm ?? null,
    rangStart: rangVon(pVor).name, rangEnde: rangVon(pEnde).name, punkteJahr: pEnde - pVor, neueAbzeichen,
  };
}
