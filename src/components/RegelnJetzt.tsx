// „Was heute gilt“: Schonzeiten und Verbote nach Datum, dazu eigene Regeln aus der Gewässerordnung.
import { useState } from 'react';
import { speichereEinstellungen } from '../db';
import { useEinstellungen } from '../hooks/daten';
import { OSM_HINWEIS } from '../lib/gewaesser-suche';
import { PEGEL_QUELLE } from '../lib/pegel';
import {
  aktiveVereinsregeln, ALLGEMEINE_REGELN, jetztGilt, REGELN_HINWEIS, REGELN_STAND, tagMonatTxt, VEREINSREGEL_VORSCHLAG,
  type TagMonat, type Vereinsregel,
} from '../lib/regeln-sachsen';
import { WETTER_QUELLE } from '../lib/wetter';
import { neueId } from '../lib/zeit';
import { ArmButton, Sheet } from './Ui';

export function useVereinsregeln(): Vereinsregel[] {
  const e = useEinstellungen();
  return e.vereinsregeln ?? VEREINSREGEL_VORSCHLAG;
}

/** Kurze Zeilen für den Start im Angeln-Tab: nur Vereinsregeln, die heute gelten. */
export function VereinsregelnHeute() {
  const aktiv = aktiveVereinsregeln(useVereinsregeln());
  if (!aktiv.length) return null;
  return <>{aktiv.map((r) => <p key={r.id} className="warn">{r.text} (bis {tagMonatTxt(r.bis)})</p>)}</>;
}

export function RegelnJetzt() {
  const e = useEinstellungen();
  const regeln = useVereinsregeln();
  const [bearbeiten, setBearbeiten] = useState<Vereinsregel | 'neu' | null>(null);
  const heute = new Date();
  const j = jetztGilt(heute);
  const aktiv = aktiveVereinsregeln(regeln, heute);
  const vorschlag = !e.vereinsregeln;
  const datum = heute.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="panel">
      <div className="row between"><h2>Was heute gilt</h2><span className="hint">{datum}</span></div>

      <div className={'rule' + (j.raubfisch.aktiv ? ' closed' : '')}><p className="rule-h">{j.raubfisch.text}</p></div>

      {aktiv.map((r) => (
        <div key={r.id} className="rule closed">
          <p className="rule-h">{r.text}</p>
          <p className="hint">Gewässerordnung, {tagMonatTxt(r.von)} – {tagMonatTxt(r.bis)}{vorschlag ? ' · Vorschlag, bitte in deiner Gewässerordnung prüfen' : ''}</p>
        </div>
      ))}

      <h3>Gerade geschont (Verordnung)</h3>
      <ul className="why">
        {j.geschont.map((g) => <li key={g.art}><span><b>{g.art}</b> bis {g.bis}</span></li>)}
        <li>Ganzjährig geschont u. a. Nase und Quappe (außer Elbe bzw. Vereinigte Mulde, Weiße Elster), Bitterling, Elritze, Groppe, Schlammpeitzger, Steinbeißer, Zährte, Zope.</li>
      </ul>
      {(j.beginntBald.length > 0 || j.endetBald.length > 0) && (
        <>
          <h3>In den nächsten 30 Tagen</h3>
          <ul className="why">
            {j.beginntBald.map((b) => <li key={'b' + b.art}>Ab {b.ab} geschont: {b.art} (in {b.inTagen} Tagen)</li>)}
            {j.endetBald.map((b) => <li key={'e' + b.art}>Schonzeit {b.art} endet am {b.bis} (in {b.inTagen} Tagen)</li>)}
          </ul>
        </>
      )}

      <h3>Regeln deiner Gewässerordnung</h3>
      <div className="list">
        {regeln.map((r) => (
          <div className="item wl" key={r.id}>
            <div className="main"><div>{r.text}</div><div>{tagMonatTxt(r.von)} – {tagMonatTxt(r.bis)}{aktiv.includes(r) ? ' · gilt gerade' : ''}</div></div>
            <div className="acts"><button type="button" className="ghost" onClick={() => setBearbeiten(r)}>Bearbeiten</button></div>
          </div>
        ))}
        {!regeln.length && <p className="hint">Keine eigenen Regeln eingetragen.</p>}
      </div>
      <button type="button" className="ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setBearbeiten('neu')}>+ Regel eintragen</button>
      <p className="hint">Diese Regeln stammen nicht aus der Verordnung, sondern von deinem Verein oder Pächter. Trag sie so ein, wie sie in deiner aktuellen Gewässerordnung stehen.</p>

      <details>
        <summary>Allgemeine Regeln und Datenquellen</summary>
        <div className="inner">
          <ul className="why">{ALLGEMEINE_REGELN.map((r) => <li key={r}>{r}</li>)}</ul>
          <p className="hint">{REGELN_STAND}. {REGELN_HINWEIS}</p>
          <p className="hint">Prognosen ohne Gewähr. Schonzeiten, Mindestmaße und die Gewässerordnung sind verbindlich.</p>
          <p className="hint">Ob du an einem Gewässer angeln darfst und welche Strecken grün sind: <a href="https://angelatlas-sachsen.de" target="_blank" rel="noopener">Angelatlas Sachsen</a>.</p>
          <p className="src">{WETTER_QUELLE} · Gewässer und Karte {OSM_HINWEIS} · {PEGEL_QUELLE}</p>
          <p className="hint">Deine Daten bleiben auf diesem Gerät. Kein Tracking, keine Analyse-Dienste.</p>
        </div>
      </details>

      {bearbeiten && <RegelForm r={bearbeiten === 'neu' ? null : bearbeiten} alle={regeln} onClose={() => setBearbeiten(null)} />}
    </div>
  );
}

