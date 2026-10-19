// Wetter für alle Gewässer: zuerst aus dem Zwischenspeicher, dann frisch von Open-Meteo (höchstens stündlich).
import { useEffect, useMemo, useState } from 'react';
import { cacheLesen, cacheSchreiben } from '../db';
import type { WetterReihe } from '../lib/prognose';
import { ladeVorhersage, wetterKey } from '../lib/wetter';
import { STUNDE } from '../lib/zeit';

export type WetterStand = { reihen: Map<string, WetterReihe>; laden: boolean; fehler: string | null; stand: number | null };

const ALT_NACH = STUNDE;

export function useWetter(orte: { lat: number; lon: number }[]): WetterStand & { neuLaden: () => void } {
  const keys = useMemo(() => {
    const m = new Map<string, { lat: number; lon: number }>();
    orte.forEach((o) => {
      const k = wetterKey(o.lat, o.lon);
      if (!m.has(k)) { const [lat, lon] = k.split(',').map(Number); m.set(k, { lat, lon }); }
    });
    return m;
  }, [orte.map((o) => wetterKey(o.lat, o.lon)).sort().join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  const [st, setSt] = useState<WetterStand>({ reihen: new Map(), laden: false, fehler: null, stand: null });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let abbruch = false;
    (async () => {
      const reihen = new Map<string, WetterReihe>();
      const fehlend: string[] = [];
      for (const k of keys.keys()) {
        const c = await cacheLesen<WetterReihe>('wetter:' + k);
        if (c) reihen.set(k, c.v);
        if (!c || Date.now() - c.zeit > ALT_NACH || nonce) fehlend.push(k);
      }
      const stand = () => (reihen.size ? Math.min(...[...reihen.values()].map((r) => r.abgerufen)) : null);
      if (abbruch) return;
      setSt({ reihen: new Map(reihen), laden: fehlend.length > 0, fehler: null, stand: stand() });
      if (!fehlend.length) return;
      try {
        const neu = await ladeVorhersage(fehlend.map((k) => keys.get(k)!));
        for (let i = 0; i < fehlend.length; i++) {
          reihen.set(fehlend[i], neu[i]);
          await cacheSchreiben('wetter:' + fehlend[i], neu[i]);
        }
        if (!abbruch) setSt({ reihen: new Map(reihen), laden: false, fehler: null, stand: stand() });
      } catch {
        if (!abbruch) setSt({ reihen: new Map(reihen), laden: false, stand: stand(),
          fehler: reihen.size ? 'Kein Netz: Du siehst das zuletzt geladene Wetter.' : 'Wetter konnte nicht geladen werden. Prüf die Internetverbindung.' });
      }
    })();
    return () => { abbruch = true; };
  }, [keys, nonce]);

  return { ...st, neuLaden: () => setNonce((n) => n + 1) };
}

export const reiheFuer = (st: WetterStand, o: { lat: number; lon: number }) => st.reihen.get(wetterKey(o.lat, o.lon)) ?? null;
