// Wasser-Check und Köderfarben: Faustregeln aus der Angelpraxis, keine Garantie.
// Die Bildauswertungen arbeiten auf Pixeldaten, die das Gerät selbst liefert (kein Upload).
import type { Licht } from './astro';

export type Truebung = 'klar' | 'leicht' | 'trueb' | 'braun';
export const TRUEBUNG: Record<Truebung, { n: string; d: string }> = {
  klar: { n: 'Klar', d: 'Sicht über 1 m' },
  leicht: { n: 'Leicht trüb', d: 'Sicht 30 cm – 1 m' },
  trueb: { n: 'Stark trüb', d: 'Sicht unter 30 cm' },
  braun: { n: 'Moorwasser', d: 'tee- bis braunfarben' },
};

export type Farbfamilie =
  | 'natur' | 'weissfisch' | 'weiss' | 'chartreuse' | 'orange' | 'firetiger' | 'gold' | 'motoroil' | 'schwarz' | 'rotpink' | 'ghost' | 'uv';

export const FARBEN: Record<Farbfamilie, [string, string]> = {
  natur: ['Barsch-Dekor', '#6f8a3c'],
  weissfisch: ['Weißfisch/Silber', '#c9cfd4'],
  weiss: ['Weiß/Perlmutt', '#f5f3ed'],
  chartreuse: ['Chartreuse', '#c6e81c'],
  orange: ['Gelb/Orange', '#f29b1c'],
  firetiger: ['Firetiger', '#e8a41e'],
  gold: ['Gold/Kupfer', '#c8962e'],
  motoroil: ['Motoroil/Braun', '#6b4a2b'],
  schwarz: ['Schwarz/Dunkel', '#1d2224'],
  rotpink: ['Rot/Pink', '#e0457b'],
  ghost: ['Transparent', '#e3ece8'],
  uv: ['UV/Glow', '#9b6cff'],
};

const RAT: Record<Truebung, [Farbfamilie[], string]> = {
  klar: [['natur', 'weissfisch', 'ghost'], 'Klares Wasser: Fische sehen gut. Natürliche, dezente Farben wirken echter.'],
  leicht: [['weiss', 'chartreuse', 'firetiger'], 'Leicht trüb: helle Farben mit etwas Kontrast bleiben gut sichtbar.'],
  trueb: [['chartreuse', 'orange', 'firetiger'], 'Stark trüb: grelle Farben mit starkem Kontrast. Druckwelle und Rassel zählen jetzt mehr als die Farbe.'],
  braun: [['gold', 'orange', 'chartreuse'], 'Moorwasser: Gold, Kupfer und Orange leuchten darin am besten.'],
};

export function koederRat(t: Truebung, licht: Licht): { farben: Farbfamilie[]; warum: string; tipps: string[] } {
  let farben = RAT[t][0].slice();
  const tipps: string[] = [];
  if (licht !== 'tag') {
    farben = ['schwarz', farben[0], 'uv'];
    tipps.push('Bei wenig Licht wirkt eine dunkle Silhouette gegen den helleren Himmel oft besser als Farbe.');
  }
  tipps.push('Rot verschwindet ab etwa 3 m Tiefe, Grün, Gelb und Weiß bleiben länger sichtbar.', 'Kontrast zum Grund: dunkler Köder über hellem Grund, heller Köder über dunklem.');
  return { farben, warum: RAT[t][1], tipps };
}