const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

function TagMonatFeld({ id, label, wert, onChange }: { id: string; label: string; wert: TagMonat; onChange: (t: TagMonat) => void }) {
  return (
    <div className="row">
      <label className="f" htmlFor={id + 'd'}>{label}: Tag
        <input id={id + 'd'} type="number" min={1} max={31} inputMode="numeric" value={wert[1]} onChange={(e) => onChange([wert[0], Math.min(31, Math.max(1, +e.target.value || 1))])} />
      </label>
      <label className="f" htmlFor={id + 'm'}>Monat
        <select id={id + 'm'} value={wert[0]} onChange={(e) => onChange([+e.target.value, wert[1]])}>
          {MONATE.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
      </label>
    </div>
  );
}

function RegelForm({ r, alle, onClose }: { r: Vereinsregel | null; alle: Vereinsregel[]; onClose: () => void }) {
  const [text, setText] = useState(r?.text ?? '');
  const [von, setVon] = useState<TagMonat>(r?.von ?? [1, 1]);
  const [bis, setBis] = useState<TagMonat>(r?.bis ?? [12, 31]);
  async function speichern() {
    if (!text.trim()) return;
    const neu = { id: r?.id ?? neueId('r'), text: text.trim(), von, bis };
    await speichereEinstellungen({ vereinsregeln: r ? alle.map((x) => (x.id === r.id ? neu : x)) : [...alle, neu] });
    onClose();
  }
  return (
    <Sheet title={r ? 'Regel bearbeiten' : 'Regel eintragen'} onClose={onClose}>
      <label className="f" htmlFor="rText">Was gilt?<input id="rText" value={text} placeholder="z. B. Grüne Strecken: keine Kunstköder" onChange={(e) => setText(e.target.value)} /></label>
      <TagMonatFeld id="rVon" label="Gilt ab" wert={von} onChange={setVon} />
      <TagMonatFeld id="rBis" label="Gilt bis" wert={bis} onChange={setBis} />
      <p className="hint">Zeiträume über den Jahreswechsel gehen auch, z. B. 1. Oktober bis 30. April.</p>
      <div className="row between">
        <button type="button" className="primary" onClick={speichern}>Speichern</button>
        {r && <ArmButton className="ghost danger" label="Löschen" onConfirm={async () => { await speichereEinstellungen({ vereinsregeln: alle.filter((x) => x.id !== r.id) }); onClose(); }} />}
      </div>
    </Sheet>
  );
}
