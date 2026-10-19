// Mondphase und Sonnenauf-/-untergang (Formeln aus dem Prototyp).
import { clamp, teile, STUNDE, TAG } from './zeit';

export type Mondgruppe = 'Neumond' | 'zunehmend' | 'Vollmond' | 'abnehmend';
export type Mond = { alter: number; beleuchtung: number; name: string; gruppe: Mondgruppe; anteil: number };

const SYNODISCH = 29.530588853;

export function mond(ts: number): Mond {
  const alter = ((((ts - Date.UTC(2000, 0, 6, 18, 14)) / TAG) % SYNODISCH) + SYNODISCH) % SYNODISCH;
  const beleuchtung = (1 - Math.cos((2 * Math.PI * alter) / SYNODISCH)) / 2;
  let name: string, gruppe: Mondgruppe;
  if (alter < 1.85 || alter > 27.68) { name = 'Neumond'; gruppe = 'Neumond'; }
  else if (alter < 12.92) { name = alter < 7.38 ? 'Zunehmende Sichel' : alter < 9.23 ? 'Erstes Viertel' : 'Zunehmend'; gruppe = 'zunehmend'; }
  else if (alter < 16.61) { name = 'Vollmond'; gruppe = 'Vollmond'; }
  else { name = alter < 20.3 ? 'Abnehmend' : alter < 22.15 ? 'Letztes Viertel' : 'Abnehmende Sichel'; gruppe = 'abnehmend'; }
  return { alter, beleuchtung, name, gruppe, anteil: alter / SYNODISCH };
}

/** Sonnenauf- und -untergang (ms) am Kalendertag von ts für den Ort lat/lon. */
export function sonne(ts: number, lat: number, lon: number): { auf: number; unter: number } {
  const p = teile(ts);
  const doy = Math.floor((Date.UTC(p.y, p.m - 1, p.d) - Date.UTC(p.y, 0, 0)) / TAG);
  const dec = ((23.44 * Math.sin((2 * Math.PI * (284 + doy)) / 365)) * Math.PI) / 180;
  const la = (lat * Math.PI) / 180;
  const ha = (Math.acos(clamp((Math.sin((-0.833 * Math.PI) / 180) - Math.sin(la) * Math.sin(dec)) / (Math.cos(la) * Math.cos(dec)), -1, 1)) * 180) / Math.PI;
  const B = (2 * Math.PI * (doy - 81)) / 364;
  const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const mittag = 12 - lon / 15 - eot / 60;
  const basis = Date.UTC(p.y, p.m - 1, p.d);
  return { auf: basis + (mittag - ha / 15) * STUNDE, unter: basis + (mittag + ha / 15) * STUNDE };
}

export type Licht = 'daemmerung' | 'tag' | 'nacht';

/** Lichtklasse der Stunde ab ts: Dämmerung = ±75 min um Auf- und Untergang (gemessen an der Stundenmitte). */
export function lichtKlasse(ts: number, lat: number, lon: number): Licht {
  const s = sonne(ts, lat, lon);
  const mitte = ts + STUNDE / 2;
  if (Math.abs(mitte - s.auf) <= 75 * 6e4 || Math.abs(mitte - s.unter) <= 75 * 6e4) return 'daemmerung';
  return mitte > s.auf && mitte < s.unter ? 'tag' : 'nacht';
}

export const LICHT_NAME: Record<Licht, string> = { daemmerung: 'Dämmerung', tag: 'Tag', nacht: 'Nacht' };
