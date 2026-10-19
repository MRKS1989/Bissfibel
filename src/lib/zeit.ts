// Zeit- und Zahlenhelfer. Alle Anzeigen in deutscher Zeit (Europe/Berlin).

export const TZ = 'Europe/Berlin';
export const STUNDE = 36e5;
export const TAG = 864e5;

export const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
export const fmt1 = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const teileFmt = new Intl.DateTimeFormat('de-DE', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export type Teile = { y: number; m: number; d: number; h: number; mi: number; key: string; hhmm: string };

/** Datum und Uhrzeit eines Zeitpunkts in deutscher Zeit. key = "JJJJ-MM-TT". */
export function teile(ts: number): Teile {
  const o: Record<string, string> = {};
  teileFmt.formatToParts(new Date(ts)).forEach((p) => (o[p.type] = p.value));
  return {
    y: +o.year, m: +o.month, d: +o.day, h: +o.hour, mi: +o.minute,
    key: `${o.year}-${o.month}-${o.day}`, hhmm: `${o.hour}:${o.minute}`,
  };
}

/** Zeitpunkt (ms) für ein Datum "JJJJ-MM-TT" und eine Uhrzeit "HH:MM" in deutscher Zeit. */
export function zeitpunkt(datum: string, hhmm = '12:00'): number {
  const [y, m, d] = datum.split('-').map(Number);
  const [h, mi] = hhmm.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, h, mi);
  // Versatz zur deutschen Zeit an diesem Tag bestimmen (Sommer-/Winterzeit).
  const t = teile(guess);
  const off = Date.UTC(t.y, t.m - 1, t.d, t.h, t.mi) - guess;
  return guess - off;
}

export const heuteKey = () => teile(Date.now()).key;

const wdFmt = new Intl.DateTimeFormat('de-DE', { timeZone: TZ, weekday: 'short' });
const langFmt = new Intl.DateTimeFormat('de-DE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' });
const uhrFmt = new Intl.DateTimeFormat('de-DE', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
const kurzFmt = new Intl.DateTimeFormat('de-DE', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' });
const kurzOhneJahr = new Intl.DateTimeFormat('de-DE', { timeZone: TZ, day: 'numeric', month: 'short' });

export const wochentag = (ts: number) => wdFmt.format(ts);
export const datumLang = (ts: number) => langFmt.format(ts);
export const uhrzeit = (ts: number) => uhrFmt.format(ts);
export const datumKurz = (ts: number) => kurzFmt.format(ts);
export const datumKurzOhneJahr = (ts: number) => kurzOhneJahr.format(ts);
export const datumKeyKurz = (key: string, mitJahr = true) => (mitJahr ? kurzFmt : kurzOhneJahr).format(zeitpunkt(key));

/** Dauer als H:MM:SS. */
export function dauerUhr(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`;
}

export const neueId = (p: string) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
