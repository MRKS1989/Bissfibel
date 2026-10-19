// Sicherung: alle Daten inklusive Fotos als JSON-Datei exportieren und wieder einlesen.
import { useRef, useState } from 'react';
import { db } from '../db';
import { blobZuDataUrl, dataUrlZuBlob } from '../lib/foto';
import { heuteKey } from '../lib/zeit';
import { useMeldung } from './Ui';

type Datei = {
  app: 'bissfibel'; version: 1; exportiert: string;
  kv: { k: string; v: unknown }[]; gewaesser: unknown[]; angeltage: unknown[]; koeder: unknown[];
  fotos: { id: string; data: string }[];
};

export async function exportieren(): Promise<Blob> {
  const [kv, gewaesser, angeltage, koeder, fotos] = await Promise.all([
    db.kv.toArray(), db.gewaesser.toArray(), db.angeltage.toArray(), db.koeder.toArray(), db.fotos.toArray(),
  ]);
  const d: Datei = {
    app: 'bissfibel', version: 1, exportiert: new Date().toISOString(), kv, gewaesser, angeltage, koeder,
    fotos: await Promise.all(fotos.map(async (f) => ({ id: f.id, data: await blobZuDataUrl(f.blob) }))),
  };
  return new Blob([JSON.stringify(d)], { type: 'application/json' });
}

export async function importieren(text: string): Promise<{ tage: number; fotos: number }> {
  const d = JSON.parse(text) as Datei;
  if (d.app !== 'bissfibel' || !Array.isArray(d.angeltage)) throw new Error('Keine Bissfibel-Sicherung');
  const fotos = await Promise.all((d.fotos ?? []).map(async (f) => ({ id: f.id, blob: await dataUrlZuBlob(f.data) })));
  await db.transaction('rw', [db.kv, db.gewaesser, db.angeltage, db.koeder, db.fotos], async () => {
    await Promise.all([db.kv.clear(), db.gewaesser.clear(), db.angeltage.clear(), db.koeder.clear(), db.fotos.clear()]);
    await db.kv.bulkPut(d.kv as never[]);
    await db.gewaesser.bulkPut(d.gewaesser as never[]);
    await db.angeltage.bulkPut(d.angeltage as never[]);
    await db.koeder.bulkPut(d.koeder as never[]);
    await db.fotos.bulkPut(fotos);
  });
  return { tage: d.angeltage.length, fotos: fotos.length };
}

export function DatenSicherung() {
  const melde = useMeldung();
  const input = useRef<HTMLInputElement>(null);
  const [datei, setDatei] = useState<File | null>(null);

  async function sichern() {
    const b = await exportieren();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = `bissfibel-sicherung-${heuteKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    melde('Sicherung erstellt. Leg die Datei an einem sicheren Ort ab.');
  }

  async function einlesen() {
    if (!datei) return;
    try {
      const r = await importieren(await datei.text());
      melde(`Sicherung eingelesen: ${r.tage} Angeltage, ${r.fotos} Fotos.`);
    } catch {
      melde('Die Datei ist keine gültige Bissfibel-Sicherung.');
    }
    setDatei(null);
  }

  return (
    <div className="panel">
      <h2>Daten sichern</h2>
      <p className="hint">Deine Daten liegen nur auf diesem Gerät. Mit einer Sicherungsdatei (inklusive Fotos) kannst du sie aufheben oder auf ein neues Handy bringen.</p>
      <div className="row">
        <button type="button" onClick={sichern}>Sicherung herunterladen</button>
        <button type="button" className="ghost" onClick={() => input.current?.click()}>Sicherung einlesen</button>
        <input ref={input} type="file" accept="application/json,.json" hidden onChange={(e) => { setDatei(e.target.files?.[0] ?? null); e.target.value = ''; }} />
      </div>
      {datei && (
        <div className="fb">
          <p>„{datei.name}“ einlesen? Das ersetzt alle Daten auf diesem Gerät.</p>
          <div className="row">
            <button type="button" className="primary" onClick={einlesen}>Ja, ersetzen</button>
            <button type="button" className="ghost" onClick={() => setDatei(null)}>Abbrechen</button>
          </div>
        </div>
      )}
    </div>
  );
}
