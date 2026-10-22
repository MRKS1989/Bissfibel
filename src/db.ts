// Lokale Datenbank im Browser (IndexedDB über Dexie). Daten bleiben auf dem Gerät.
import Dexie, { type Table } from 'dexie';
import type { Licht, Mondgruppe } from './lib/astro';
import type { Farbfamilie, Truebung } from './lib/wasser';
import type { Schnappschuss } from './lib/prognose';
import type { GewaesserTyp } from './lib/wassertemp';
import type { Vereinsregel } from './lib/regeln-sachsen';

export type Gewaesser = {
  id: string; name: string; typ: GewaesserTyp; lat: number; lon: number;
  gewaessernummer?: string; quelle: 'osm' | 'eigen'; osmId?: string;
  flaecheHa?: number; laengeKm?: number; trinkwasser?: boolean;
  pegel?: { uuid: string; name: string };
  angelegt: number;
};

export type Koeder = {
  id: string; name: string; typ: string; farbe?: Farbfamilie; lieblingskoeder: boolean;
  fotoId?: string; angelegt: number;
};

export type Fang = {
  id: string; zeit: number; fischart: string; laengeCm?: number;
  koeder?: string; koederId?: string; koederFarbe?: Farbfamilie;
  fotoId?: string; zurueckgesetzt?: boolean;
  score?: number; // Bisswert zum Fangzeitpunkt
  wetter?: WetterSchnappschuss; // Bedingungen zum Fangzeitpunkt
};

export type WetterSchnappschuss = Partial<Schnappschuss> & {
  licht: Licht; mond: Mondgruppe; truebung?: Truebung;
  pegelTrend?: 'fallend' | 'steigend' | 'normal' | 'hoch';
};

export type Angeltag = {
  id: string; datum: string; beginn: string; startTs: number; dauerH: number;
  gewaesserId: string; gewaesserName: string; zielfisch: string; live: boolean;
  bisse: number; bissZeiten?: number[]; faenge: Fang[];
  wasserCheck?: boolean; prognoseFeedback?: 'ja' | 'teils' | 'nein';
  wetter: WetterSchnappschuss;
};

export type LaufendeSession = {
  start: number; gewaesserId: string; zielfisch: string;
  bisse: number[]; faenge: Fang[]; truebung?: Truebung; wasserCheck?: boolean;
};

export type Einstellungen = {
  wohnort?: { name: string; lat: number; lon: number };
  umkreisKm: number;
  fischart: string;
  topFische: string[];
  topFischeGewaehlt: boolean;
  letzterKoeder?: string;
  gesehenAbzeichen: string[];
  wasserCheck?: { wert: Truebung; zeitpunkt: number };
  vereinsregeln?: Vereinsregel[]; // fehlt = Vorschlag (grüne Strecken)
  alarm?: { an: boolean; ab: number; gemeldet: string[]; geprueft?: number };
};

export const STANDARD: Einstellungen = {
  umkreisKm: 50, fischart: 'zander', topFische: ['hecht', 'zander', 'barsch'], topFischeGewaehlt: false, gesehenAbzeichen: [],
};

export type Foto = { id: string; blob: Blob };
type KV = { k: string; v: unknown };
type Cache = { k: string; zeit: number; v: unknown };

class BissfibelDB extends Dexie {
  kv!: Table<KV, string>;
  gewaesser!: Table<Gewaesser, string>;
  angeltage!: Table<Angeltag, string>;
  koeder!: Table<Koeder, string>;
  fotos!: Table<Foto, string>;
  cache!: Table<Cache, string>;

  constructor() {
    super('bissfibel');
    this.version(1).stores({
      kv: 'k',
      gewaesser: 'id, name',
      angeltage: 'id, datum, gewaesserId',
      koeder: 'id',
      fotos: 'id',
      cache: 'k',
    });
  }
}

export const db = new BissfibelDB();

export async function ladeEinstellungen(): Promise<Einstellungen> {
  const r = await db.kv.get('einstellungen');
  return { ...STANDARD, ...((r?.v as Partial<Einstellungen>) ?? {}) };
}

export async function speichereEinstellungen(teil: Partial<Einstellungen>) {
  await db.transaction('rw', db.kv, async () => {
    const alt = await ladeEinstellungen();
    await db.kv.put({ k: 'einstellungen', v: { ...alt, ...teil } });
  });
}

export async function ladeSession(): Promise<LaufendeSession | null> {
  return ((await db.kv.get('live'))?.v as LaufendeSession) ?? null;
}

export async function speichereSession(s: LaufendeSession | null) {
  if (s) await db.kv.put({ k: 'live', v: s });
  else await db.kv.delete('live');
}

export async function cacheLesen<T>(k: string): Promise<{ zeit: number; v: T } | null> {
  const r = await db.cache.get(k);
  return r ? { zeit: r.zeit, v: r.v as T } : null;
}

export async function cacheSchreiben(k: string, v: unknown) {
  await db.cache.put({ k, zeit: Date.now(), v });
}
