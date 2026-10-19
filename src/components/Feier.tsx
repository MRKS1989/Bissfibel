// Erfolgs-Animationen: neuer PB, neuer Rang, neue Abzeichen-Stufe. Tippen schließt, nach 4 s automatisch.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { db } from '../db';
import { artName } from '../lib/arten';
import { abzeichen, punkte, RAENGE, rangVon, stufenKeys, STUFEN_NAME } from '../lib/punkte';
import { Trophy } from './Icons';

type Feier =
  | { art: 'pb'; fisch: string; laenge: number; vorher: number }
  | { art: 'rang'; i: number; name: string; punkte: number }
  | { art: 'stufe'; name: string; stufe: number };

type Stand = { punkte: number; stufen: string[] };
type Ctx = { feiern: (f: Feier) => void; stand: () => Promise<Stand>; vergleichen: (vorher: Stand) => Promise<{ plus: number; neu: string[] }> };

const FeierCtx = createContext<Ctx>({ feiern: () => {}, stand: async () => ({ punkte: 0, stufen: [] }), vergleichen: async () => ({ plus: 0, neu: [] }) });
export const useFeier = () => useContext(FeierCtx);

async function standLaden(): Promise<Stand> {
  const [tage, koeder] = await Promise.all([db.angeltage.toArray(), db.koeder.toArray()]);
  return { punkte: punkte(tage, koeder), stufen: stufenKeys(abzeichen(tage, koeder)) };
}

export function FeierProvider({ children }: { children: ReactNode }) {
  const [q, setQ] = useState<Feier[]>([]);
  const feiern = useCallback((f: Feier) => setQ((l) => [...l, f]), []);

  /** Nach dem Speichern: Rangaufstieg und neue Abzeichen-Stufen feiern, Punktezuwachs melden. */
  const vergleichen = useCallback(async (vorher: Stand) => {
    const [tage, koeder] = await Promise.all([db.angeltage.toArray(), db.koeder.toArray()]);
    const nachher = await standLaden();
    const l = abzeichen(tage, koeder);
    const neu = nachher.stufen.filter((k) => !vorher.stufen.includes(k));
    neu.forEach((k) => {
      const [id, s] = k.split(':');
      const a = l.find((x) => x.id === id);
      if (a) feiern({ art: 'stufe', name: a.n, stufe: a.stufen.length === 1 ? 0 : +s });
    });
    const a = rangVon(vorher.punkte), b = rangVon(nachher.punkte);
    if (b.i > a.i) feiern({ art: 'rang', i: b.i, name: b.name, punkte: nachher.punkte });
    return { plus: nachher.punkte - vorher.punkte, neu: neu.map((k) => l.find((x) => x.id === k.split(':')[0])?.n ?? '') };
  }, [feiern]);

  const aktuell = q[0];
  const schliessen = useCallback(() => setQ((l) => l.slice(1)), []);
  return (
    <FeierCtx.Provider value={{ feiern, stand: standLaden, vergleichen }}>
      {children}
      {aktuell && <FeierKarte key={q.length + JSON.stringify(aktuell)} f={aktuell} onClose={schliessen} />}
    </FeierCtx.Provider>
  );
}

function FeierKarte({ f, onClose }: { f: Feier; onClose: () => void }) {
  const ref = useRef(onClose);
  ref.current = onClose;
  useEffect(() => {
    const t = setTimeout(() => ref.current(), 4000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="celeb" role="status" aria-live="polite" onClick={onClose}>
      <div className="cel-card">
        {f.art === 'pb' && <PbKarte f={f} />}
        {f.art === 'rang' && (
          <>
            <div className="rankbadge">{f.i + 1}</div>
            <p className="cel-k">Neuer Rang</p>
            <div className="cel-big">{f.name}</div>
            <p className="cel-t">Rang {f.i + 1} von {RAENGE.length} · {f.punkte} Punkte</p>
          </>
        )}
        {f.art === 'stufe' && (
          <>
            <div className={`rankbadge medal-big t${f.stufe || 3}`}>★</div>
            <p className="cel-k">{f.stufe ? `Abzeichen in ${STUFEN_NAME[f.stufe]}` : 'Neues Abzeichen'}</p>
            <div className="cel-big" style={{ fontSize: 40 }}>{f.name}</div>
            <p className="cel-t">+10 Punkte</p>
          </>
        )}
        <p className="hint">Tippen zum Schließen</p>
      </div>
    </div>
  );
}

function PbKarte({ f }: { f: Extract<Feier, { art: 'pb' }> }) {
  const max = Math.max(f.laenge * 1.25, 30), pos = (f.laenge / max) * 100;
  return (
    <>
      <Trophy />
      <p className="cel-k">Neuer PB</p>
      <div className="cel-big">{f.laenge} cm</div>
      <p className="cel-t">{artName(f.fisch)}{f.vorher ? ` · vorher ${f.vorher} cm` : ' · dein erster mit Länge'}</p>
      <div className="tape" aria-hidden="true">
        <div className="fill" style={{ width: `${pos}%` }} />
        <div className="ticks" />
        <div className="mark" style={{ left: `calc(${pos}% - 1px)` }} />
      </div>
    </>
  );
}