// Beispiel-Dekore von Nays (VNM). Codes laut Hersteller, Zeichnung eigen, keine Herstellerempfehlung.
export const NAYS_URL = 'https://naysbaits.com/en-us/collections/softbaits/products/vnm';
export const NAYS: Record<string, [string, string, string, string | null]> = {
  C01: ['Oliv, hellgrauer Bauch', '#6b6f3a', '#c9cbc4', null],
  C02: ['Motoröl, hellblauer Glitter', '#6a5a2a', '#8f7d45', '#9fd3ff'],
  C04: ['Schwarz, Blau- und Goldglitter', '#1b1d22', '#2b2e35', '#e2c056'],
  C05: ['Dunkelgrün, hellgrüner Bauch', '#2f5a32', '#a6d08a', null],
  C06: ['Gold-Orange, heller Bauch, Glitter', '#e08a1e', '#f6e3b8', '#fff2b0'],
  C07: ['Gelbgrün (Chartreuse)', '#c6e81c', '#e8f7a8', '#2a2a2a'],
  C12: ['Hellblau, weißer Bauch, Goldglitter', '#8fb8d8', '#f4f6f8', '#e2c056'],
  C13: ['Rotbraun, roter Glitter', '#8a3a25', '#c9a07a', '#e04a3a'],
  C14: ['Braungrau, Silberglitter', '#6e6658', '#d6d6d2', '#eef3f6'],
};

export const TRUEBUNG_TIPPS: Record<Truebung, { nays: string[]; dekor: string; tun: string[] }> = {
  klar: { nays: ['C01', 'C14', 'C05'], dekor: 'Natürliche Dekore wie Oliv, Braungrau oder Barsch-Grün, wenig Glitter. Eher kleiner und schlanker Köder.',
    tun: ['Fische sehen gut und sind vorsichtiger: feines Vorfach (Fluorocarbon), weiter werfen.', 'Bei Sonne tiefer oder im Schatten fischen, Dämmerung nutzen.'] },
  leicht: { nays: ['C12', 'C02', 'C07'], dekor: 'Helle Grundfarbe mit Kontrastbauch oder Motoröl mit Glitter. Normale Ködergröße.',
    tun: ['Gute Bedingungen: Fische sind weniger scheu als bei klarem Wasser.', 'Verschiedene Farben durchprobieren, die Bandbreite ist groß.'] },
  trueb: { nays: ['C07', 'C06', 'C04'], dekor: 'Grell (Chartreuse, Orange) oder ganz Schwarz als Silhouette. Etwas größer, mit großem Schaufelschwanz für viel Druckwelle.',
    tun: ['Langsamer führen und nah am Grund bleiben, der Fisch findet den Köder über die Seitenlinie.', 'Rassel, Spinnerblatt oder Lockstoff helfen jetzt mehr als die Farbe.', 'Nach Hochwasser: ruhige Bereiche hinter Buhnen und Kehrwasser absuchen.'] },
  braun: { nays: ['C06', 'C13', 'C07'], dekor: 'Gold, Kupfer, Orange und Rotbraun. Glitter fängt das wenige Licht.',
    tun: ['Im dunklen Wasser lieber etwas flacher fischen, dort kommt mehr Licht hin.', 'Druckwelle und Vibration zählen mehr als Feinheiten im Dekor.'] },
};

export function naysAuswahl(t: Truebung, licht: Licht): string[] {
  return (licht !== 'tag' ? ['C04'] : []).concat(TRUEBUNG_TIPPS[t].nays).filter((c, i, a) => a.indexOf(c) === i).slice(0, 3);
}

