// Köderbox: Köder mit freigestelltem Foto, Farbfamilie und Lieblingsköder.
import { useEffect, useState } from 'react';
import { db, type Angeltag, type Koeder } from '../db';
import { useAngeltage, useEinstellungen, useFoto, useKoeder } from '../hooks/daten';
import { artName } from '../lib/arten';
import { koederBild, loescheFoto, speichereFoto } from '../lib/foto';
import { FARBEN, KOEDER_TYPEN, type Farbfamilie } from '../lib/wasser';
import { neueId } from '../lib/zeit';
import { useFeier } from './Feier';
import { Icon, IC } from './Icons';
import { ArmButton, Sheet, useMeldung } from './Ui';

export function KoederBild({ k, klein }: { k?: Koeder | null; klein?: boolean }) {
  const url = useFoto(k?.fotoId);
  if (url) return <img className="lure-img" src={url} alt="" style={klein ? { width: 54, height: 54 } : undefined} />;
  return <div className="lure-img" style={klein ? { width: 54, height: 54 } : undefined}><Icon d={IC.hook} /></div>;
}

/** Reihenfolge: zuletzt benutzter Köder, dann Lieblingsköder, dann der Rest alphabetisch. */
export function koederReihenfolge(l: Koeder[], letzter?: string): Koeder[] {
  const last = l.find((k) => k.id === letzter);
  const rest = l.filter((k) => k !== last).sort((a, b) => +b.lieblingskoeder - +a.lieblingskoeder || a.name.localeCompare(b.name, 'de'));
  return last ? [last, ...rest] : rest;
}

export function koederStatistik(id: string, tage: Pick<Angeltag, 'faenge'>[]) {
  let n = 0, groesster: { laenge: number; art: string } | null = null;
  const arten = new Set<string>();
  tage.forEach((t) => t.faenge.forEach((f) => {
    if (f.koederId !== id) return;
    n++;
    arten.add(artName(f.fischart));
    if (f.laengeCm && (!groesster || f.laengeCm > groesster.laenge)) groesster = { laenge: f.laengeCm, art: f.fischart };
  }));
  return { n, arten: [...arten], groesster: groesster as { laenge: number; art: string } | null };
}

/** Waagerechte Leiste mit Vorschaubildern zur Auswahl beim Fang. */
export function KoederLeiste({ wert, onWahl }: { wert: string | null; onWahl: (id: string | null) => void }) {
  const koeder = useKoeder();
  const { letzterKoeder } = useEinstellungen();
  const [neu, setNeu] = useState(false);
  return (
    <div className="lure-strip">
      {koederReihenfolge(koeder, letzterKoeder).map((k) => (
        <button key={k.id} type="button" className="lure-chip" aria-pressed={wert === k.id} onClick={() => onWahl(wert === k.id ? null : k.id)}>
          <KoederBild k={k} klein />
          <span>{k.name}</span>
        </button>
      ))}
      <button type="button" className="lure-chip add" onClick={() => setNeu(true)}>+ Neuer Köder</button>
      {neu && <KoederEditor k={null} onClose={(id) => { setNeu(false); if (id) onWahl(id); }} />}
    </div>
  );
}

export function KoederBox() {
  const koeder = useKoeder();
  const tage = useAngeltage();
  const [offen, setOffen] = useState<Koeder | 'neu' | null>(null);
  const sortiert = koeder.slice().sort((a, b) => +b.lieblingskoeder - +a.lieblingskoeder || a.name.localeCompare(b.name, 'de'));
  return (
    <div className="panel">
      <div className="row between">
        <h2>Meine Köderbox</h2>
        <button type="button" onClick={() => setOffen('neu')}>+ Köder</button>
      </div>
      {!koeder.length ? (
        <p className="hint">Noch leer. Fotografiere deine Köder, dann wählst du sie beim Fang mit einem Tipp aus.</p>
      ) : (
        <div className="lurebox">
          {sortiert.map((k) => {
            const st = koederStatistik(k.id, tage);
            return (
              <button key={k.id} type="button" className="lure-tile" onClick={() => setOffen(k)}>
                <KoederBild k={k} />
                {k.name}
                <small>{[k.farbe ? FARBEN[k.farbe][0] : '', st.n ? `${st.n} Fänge` : ''].filter(Boolean).join(' · ')}</small>
                {k.lieblingskoeder && <svg className="fav" viewBox="0 0 24 24" aria-label="Lieblingsköder"><path fill="currentColor" d={IC.star} /></svg>}
              </button>
            );
          })}
        </div>
      )}
      {offen && <KoederEditor k={offen === 'neu' ? null : offen} onClose={() => setOffen(null)} />}
    </div>
  );
}

