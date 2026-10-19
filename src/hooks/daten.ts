// Lesen der lokalen Daten als React-Hooks. Änderungen in der Datenbank erscheinen sofort überall.
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { db, ladeEinstellungen, ladeSession, STANDARD, type Angeltag, type Einstellungen, type Gewaesser, type Koeder, type LaufendeSession } from '../db';
import { entfernungKm } from '../lib/geo';

export function useEinstellungen(): Einstellungen & { geladen: boolean } {
  const e = useLiveQuery(() => ladeEinstellungen(), []);
  return e ? { ...e, geladen: true } : { ...STANDARD, geladen: false };
}

export function useGewaesser(): Gewaesser[] {
  return useLiveQuery(() => db.gewaesser.toArray(), []) ?? [];
}

/** Gewässer mit Entfernung zum Wohnort, nach Entfernung sortiert. */
export function useGewaesserMitEntfernung(): (Gewaesser & { distKm: number | null })[] {
  const g = useGewaesser();
  const { wohnort } = useEinstellungen();
  return g
    .map((w) => ({ ...w, distKm: wohnort ? Math.round(entfernungKm(wohnort, w) * 10) / 10 : null }))
    .sort((a, b) => (a.distKm ?? 0) - (b.distKm ?? 0) || a.name.localeCompare(b.name, 'de'));
}

/** Angeltage, neueste zuerst. */
export function useAngeltage(): Angeltag[] {
  const l = useLiveQuery(() => db.angeltage.toArray(), []) ?? [];
  return l.sort((a, b) => b.startTs - a.startTs);
}

export function useKoeder(): Koeder[] {
  return useLiveQuery(() => db.koeder.toArray(), []) ?? [];
}

export function useSession(): LaufendeSession | null {
  return useLiveQuery(() => ladeSession(), []) ?? null;
}

/** Objekt-URL für ein Foto aus der Datenbank. */
export function useFoto(id?: string): string | null {
  const blob = useLiveQuery(async () => (id ? (await db.fotos.get(id))?.blob ?? null : null), [id]);
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) { setUrl(null); return; }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}

/** Sekündlich neu zeichnen (z. B. für die laufende Uhr). */
export function useTick(aktiv: boolean, ms = 1000): number {
  const [t, setT] = useState(Date.now());
  useEffect(() => {
    if (!aktiv) return;
    const i = setInterval(() => setT(Date.now()), ms);
    return () => clearInterval(i);
  }, [aktiv, ms]);
  return t;
}

export function useOnline(): boolean {
  const [on, setOn] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const a = () => setOn(true), b = () => setOn(false);
    window.addEventListener('online', a);
    window.addEventListener('offline', b);
    return () => { window.removeEventListener('online', a); window.removeEventListener('offline', b); };
  }, []);
  return on;
}
