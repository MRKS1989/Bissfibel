// Ein gemeinsamer Wetterstand für alle Gewässer, damit jede Ansicht dieselben Daten nutzt.
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useEinstellungen, useGewaesser } from './daten';
import { useWetter, type WetterStand } from './wetter';

type Ctx = WetterStand & { neuLaden: () => void };
const WetterCtx = createContext<Ctx>({ reihen: new Map(), laden: false, fehler: null, stand: null, neuLaden: () => {} });

export function WetterProvider({ children }: { children: ReactNode }) {
  const g = useGewaesser();
  const { wohnort } = useEinstellungen();
  const orte = useMemo(() => {
    const o = g.map((w) => ({ lat: w.lat, lon: w.lon }));
    if (wohnort) o.push({ lat: wohnort.lat, lon: wohnort.lon });
    return o;
  }, [g, wohnort]);
  const st = useWetter(orte);
  return <WetterCtx.Provider value={st}>{children}</WetterCtx.Provider>;
}

export const useWetterStand = () => useContext(WetterCtx);