export function KoederEditor({ k, onClose }: { k: Koeder | null; onClose: (id?: string) => void }) {
  const tage = useAngeltage();
  const melde = useMeldung();
  const { stand, vergleichen } = useFeier();
  const [name, setName] = useState(k?.name ?? '');
  const [typ, setTyp] = useState(k?.typ ?? 'Gummifisch');
  const [farbe, setFarbe] = useState<Farbfamilie | undefined>(k?.farbe);
  const [fav, setFav] = useState(k?.lieblingskoeder ?? false);
  const [bild, setBild] = useState<{ original: Blob; frei: Blob | null; erkannt: Farbfamilie | null } | null>(null);
  const [freiZeigen, setFreiZeigen] = useState(true);
  const [arbeitet, setArbeitet] = useState(false);
  const altUrl = useFoto(k?.fotoId);
  const gezeigt = bild ? (freiZeigen && bild.frei ? bild.frei : bild.original) : null;
  const [vorschau, setVorschau] = useState<string | null>(null);
  useEffect(() => {
    if (!gezeigt) { setVorschau(null); return; }
    const u = URL.createObjectURL(gezeigt);
    setVorschau(u);
    return () => URL.revokeObjectURL(u);
  }, [gezeigt]);

  async function fotoGewaehlt(f: File) {
    setArbeitet(true);
    try {
      const r = await koederBild(f);
      setBild({ ...r, erkannt: r.farbe });
      setFreiZeigen(!!r.frei);
      if (r.farbe && !farbe) setFarbe(r.farbe);
    } catch {
      melde('Das Foto konnte nicht gelesen werden. Versuch ein anderes Bild.');
    } finally {
      setArbeitet(false);
    }
  }

  async function speichern() {
    if (!name.trim() && !bild && !k?.fotoId) { melde('Gib dem Köder einen Namen oder mach ein Foto.'); return; }
    const vorher = await stand();
    let fotoId = k?.fotoId;
    if (gezeigt) { await loescheFoto(k?.fotoId); fotoId = await speichereFoto(gezeigt); }
    const neu: Koeder = {
      id: k?.id ?? neueId('k'), angelegt: k?.angelegt ?? Date.now(),
      name: name.trim() || `${typ}${farbe ? ' ' + FARBEN[farbe][0] : ''}`, typ, farbe, lieblingskoeder: fav, fotoId,
    };
    await db.koeder.put(neu);
    const v = await vergleichen(vorher);
    melde(k ? 'Köder gespeichert.' : `Köder in der Box${v.plus ? ` · +${v.plus} Punkte` : ''}.`);
    onClose(neu.id);
  }

  async function loeschen() {
    if (!k) return;
    await loescheFoto(k.fotoId);
    await db.koeder.delete(k.id);
    onClose();
  }

  const st = k ? koederStatistik(k.id, tage) : null;
  const bildUrl = vorschau ?? altUrl;

  return (
    <Sheet title={k ? 'Köder bearbeiten' : 'Neuer Köder'} onClose={() => onClose()}>
      <div className="row">
        {bildUrl && <img className="lure-prev" src={bildUrl} alt="Köderfoto" />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '1 1 160px', minWidth: 0 }}>
          <FotoKnopf label={arbeitet ? 'Wird verarbeitet …' : bildUrl ? 'Neues Foto' : 'Köder fotografieren'} onFile={fotoGewaehlt} />
          {bild?.frei && (
            <button type="button" className="ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setFreiZeigen(!freiZeigen)}>
              {freiZeigen ? 'Original zeigen' : 'Freigestellt zeigen'}
            </button>
          )}
          {bild && !bild.frei && <p className="hint">Freistellen hat nicht geklappt, das Bild wird quadratisch zugeschnitten. Tipp: Köder auf hellem, einfarbigem Untergrund fotografieren. Auf dem iPhone geht auch „Motiv freistellen“ in der Fotos-App.</p>}
          {!bildUrl && <p className="hint">Tipp: auf hellem, einfarbigem Untergrund fotografieren, dann schneidet die App den Köder aus.</p>}
        </div>
      </div>
      <div className="row">
        <label className="f" htmlFor="kName">Name<input id="kName" value={name} placeholder="z. B. Gummifisch 10 cm Chartreuse" onChange={(e) => setName(e.target.value)} /></label>
        <label className="f" htmlFor="kTyp">Ködertyp
          <select id="kTyp" value={typ} onChange={(e) => setTyp(e.target.value)}>{KOEDER_TYPEN.map((t) => <option key={t}>{t}</option>)}</select>
        </label>
      </div>
      <h3>Farbe{bild?.erkannt ? ` (erkannt: ${FARBEN[bild.erkannt][0]}, bitte prüfen)` : ''}</h3>
      <div className="swatches">
        {(Object.keys(FARBEN) as Farbfamilie[]).map((f) => (
          <button key={f} type="button" className="sw" aria-pressed={farbe === f} style={farbe === f ? { outline: '2px solid var(--accent)' } : undefined} onClick={() => setFarbe(f)}>
            <i style={{ background: FARBEN[f][1] }} />{FARBEN[f][0]}
          </button>
        ))}
      </div>
      <label className="chk" htmlFor="kFav"><input id="kFav" type="checkbox" checked={fav} onChange={(e) => setFav(e.target.checked)} />Lieblingsköder</label>
      {st && <p className="hint">{st.n ? `${st.n} Fänge · ${st.arten.join(', ')}${st.groesster ? ` · größter Fisch ${st.groesster.laenge} cm (${artName(st.groesster.art)})` : ''}` : 'Mit diesem Köder noch nichts gefangen.'}</p>}
      <div className="row between">
        <button type="button" className="primary go" style={{ flex: '1 1 auto', width: 'auto' }} onClick={speichern} disabled={arbeitet}>Köder speichern</button>
        {k && <ArmButton className="ghost danger" label="Löschen" onConfirm={loeschen} />}
      </div>
    </Sheet>
  );
}

/** Kamera oder Galerie über die normale Datei-Auswahl. */
export function FotoKnopf({ label, onFile }: { label: string; onFile: (f: File) => void }) {
  return (
    <label className="fileBtn">
      <Icon d={IC.camera} />
      {label}
      <input type="file" accept="image/*" aria-label={label} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
    </label>
  );
}
