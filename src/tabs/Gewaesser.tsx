import { useEffect, useMemo, useState } from 'react';
import { db, speichereEinstellungen, type Gewaesser as GW } from '../db';
import { ArmButton, Sheet, useMeldung } from '../components/Ui';
import { PunktKarte } from '../components/Karte';
import { OrtSuche } from '../components/OrtSuche';
import { WasserCheck } from '../components/WasserCheck';
import { useEinstellungen, useGewaesserMitEntfernung } from '../hooks/daten';
import { ladeGewaesserDaten, sucheInDaten, type GewaesserDaten } from '../lib/gewaesser-daten';
import { OSM_HINWEIS, sucheGewaesser, type Treffer } from '../lib/gewaesser-suche';
import { GEWAESSER_TYPEN, type GewaesserTyp } from '../lib/wassertemp';
import { datumKeyKurz, fmt1, neueId } from '../lib/zeit';

const ANGELATLAS = 'https://angelatlas-sachsen.de';
type Filter = 'alle' | 'still' | GewaesserTyp;
const STILL: GewaesserTyp[] = ['see', 'teich', 'talsperre'];
const NEBEN: GewaesserTyp[] = ['kanal', 'bach'];
const SEITE = 10;

export function Gewaesser() {
  const e = useEinstellungen();
  const meine = useGewaesserMitEntfernung();
  const melde = useMeldung();
  const [daten, setDaten] = useState<GewaesserDaten | null | 'laedt'>('laedt');
  const [offen, setOffen] = useState(false);
  const [notTreffer, setNotTreffer] = useState<Treffer[] | null>(null); // nur wenn die Liste fehlt
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState('');
  const [filter, setFilter] = useState<Filter>('alle');
  const [name, setName] = useState('');
  const [anzahl, setAnzahl] = useState(SEITE);
  const [mitBaechen, setMitBaechen] = useState(false);
  const [bearbeiten, setBearbeiten] = useState<GW | 'neu' | null>(null);

  useEffect(() => { ladeGewaesserDaten().then(setDaten); }, []);

  // Suche läuft auf dem Gerät: Umkreis oder Häkchen ändern wirkt sofort.
  const treffer = useMemo(() => {
    if (!offen || !e.wohnort) return [];
    const l = daten && daten !== 'laedt' ? sucheInDaten(daten, e.wohnort, e.umkreisKm, mitBaechen) : (notTreffer ?? []).filter((t) => t.distKm <= e.umkreisKm);
    // Seen, Teiche, Talsperren und Flüsse zuerst, Kanäle und Bäche danach; jeweils nach Entfernung.
    return l.sort((a, b) => +NEBEN.includes(a.typ) - +NEBEN.includes(b.typ) || a.distKm - b.distKm);
  }, [offen, daten, notTreffer, e.wohnort, e.umkreisKm, mitBaechen]);

  async function suchen() {
    if (!e.wohnort) { setFehler('Wähl zuerst einen Ort aus den Vorschlägen.'); return; }
    // Neue Suche: alte Filter und Ergebnisse zurücksetzen.
    setFehler(''); setFilter('alle'); setName(''); setAnzahl(SEITE); setNotTreffer(null);
    if (daten && daten !== 'laedt') { setOffen(true); return; }
    // Ausweg, falls die mitgelieferte Liste fehlt: OpenStreetMap direkt fragen (höchstens 40 Sekunden).
    setLaeuft(true);
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 40000);
    try {
      setNotTreffer(await sucheGewaesser(e.wohnort, e.umkreisKm, mitBaechen, ac.signal));
      setOffen(true);
    } catch {
      setFehler('Die Gewässersuche hat nicht geantwortet. Versuch es später noch einmal oder leg das Gewässer selbst an.');
    } finally {
      clearTimeout(t);
      setLaeuft(false);
    }
  }

  async function hinzufuegen(t: Treffer) {
    await db.gewaesser.put({
      id: neueId('w'), name: t.name, typ: t.typ, lat: t.lat, lon: t.lon, quelle: 'osm', osmId: t.osmId,
      flaecheHa: t.flaecheHa, laengeKm: t.laengeKm, trinkwasser: t.trinkwasser, angelegt: Date.now(),
    });
    melde(`${t.name} ist jetzt oben in deinen Gewässern.`);
  }

  const zaehler = useMemo(() => {
    const z: Record<string, number> = { alle: treffer.length, still: treffer.filter((t) => STILL.includes(t.typ)).length };
    treffer.forEach((t) => (z[t.typ] = (z[t.typ] ?? 0) + 1));
    return z;
  }, [treffer]);
  const q = name.trim().toLowerCase();
  const gefiltert = treffer.filter((t) => (filter === 'alle' || (filter === 'still' ? STILL.includes(t.typ) : t.typ === filter)) && (!q || t.name.toLowerCase().includes(q)));
  const vorhanden = new Set(meine.map((w) => w.osmId ?? w.name));
  const anzahlImUmkreis = meine.filter((w) => w.distKm == null || w.distKm <= e.umkreisKm).length;

  return (
    <>
      <div className="panel">
        <div className="row between">
          <h2>Deine Gewässer</h2>
          <span className="hint">{anzahlImUmkreis} von {meine.length} im Umkreis</span>
        </div>
        <div className="list">
          {!meine.length && <p className="hint">Noch keine Gewässer. Such unten nach Gewässern in deiner Nähe.</p>}
          {meine.map((w) => {
            const aussen = w.distKm != null && w.distKm > e.umkreisKm;
            return (
              <div className="item wl" key={w.id}>
                <div className="main">
                  <div>{w.name}</div>
                  <div>{[GEWAESSER_TYPEN[w.typ].name, w.distKm != null ? `${fmt1(w.distKm)} km` : '', w.gewaessernummer ? `Nr. ${w.gewaessernummer}` : '', w.trinkwasser ? 'Trinkwasser' : ''].filter(Boolean).join(' · ')}</div>
                </div>
                <span className={'chip' + (aussen ? ' out' : '')}>{aussen ? 'außerhalb' : 'im Umkreis'}</span>
                <div className="acts">
                  <button type="button" className="ghost" onClick={() => setBearbeiten(w)}>Bearbeiten</button>
                  <ArmButton className="ghost danger" label="Entfernen" onConfirm={() => db.gewaesser.delete(w.id)} />
                </div>
              </div>
            );
          })}
        </div>
        <button type="button" className="ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setBearbeiten('neu')}>+ Gewässer nicht gefunden? Selbst anlegen</button>
        <p className="hint">Ob du dort angeln darfst, steht im <a href={ANGELATLAS} target="_blank" rel="noopener">Angelatlas Sachsen</a>.</p>
      </div>

      <form className="panel" onSubmit={(ev) => { ev.preventDefault(); suchen(); }}>
        <h2>Gewässer in Sachsen suchen</h2>
        <OrtSuche startText={e.wohnort?.name ?? ''} onWahl={(o) => { setOffen(false); speichereEinstellungen({ wohnort: { name: o.name, lat: o.lat, lon: o.lon } }); }} />
        <label className="f" htmlFor="radius">
          Umkreis: <span className="mono">{e.umkreisKm} km</span>
          <input id="radius" type="range" min={5} max={100} step={5} value={e.umkreisKm}
            onChange={(ev) => speichereEinstellungen({ umkreisKm: +ev.target.value })} />
        </label>
        <label className="chk" htmlFor="baeche"><input id="baeche" type="checkbox" checked={mitBaechen} onChange={(ev) => setMitBaechen(ev.target.checked)} />Auch Bäche anzeigen</label>
        <button className="primary go" type="submit" disabled={laeuft || daten === 'laedt'}>{laeuft ? 'Suche läuft …' : 'Gewässer suchen'}</button>
        {laeuft && <p className="hint">Die Gewässerliste ist noch nicht in der App, deshalb wird OpenStreetMap direkt gefragt. Das kann dauern.</p>}
        {fehler && <p className="err">{fehler}</p>}

        {offen && (
          <div className="grp">
            <div className="row between">
              <h2>{gefiltert.length} Gewässer</h2>
              <button type="button" className="ghost" onClick={() => setOffen(false)}>Fertig</button>
            </div>
            <span className="hint">{e.umkreisKm} km um {e.wohnort?.name}, nur Sachsen</span>
            <input type="search" placeholder="Name filtern, z. B. Pöhl" aria-label="Treffer nach Namen filtern" value={name}
              onChange={(ev) => { setName(ev.target.value); setAnzahl(SEITE); }} />
            <div className="chips">
              {(['alle', 'still', 'see', 'teich', 'talsperre', 'fluss', 'kanal', 'bach'] as Filter[]).filter((k) => zaehler[k]).map((k) => (
                <button key={k} type="button" aria-pressed={filter === k} onClick={() => { setFilter(k); setAnzahl(SEITE); }}>
                  {k === 'alle' ? 'Alle' : k === 'still' ? 'Seen, Teiche, Talsperren' : GEWAESSER_TYPEN[k].name} {zaehler[k]}
                </button>
              ))}
            </div>
            <div className="list">
              {!gefiltert.length && <p className="hint">Nichts gefunden. Ändere den Filter oder vergrößere den Umkreis.</p>}
              {gefiltert.slice(0, anzahl).map((t) => {
                const drin = vorhanden.has(t.osmId) || vorhanden.has(t.name);
                const groesse = t.laengeKm ? `${t.laengeKm} km im Umkreis` : t.flaecheHa ? `ca. ${t.flaecheHa < 10 ? fmt1(t.flaecheHa) : Math.round(t.flaecheHa)} ha` : '';
                return (
                  <div className="item" key={t.osmId + t.name}>
                    <div className="main">
                      <div>{t.name}</div>
                      <div>{[GEWAESSER_TYPEN[t.typ].name, `${fmt1(t.distKm)} km`, groesse, t.trinkwasser ? 'Trinkwasser, Angeln meist verboten' : ''].filter(Boolean).join(' · ')}</div>
                    </div>
                    <button type="button" className={drin ? 'ghost' : 'primary'} disabled={drin} onClick={() => hinzufuegen(t)}>
                      {drin ? 'Hinzugefügt' : 'Hinzufügen'}
                    </button>
                  </div>
                );
              })}
            </div>
            {gefiltert.length > anzahl && (
              <button type="button" onClick={() => setAnzahl(anzahl + 20)}>Weitere anzeigen ({gefiltert.length - anzahl} übrig)</button>
            )}
            <p className="hint">Ob du dort angeln darfst, steht nicht in diesen Daten. Prüf das im <a href={ANGELATLAS} target="_blank" rel="noopener">Angelatlas Sachsen</a>.</p>
            <p className="src">Gewässerdaten {OSM_HINWEIS}{daten && daten !== 'laedt' ? `, Stand ${datumKeyKurz(daten.stand)}` : ''}</p>
          </div>
        )}
      </form>

      <WasserCheck />

      {bearbeiten && <GewaesserForm w={bearbeiten === 'neu' ? null : bearbeiten} onClose={() => setBearbeiten(null)} />}
    </>
  );
}

