// Alarm prüfen: läuft in der App und im Hintergrund (Service Worker). Nutzt nur die lokalen Daten.
import { cacheLesen, cacheSchreiben, db, ladeEinstellungen, speichereEinstellungen } from './db';
import { alarmFenster } from './lib/alarm';
import { hatProfil } from './lib/arten';
import { entfernungKm } from './lib/geo';
import { prognose, type WetterReihe } from './lib/prognose';
import { ladeVorhersage, wetterKey } from './lib/wetter';
import { STUNDE } from './lib/zeit';

export type Zeigen = (titel: string, text: string, tag: string) => Promise<void>;

export async function alarmPruefen(zeigen: Zeigen, jetzt = Date.now()): Promise<number> {
  const e = await ladeEinstellungen();
  if (!e.alarm?.an) return 0;
  const waters = (await db.gewaesser.toArray()).filter((w) => !e.wohnort || entfernungKm(e.wohnort, w) <= e.umkreisKm);
  if (!waters.length) return 0;

  // Wetter: Zwischenspeicher, veraltete Orte frisch laden (wenn Netz da ist).
  const reihen = new Map<string, WetterReihe>();
  const fehlend: { k: string; lat: number; lon: number }[] = [];
  for (const w of waters) {
    const k = wetterKey(w.lat, w.lon);
    if (reihen.has(k) || fehlend.some((f) => f.k === k)) continue;
    const c = await cacheLesen<WetterReihe>('wetter:' + k);
    if (c) reihen.set(k, c.v);
    if (!c || jetzt - c.zeit > 3 * STUNDE) { const [lat, lon] = k.split(',').map(Number); fehlend.push({ k, lat, lon }); }
  }
  if (fehlend.length) {
    try {
      const neu = await ladeVorhersage(fehlend);
      for (let i = 0; i < fehlend.length; i++) { reihen.set(fehlend[i].k, neu[i]); await cacheSchreiben('wetter:' + fehlend[i].k, neu[i]); }
    } catch { /* ohne Netz mit dem letzten Stand prüfen */ }
  }

  const arten = e.topFische.filter(hatProfil);
  const eintraege = waters.flatMap((w) => {
    const r = reihen.get(wetterKey(w.lat, w.lon));
    return r ? arten.map((art) => ({ wId: w.id, wName: w.name, art, tage: prognose(r, w.typ, art, jetzt, 3) })) : [];
  });
  const treffer = alarmFenster(eintraege, jetzt, e.alarm.gemeldet ?? []);
  for (const t of treffer) await zeigen(t.titel, t.text, t.key);
  await speichereEinstellungen({
    alarm: { ...e.alarm, gemeldet: [...(e.alarm.gemeldet ?? []), ...treffer.map((t) => t.key)].slice(-60), geprueft: jetzt },
  });
  return treffer.length;
}