/** RGB (0–255) → Farbton (°), Sättigung, Helligkeit (0–1). */
export function hsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const R = r / 255, G = g / 255, B = b / 255;
  const mx = Math.max(R, G, B), mn = Math.min(R, G, B), l = (mx + mn) / 2, d = mx - mn;
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  let h = 0;
  if (d) {
    h = mx === R ? 60 * (((G - B) / d) % 6) : mx === G ? 60 * ((B - R) / d + 2) : 60 * ((R - G) / d + 4);
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

/** Trübung aus der Durchschnittsfarbe des mittleren Bildbereichs. Nur eine grobe Schätzung. */
export function truebungAusFarbe(r: number, g: number, b: number): { truebung: Truebung; warum: string } {
  const { h, s, l } = hsl(r, g, b);
  if (s < 0.12) return l > 0.55 ? { truebung: 'trueb', warum: 'hell und grau, eher milchig' } : { truebung: 'klar', warum: 'neutral bis dunkel' };
  if (h >= 15 && h < 55) return l > 0.42 ? { truebung: 'trueb', warum: 'hellbraun, wie lehmiges Wasser' } : { truebung: 'braun', warum: 'dunkelbraun, wie Moorwasser' };
  if (h >= 55 && h < 170) return s > 0.35 ? { truebung: 'trueb', warum: 'kräftig grün, viele Schwebalgen' } : { truebung: 'leicht', warum: 'grünlich' };
  return { truebung: 'klar', warum: 'bläulich' };
}

/** Farbfamilie eines (freigestellten) Köderbilds aus RGBA-Pixeln. */
export function farbeErkennen(d: ArrayLike<number>): Farbfamilie | null {
  const bins = { dark: 0, white: 0, silver: 0, red: 0, orange: 0, yellow: 0, chart: 0, green: 0, blue: 0, purple: 0, brown: 0 };
  let n = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue;
    const { h, s, l } = hsl(d[i], d[i + 1], d[i + 2]);
    n++;
    if (l < 0.18) { bins.dark++; continue; }
    if (s < 0.18) { if (l > 0.8) bins.white++; else bins.silver++; continue; }
    if (h < 15 || h >= 330) bins.red++;
    else if (h < 40) { if (l < 0.38 && s < 0.6) bins.brown++; else bins.orange++; }
    else if (h < 62) bins.yellow++;
    else if (h < 95) bins.chart++;
    else if (h < 165) bins.green++;
    else if (h < 260) bins.blue++;
    else bins.purple++;
  }
  if (!n) return null;
  const f = (k: keyof typeof bins) => bins[k] / n;
  if (f('chart') > 0.12 && f('orange') + f('yellow') > 0.12) return 'firetiger';
  if (f('dark') > 0.45) return 'schwarz';
  if (f('white') > 0.4) return 'weiss';
  if (f('silver') > 0.45) return 'weissfisch';
  if (f('chart') > 0.25) return 'chartreuse';
  if (f('brown') > 0.25) return 'motoroil';
  if (f('red') + f('purple') > 0.3) return 'rotpink';
  if (f('orange') + f('yellow') > 0.3) return f('yellow') > f('orange') ? 'orange' : f('brown') > 0.08 ? 'gold' : 'orange';
  if (f('green') > 0.25) return 'natur';
  const top = (Object.entries(bins) as [keyof typeof bins, number][]).sort((a, b) => b[1] - a[1])[0][0];
  const map: Record<keyof typeof bins, Farbfamilie> = {
    dark: 'schwarz', white: 'weiss', silver: 'weissfisch', red: 'rotpink', orange: 'orange', yellow: 'orange',
    chart: 'chartreuse', green: 'natur', blue: 'weissfisch', purple: 'rotpink', brown: 'motoroil',
  };
  return map[top];
}

/**
 * Freistellen: Randfarbe bestimmen; bei gleichmäßigem Rand werden ähnliche Pixel transparent (weicher Übergang).
 * Ändert d (RGBA) direkt. Liefert den Rahmen des Motivs oder null, wenn es nicht klappt.
 */
export function freistellen(d: Uint8ClampedArray, W: number, H: number): { x: number; y: number; w: number; h: number } | null {
  let r = 0, g = 0, b = 0, n = 0;
  const rand: [number, number, number][] = [];
  const add = (p: number) => { const i = p * 4; rand.push([d[i], d[i + 1], d[i + 2]]); r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; };
  for (let X = 0; X < W; X++) { add(X); add((H - 1) * W + X); }
  for (let Y = 0; Y < H; Y++) { add(Y * W); add(Y * W + W - 1); }
  r /= n; g /= n; b /= n;
  const streuung = rand.reduce((a, c) => a + Math.hypot(c[0] - r, c[1] - g, c[2] - b), 0) / rand.length;
  if (streuung > 45) return null;
  const T1 = Math.max(30, streuung * 2), T2 = T1 + 40;
  let minX = W, minY = H, maxX = 0, maxY = 0, kept = 0;
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const dist = Math.hypot(d[i] - r, d[i + 1] - g, d[i + 2] - b);
    const a = dist <= T1 ? 0 : dist >= T2 ? 255 : Math.round(((dist - T1) / (T2 - T1)) * 255);
    d[i + 3] = a;
    if (a > 128) {
      kept++;
      const X = p % W, Y = (p / W) | 0;
      if (X < minX) minX = X; if (X > maxX) maxX = X; if (Y < minY) minY = Y; if (Y > maxY) maxY = Y;
    }
  }
  if (kept < W * H * 0.02 || kept > W * H * 0.85) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