function GewaesserForm({ w, onClose }: { w: GW | null; onClose: () => void }) {
  const { wohnort } = useEinstellungen();
  const melde = useMeldung();
  const [name, setName] = useState(w?.name ?? '');
  const [typ, setTyp] = useState<GewaesserTyp>(w?.typ ?? 'see');
  const [nr, setNr] = useState(w?.gewaessernummer ?? '');
  const [punkt, setPunkt] = useState<{ lat: number; lon: number } | null>(w ? { lat: w.lat, lon: w.lon } : null);
  const [fehler, setFehler] = useState('');

  async function speichern() {
    if (!name.trim()) { setFehler('Gib dem Gewässer einen Namen.'); return; }
    if (!punkt) { setFehler('Tippe auf der Karte auf die Stelle des Gewässers.'); return; }
    const neu: GW = {
      ...(w ?? { id: neueId('w'), quelle: 'eigen' as const, angelegt: Date.now() }),
      name: name.trim(), typ, lat: punkt.lat, lon: punkt.lon, gewaessernummer: nr.trim() || undefined,
    };
    await db.gewaesser.put(neu);
    melde(w ? 'Gewässer gespeichert.' : `${neu.name} ist jetzt in deinen Gewässern.`);
    onClose();
  }

  return (
    <Sheet title={w ? 'Gewässer bearbeiten' : 'Gewässer selbst anlegen'} onClose={onClose}>
      <div className="row">
        <label className="f" htmlFor="gwName">Name<input id="gwName" value={name} placeholder="z. B. Kiesgrube Nord" onChange={(e) => setName(e.target.value)} /></label>
        <label className="f" htmlFor="gwTyp">Typ
          <select id="gwTyp" value={typ} onChange={(e) => setTyp(e.target.value as GewaesserTyp)}>
            {Object.entries(GEWAESSER_TYPEN).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </label>
      </div>
      <label className="f" htmlFor="gwNr">Gewässernummer<input id="gwNr" value={nr} placeholder="optional" onChange={(e) => setNr(e.target.value)} /></label>
      <span className="flabel">Punkt auf der Karte {punkt ? '(gesetzt, tippen zum Verschieben)' : '(tippe auf die Stelle)'}</span>
      <PunktKarte mitte={wohnort ?? undefined} punkt={punkt} onPunkt={setPunkt} />
      {fehler && <p className="err">{fehler}</p>}
      <button type="button" className="primary go" onClick={speichern}>Speichern</button>
    </Sheet>
  );
}
