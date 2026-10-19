// Fischart wählen: Auswahl mit Suchfeld, Abschnitte „Meine Fische“, „Süßwasser“, „Meer“, „Sonstiges“.
import { useMemo, useState } from 'react';
import { ARTEN, artName, artPasst } from '../lib/arten';
import { useEinstellungen } from '../hooks/daten';
import { Sheet } from './Ui';

export function ArtWahl({ value, onChange, id }: { value: string; onChange: (k: string) => void; id?: string }) {
  const [offen, setOffen] = useState(false);
  return (
    <>
      <button id={id} type="button" className="sp-pick" onClick={() => setOffen(true)}>{artName(value)}</button>
      {offen && <ArtListe aktuell={value} onClose={() => setOffen(false)} onPick={(k) => { setOffen(false); onChange(k); }} />}
    </>
  );
}

function ArtListe({ aktuell, onClose, onPick }: { aktuell: string; onClose: () => void; onPick: (k: string) => void }) {
  const [q, setQ] = useState('');
  const { topFische } = useEinstellungen();
  const alle = useMemo(() => Object.keys(ARTEN).sort((a, b) => artName(a).localeCompare(artName(b), 'de')), []);
  const abschnitte: [string, string[]][] = q.trim()
    ? [['Treffer', alle.filter((k) => artPasst(k, q))]]
    : [
        ['Meine Fische', topFische.filter((k) => ARTEN[k])],
        ['Süßwasser', alle.filter((k) => ARTEN[k].abschnitt === 's')],
        ['Meer', alle.filter((k) => ARTEN[k].abschnitt === 'm')],
        ['Sonstiges', alle.filter((k) => ARTEN[k].abschnitt === 'x')],
      ];
  const leer = abschnitte.every(([, l]) => !l.length);
  return (
    <Sheet title="Fischart" onClose={onClose}>
      <input type="search" placeholder="Suche, z. B. Brachse oder Renke" aria-label="Fischart suchen" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      <div className="splist">
        {abschnitte.filter(([, l]) => l.length).map(([titel, l]) => (
          <div key={titel} style={{ display: 'contents' }}>
            <h3>{titel}</h3>
            {l.map((k) => (
              <button key={titel + k} type="button" className={'sp-row' + (k === aktuell ? ' on' : '')} onClick={() => onPick(k)}>
                {artName(k)}
                {ARTEN[k].alias && <small> · {ARTEN[k].alias}</small>}
              </button>
            ))}
          </div>
        ))}
        {leer && <p className="hint">Keine Art gefunden. Wähl „Sonstiges“.</p>}
      </div>
    </Sheet>
  );
}
