// Geschätzte Wassertemperatur: exponentielle Glättung der Tagesmittel der Lufttemperatur.
// W(t) = W(t−1) + (Luft(t) − W(t−1)) · (1 − e^(−1/τ)) + Versatz. Anzeige immer „geschätzt, ±2 °C“.
import { clamp, TAG } from './zeit';

export type GewaesserTyp = 'fluss' | 'bach' | 'kanal' | 'teich' | 'see' | 'talsperre';

export const GEWAESSER_TYPEN: Record<GewaesserTyp, { name: string; tau: number; versatz: number }> = {
  fluss: { name: 'Fluss', tau: 4, versatz: 0 },
  bach: { name: 'Bach', tau: 3, versatz: -0.5 },
  kanal: { name: 'Kanal', tau: 6, versatz: 0.2 },
  teich: { name: 'Teich', tau: 4, versatz: 0.3 },
  see: { name: 'See', tau: 9, versatz: 0.5 },
  talsperre: { name: 'Talsperre', tau: 14, versatz: 0.8 },
};

/** Tageswerte der geschätzten Wassertemperatur zu den Tagesmitteln der Luft (ältester Tag zuerst). */
export function wasserTempReihe(tagesmittel: number[], typ: GewaesserTyp): number[] {
  if (!tagesmittel.length) return [];
  const { tau, versatz } = GEWAESSER_TYPEN[typ];
  const a = 1 - Math.exp(-1 / tau);
  const w = [tagesmittel[0] + 1.5];
  for (let i = 1; i < tagesmittel.length; i++) w.push(w[i - 1] + (tagesmittel[i] - w[i - 1]) * a);
  return w.map((v) => v + versatz);
}

/** Wert zum Zeitpunkt ts, linear zwischen den Tagesmitten interpoliert. tagStart[i] = Beginn von Tag i. */
export function wasserTempZu(ts: number, tagStart: number[], reihe: number[]): number {
  if (!reihe.length) return NaN;
  const x = (ts - tagStart[0]) / TAG - 0.5;
  const i = clamp(Math.floor(x), 0, reihe.length - 1), j = clamp(i + 1, 0, reihe.length - 1);
  const f = clamp(x - Math.floor(x), 0, 1);
  return reihe[i] + (reihe[j] - reihe[i]) * f;
}