export const KOEDER_TYPEN = ['Gummifisch', 'Wobbler', 'Spinner', 'Blinker', 'Jig', 'Naturköder', 'Fliege', 'Sonstiges'];

/** Wasser-Check ist 2 Tage gültig. */
export const WASSERCHECK_GUELTIG_MS = 2 * 864e5;
export function wasserAlter(zeitpunkt: number, jetzt = Date.now()): string {
  const d = Math.floor((jetzt - zeitpunkt) / 864e5);
  return d < 1 ? 'heute' : d < 2 ? 'gestern' : `vor ${d} Tagen`;
}

// ---------- Köder aus der eigenen Box zum Wasser bewerten ----------

/** Farben, die bei dieser Trübung als zweite Wahl noch funktionieren. */
const GEHT_AUCH: Record<Truebung, Farbfamilie[]> = {
  klar: ['motoroil', 'weiss', 'gold'],
  leicht: ['natur', 'weissfisch', 'orange', 'gold'],
  trueb: ['weiss', 'schwarz', 'gold'],
  braun: ['firetiger', 'schwarz', 'weiss'],
};

const FARB_GRUND: Record<Farbfamilie, string> = {
  natur: 'natürliches Dekor, wirkt bei guter Sicht echt',
  weissfisch: 'Silber blitzt wie ein Beutefisch',
  ghost: 'fast durchsichtig, gut für scheue Fische bei klarem Wasser',
  weiss: 'hell mit viel Kontrast',
  chartreuse: 'leuchtet auch bei wenig Sicht',
  orange: 'gut sichtbar bei wenig Sicht',
  firetiger: 'grell mit starkem Kontrast',
  gold: 'leuchtet in braunem und trübem Wasser',
  motoroil: 'dezent, eher für klares Wasser',
  schwarz: 'starke Silhouette bei wenig Licht oder trübem Wasser',
  rotpink: 'Rot verschwindet in der Tiefe schnell',
  uv: 'leuchtet bei wenig Licht',
};

const WASSER_DATIV: Record<Truebung, string> = { klar: 'klarem Wasser', leicht: 'leicht trübem Wasser', trueb: 'stark trübem Wasser', braun: 'Moorwasser' };

export type KoederUrteil = 'gut' | 'geht' | 'nicht' | 'ohne';
export const KOEDER_URTEIL: Record<KoederUrteil, string> = { gut: 'passt gut', geht: 'geht auch', nicht: 'eher nicht', ohne: 'Farbe fehlt' };

/** Bewertet einen Köder für Trübung und Licht, mit kurzem Grund. */
export function koederFuerWasser(farbe: Farbfamilie | undefined, t: Truebung, licht: Licht): { urteil: KoederUrteil; grund: string } {
  if (!farbe) return { urteil: 'ohne', grund: 'Trag die Farbe in der Köderbox ein, dann kann die App ihn einordnen.' };
  const { farben } = koederRat(t, licht);
  if (farben.includes(farbe)) return { urteil: 'gut', grund: `${FARB_GRUND[farbe]} – passt zu ${WASSER_DATIV[t]}` };
  if (GEHT_AUCH[t].includes(farbe) || (licht !== 'tag' && farbe === 'weiss')) return { urteil: 'geht', grund: FARB_GRUND[farbe] };
  return { urteil: 'nicht', grund: `${FARB_GRUND[farbe]} – bei ${WASSER_DATIV[t]} eher schwach` };
}
