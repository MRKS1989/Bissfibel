// Alarm: Zeitfenster ab Bisswert 7 in den nächsten 2 Tagen. Nie bei Sturm oder Unwettergefahr melden.
import { artName } from './arten';
import type { TagesPrognose } from './prognose';
import { ALARM_AB, sicherheitsWarnung } from './score';
import { datumLang, fmt1, uhrzeit, STUNDE } from './zeit';

export type AlarmTreffer = { key: string; titel: string; text: string; score: number; ts: number };

export function alarmFenster(
  eintraege: { wId: string; wName: string; art: string; tage: TagesPrognose[] }[],
  jetzt: number, gemeldet: string[], ab = ALARM_AB, horizontH = 48,
): AlarmTreffer[] {
  const out: AlarmTreffer[] = [];
  eintraege.forEach(({ wId, wName, art, tage }) => tage.forEach((tag) => {
    const b = tag.bestes;
    if (b.avg < ab || b.ts + STUNDE < jetzt || b.ts > jetzt + horizontH * STUNDE) return;
    if (sicherheitsWarnung(Math.max(...tag.stunden.map((s) => s.s.w)), Math.min(...tag.stunden.map((s) => s.b.dp)))) return;
    const key = `${wId}|${art}|${tag.key}`;
    if (gemeldet.includes(key)) return;
    out.push({
      key, score: b.avg, ts: b.ts,
      titel: `Alarm: ${artName(art)} ${fmt1(b.avg)}`,
      text: `${wName} · ${datumLang(b.ts)}, ${uhrzeit(b.ts)}–${uhrzeit(b.ts + 3 * STUNDE)} Uhr`,
    });
  }));
  // Je Art und Tag nur das beste Gewässer melden, höchstens 3 Meldungen.
  const seen = new Set<string>();
  return out.sort((a, b) => b.score - a.score).filter((t) => {
    const [, art, tag] = t.key.split('|');
    if (seen.has(art + tag)) return false;
    seen.add(art + tag);
    return true;
  }).slice(0, 3);
}
