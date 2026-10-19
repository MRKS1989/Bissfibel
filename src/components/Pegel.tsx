// Kasten mit Wasserstand, Trend und Einordnung je Art (nur Elbe).
import { useEffect, useState } from 'react';
import { cacheLesen, cacheSchreiben, type Gewaesser } from '../db';
import { hatPegel, ladePegel, ladeStationen, naechsteStation, pegelRat, PEGEL_QUELLE, TREND_TEXT, type PegelStand, type Station } from '../lib/pegel';
import { uhrzeit, TAG, STUNDE } from '../lib/zeit';

export function usePegel(w: Pick<Gewaesser, 'typ' | 'name' | 'lat' | 'lon'> | null) {
  const [st, setSt] = useState<{ station: Station; pegel: PegelStand } | null>(null);
  const aktiv = !!w && hatPegel(w);
  useEffect(() => {
    setSt(null);
    if (!aktiv || !w) return;
    let ab = false;
    (async () => {
      try {
        let s = await cacheLesen<Station[]>('pegel:stationen');
        if (!s || Date.now() - s.zeit > 7 * TAG) { const v = await ladeStationen(); await cacheSchreiben('pegel:stationen', v); s = { zeit: Date.now(), v }; }
        const station = naechsteStation(s.v, w);
        if (!station) return;
        let p = await cacheLesen<PegelStand>('pegel:' + station.uuid);
        if (!p || Date.now() - p.zeit > STUNDE) {
          try { const v = await ladePegel(station.uuid); await cacheSchreiben('pegel:' + station.uuid, v); p = { zeit: Date.now(), v }; } catch { /* zuletzt bekannter Stand */ }
        }
        if (p && !ab) setSt({ station, pegel: p.v });
      } catch { /* ohne Netz kein Pegel */ }
    })();
    return () => { ab = true; };
  }, [aktiv, w?.lat, w?.lon]); // eslint-disable-line react-hooks/exhaustive-deps
  return st;
}

export function PegelBox({ w, art }: { w: Gewaesser; art: string }) {
  const p = usePegel(w);
  if (!hatPegel(w)) return null;
  return (
    <div className="pegel">
      <h3>Pegel{p ? ` ${p.station.name}` : ''}</h3>
      {p ? (
        <>
          <p>{(p.pegel.stand / 100).toLocaleString('de-DE', { maximumFractionDigits: 2 })} m · {TREND_TEXT[p.pegel.trend]} · {uhrzeit(p.pegel.zeit)} Uhr</p>
          <p>{pegelRat(p.pegel.trend, art)}</p>
          <p className="src">{PEGEL_QUELLE} · nur Hinweis, zählt nicht im Bisswert</p>
        </>
      ) : <p className="hint">Pegel wird geladen …</p>}
    </div>
  );
}
