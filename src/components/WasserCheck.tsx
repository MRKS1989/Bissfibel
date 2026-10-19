// Wasser-Check: kurze Hilfe zur Köderwahl, nicht an ein Gewässer gebunden. 2 Tage gemerkt und beim Angeln übernommen.
import { useState } from 'react';
import { ladeSession, speichereEinstellungen, speichereSession } from '../db';
import { useAngeltage, useEinstellungen, useKoeder } from '../hooks/daten';
import { lichtKlasse } from '../lib/astro';
import { wasserAuswerten } from '../lib/foto';
import { EHRLICH_HINWEIS, farbAuswertung, koederAuswertung } from '../lib/lernen';
import { FARBEN, koederRat, NAYS, NAYS_URL, naysAuswahl, TRUEBUNG, TRUEBUNG_TIPPS, WASSERCHECK_GUELTIG_MS, wasserAlter, type Truebung } from '../lib/wasser';
import { ShadSvg } from './Icons';
import { FotoKnopf, KoederBild } from './Koeder';

export function WasserCheck() {
  const e = useEinstellungen();
  const koeder = useKoeder();
  const tage = useAngeltage();
  const [foto, setFoto] = useState<string | null>(null);
  const [auto, setAuto] = useState<{ truebung: Truebung; warum: string } | null | 'fehler'>(null);
  const frisch = e.wasserCheck && Date.now() - e.wasserCheck.zeitpunkt < WASSERCHECK_GUELTIG_MS ? e.wasserCheck : null;
  const t = frisch?.wert ?? null;
  const ort = e.wohnort ?? { lat: 50.9, lon: 13.4 };
  const licht = lichtKlasse(Date.now(), ort.lat, ort.lon);

  async function setzen(v: Truebung) {
    await speichereEinstellungen({ wasserCheck: { wert: v, zeitpunkt: Date.now() } });
    const s = await ladeSession();
    if (s) await speichereSession({ ...s, truebung: v, wasserCheck: true });
  }

  async function fotoGewaehlt(f: File) {
    if (foto) URL.revokeObjectURL(foto);
    setFoto(URL.createObjectURL(f));
    const r = await wasserAuswerten(f);
    setAuto(r ?? 'fehler');
    if (r) await setzen(r.truebung);
  }

  const rat = t ? koederRat(t, licht) : null;
  const passt = rat ? koeder.filter((k) => k.farbe && rat.farben.includes(k.farbe)) : [];
  const fa = t ? farbAuswertung(t, tage) : null, ka = t ? koederAuswertung(t, tage) : null;

  return (
    <div className="panel" id="wasser-check">
      <div className="row between">
        <h2>Wasser-Check</h2>
        <span className="hint">{frisch ? `gemerkt ${wasserAlter(frisch.zeitpunkt)}` : 'Hilfe zur Köderwahl'}</span>
      </div>
      <p className="hint">Wie trüb ist das Wasser gerade? Wähl selbst oder fotografier schräg von oben ins flache Uferwasser.</p>
      <div className="picks">
        {(Object.keys(TRUEBUNG) as Truebung[]).map((k) => (
          <button key={k} type="button" aria-pressed={t === k} onClick={() => setzen(k)}>
            {TRUEBUNG[k].n}<small>{TRUEBUNG[k].d}</small>
          </button>
        ))}
      </div>
      <details open={!!foto}>
        <summary>{foto ? 'Foto vom Wasser' : 'Per Foto erkennen'}</summary>
        <div className="inner">
          {foto && <img className="wcphoto" src={foto} alt="Foto vom Wasser" />}
          <FotoKnopf label={foto ? 'Anderes Foto' : 'Foto machen'} onFile={fotoGewaehlt} />
          {auto && auto !== 'fehler' && <p>Erkannt: {auto.warum} → {TRUEBUNG[auto.truebung].n}. Stimmt nicht? Wähl oben selbst.</p>}
          {auto === 'fehler' && <p className="warn">Das Foto konnte nicht ausgewertet werden. Wähl die Trübung bitte selbst.</p>}
          <p className="hint">Die Auswertung läuft auf deinem Gerät. Das Foto wird nicht hochgeladen und nicht gespeichert.</p>
        </div>
      </details>

      {t && rat && (
        <>
          <h3>Köderfarben für jetzt</h3>
          <div className="swatches">
            {rat.farben.map((f) => <div key={f} className="sw"><i style={{ background: FARBEN[f][1] }} />{FARBEN[f][0]}</div>)}
          </div>
          <p>{rat.warum}</p>
          <h3>Dekor</h3>
          <p>{TRUEBUNG_TIPPS[t].dekor}</p>
          <div className="nays">
            {naysAuswahl(t, licht).map((c) => (
              <div key={c} className="ncard"><ShadSvg code={c} /><b>Nays VNM {c.replace('C', 'C-')}</b><span>{NAYS[c][0]}</span></div>
            ))}
          </div>
          <p className="hint">
            Beispiele von Nays, Codes laut Hersteller. Zeichnung von uns, die echten Farben weichen ab. Auswahl nach den Faustregeln oben, keine Empfehlung von Nays.{' '}
            <a href={NAYS_URL} target="_blank" rel="noopener">Dekore bei Nays ansehen</a>
          </p>
          <h3>So fischst du jetzt</h3>
          <ul className="why">{[...TRUEBUNG_TIPPS[t].tun, ...rat.tipps].map((x) => <li key={x}>{x}</li>)}</ul>
          {passt.length > 0 && (
            <>
              <h3>Passt jetzt aus deiner Köderbox</h3>
              <div className="lure-strip">
                {passt.map((k) => <div key={k.id} className="lure-chip"><KoederBild k={k} klein /><span>{k.name}</span></div>)}
              </div>
            </>
          )}
          {(fa || ka) && (
            <div className="learn">
              <h3>Bei dir</h3>
              {fa ? <p>Bei „{TRUEBUNG[t].n}“ kamen {fa.n} von {fa.gesamt} Fängen auf {FARBEN[fa.farbe][0]}.</p>
                : ka && <p>Bei „{TRUEBUNG[t].n}“ hast du am häufigsten mit „{ka.koeder}“ gefangen ({ka.n} Fänge).</p>}
              <p className="hint">{EHRLICH_HINWEIS}</p>
            </div>
          )}
          <p className="hint">Gilt 2 Tage und wird beim Angeln automatisch übernommen. Faustregeln aus der Angelpraxis, keine Garantie.</p>
        </>
      )}
    </div>
  );
}
