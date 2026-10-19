// Ort in Sachsen eingeben, Vorschläge beim Tippen (Open-Meteo Geocoding).
import { useEffect, useState } from 'react';
import { ortSuchen, type Ort } from '../lib/geo';

export function OrtSuche({ startText, onWahl }: { startText: string; onWahl: (o: Ort) => void }) {
  const [text, setText] = useState(startText);
  const [vorschlaege, setVorschlaege] = useState<Ort[]>([]);
  const [hinweis, setHinweis] = useState('');
  const [aktiv, setAktiv] = useState(false);

  useEffect(() => setText(startText), [startText]);

  useEffect(() => {
    if (!aktiv || text.trim().length < 2) { setVorschlaege([]); setHinweis(''); return; }
    const ac = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await ortSuchen(text, ac.signal);
        setVorschlaege(r.orte);
        setHinweis(r.ausserhalb ? 'Die App gibt es vorerst nur für Sachsen.' : !r.orte.length ? 'Kein Ort in Sachsen gefunden.' : '');
      } catch {
        if (!ac.signal.aborted) setHinweis('Ortssuche gerade nicht erreichbar. Prüf die Internetverbindung.');
      }
    }, 300);
    return () => { clearTimeout(t); ac.abort(); };
  }, [text, aktiv]);

  return (
    <div className="ortsuche">
      <label className="f" htmlFor="ort">
        Stadt oder Ort in Sachsen
        <input id="ort" type="text" autoComplete="off" value={text} placeholder="z. B. Zwickau"
          onChange={(e) => { setText(e.target.value); setAktiv(true); }} />
      </label>
      {aktiv && vorschlaege.length > 0 && (
        <div className="suggest" role="listbox" aria-label="Vorschläge">
          {vorschlaege.map((o) => (
            <button key={`${o.lat},${o.lon}`} type="button" role="option" aria-selected="false"
              onClick={() => { setText(o.name); setAktiv(false); setVorschlaege([]); onWahl(o); }}>
              {o.name} {o.kreis && o.kreis !== o.name && <small>· {o.kreis}</small>}
            </button>
          ))}
        </div>
      )}
      {aktiv && hinweis && <p className="hint">{hinweis}</p>}
    </div>
  );
}
