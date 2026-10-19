import { useEffect, useState } from 'react';
import { db, speichereEinstellungen, speichereSession, type Angeltag, type Fang, type Gewaesser, type LaufendeSession } from '../db';
import { ArtWahl } from '../components/ArtWahl';
import { useFeier } from '../components/Feier';
import { Icon, IC } from '../components/Icons';
import { FotoKnopf, KoederBox, KoederLeiste } from '../components/Koeder';
import { RegelZeile } from '../components/Regeln';
import { DatenSicherung } from '../components/Sicherung';
import type { TabId } from '../components/TabBar';
import { ArmButton, useMeldung } from '../components/Ui';
import { useAngeltage, useEinstellungen, useFoto, useGewaesserMitEntfernung, useKoeder, useSession, useTick } from '../hooks/daten';
import { bisswertJetzt, schnappschussLaden } from '../hooks/schnappschuss';
import { reiheFuer } from '../hooks/wetter';
import { useWetterStand } from '../hooks/WetterKontext';
import { artName, hatProfil } from '../lib/arten';
import { loescheFoto, speichereFoto, verkleinern } from '../lib/foto';
import { bisherBest } from '../lib/punkte';
import { fangHinweis, regelFuer } from '../lib/regeln-sachsen';
import { TRUEBUNG, WASSERCHECK_GUELTIG_MS, wasserAlter, type Truebung } from '../lib/wasser';
import { datumKeyKurz, dauerUhr, fmt1, heuteKey, neueId, teile, zeitpunkt } from '../lib/zeit';

const biss = (n: number) => `${n} ${n === 1 ? 'Biss' : 'Bisse'}`;
const fische = (n: number) => `${n} Fisch${n === 1 ? '' : 'e'}`;

export function Angeln({ geheZu }: { geheZu: (t: TabId) => void }) {
  const session = useSession();
  const [nachtrag, setNachtrag] = useState(false);
  const [feedbackFuer, setFeedbackFuer] = useState<string | null>(null);

  return (
    <>
      <div className="panel">
        {session ? (
          <LiveSession s={session} onEnde={setFeedbackFuer} />
        ) : nachtrag ? (
          <Nachtrag onClose={() => setNachtrag(false)} />
        ) : (
          <>
            {feedbackFuer && <Feedback id={feedbackFuer} onDone={() => setFeedbackFuer(null)} />}
            <Start geheZu={geheZu} onNachtrag={() => setNachtrag(true)} />
          </>
        )}
      </div>
      <Fangbuch />
      <KoederBox />
      <DatenSicherung />
    </>
  );
}

function useFrischerWasserCheck(): { wert: Truebung; zeitpunkt: number } | null {
  const { wasserCheck } = useEinstellungen();
  return wasserCheck && Date.now() - wasserCheck.zeitpunkt < WASSERCHECK_GUELTIG_MS ? wasserCheck : null;
}

function Start({ geheZu, onNachtrag }: { geheZu: (t: TabId) => void; onNachtrag: () => void }) {
  const e = useEinstellungen();
  const waters = useGewaesserMitEntfernung();
  const melde = useMeldung();
  const [wid, setWid] = useState('');
  const [art, setArt] = useState(e.fischart);
  const [bestaetigt, setBestaetigt] = useState(false);
  const wc = useFrischerWasserCheck();
  useEffect(() => { if (!wid && waters.length) setWid(waters[0].id); }, [waters, wid]);
  useEffect(() => setArt(e.fischart), [e.fischart]);
  useEffect(() => setBestaetigt(false), [art, wid]);
  const w = waters.find((x) => x.id === wid);
  const R = regelFuer(art, w);

  async function start() {
    if (!w) { melde('Lege zuerst ein Gewässer an.'); return; }
    if (R.geschont && !bestaetigt) {
      setBestaetigt(true);
      melde(`${artName(art)} ist geschont. Gefangene Fische sofort schonend zurücksetzen.`);
      return;
    }
    await speichereSession({ start: Date.now(), gewaesserId: w.id, zielfisch: art, bisse: [], faenge: [], truebung: wc?.wert, wasserCheck: !!wc });
  }

  if (!waters.length) {
    return (
      <>
        <h2>Ans Wasser</h2>
        <p className="hint">Lege zuerst ein Gewässer an. Dann kannst du live mitloggen oder Angeltage nachtragen.</p>
        <button type="button" className="primary" onClick={() => geheZu('gewaesser')}>Gewässer suchen</button>
      </>
    );
  }
  return (
    <>
      <h2>Ans Wasser</h2>
      <div className="row">
        <label className="f" htmlFor="lvWater">Gewässer
          <select id="lvWater" value={wid} onChange={(ev) => setWid(ev.target.value)}>
            {waters.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </label>
        <label className="f" htmlFor="lvSp">Zielfisch<ArtWahl id="lvSp" value={art} onChange={setArt} /></label>
      </div>
      <RegelZeile art={art} w={w} />
      <p className="hint">
        {wc ? `Wasser: ${TRUEBUNG[wc.wert].n} (${wasserAlter(wc.zeitpunkt)})` : 'Wasser noch nicht geprüft. Das geht im Tab „Gewässer“.'}
      </p>
      <div className="btnrow">
        <button type="button" className="primary go" onClick={start}>{bestaetigt ? 'Verstanden, trotzdem starten' : 'Ich angle jetzt'}</button>
        <button type="button" className="go" onClick={onNachtrag}>Angeltag nachtragen</button>
      </div>
      <p className="hint">Live: Die App misst die Zeit mit, du tippst nur „Biss“ oder „Fisch gefangen“. Nachtragen: für Angeltage, die schon vorbei sind.</p>
    </>
  );
}

function Feedback({ id, onDone }: { id: string; onDone: () => void }) {
  const melde = useMeldung();
  const { stand, vergleichen } = useFeier();
  const [t, setT] = useState<Angeltag | null>(null);
  useEffect(() => { db.angeltage.get(id).then((x) => setT(x ?? null)); }, [id]);
  if (!t) return null;
  async function antwort(v: 'ja' | 'teils' | 'nein') {
    const vorher = await stand();
    await db.angeltage.update(id, { prognoseFeedback: v });
    await vergleichen(vorher);
    melde('Danke! +2 Punkte. Das hilft dem Bisswert, von dir zu lernen.');
    onDone();
  }
  return (
    <div className="fb">
      <p>Hat die Vorhersage gestimmt?{t.wetter.score != null ? ` Der Bisswert lag bei ${fmt1(t.wetter.score)}.` : ''}</p>
      <div className="row">
        <button type="button" onClick={() => antwort('ja')}>Ja</button>
        <button type="button" onClick={() => antwort('teils')}>Teilweise</button>
        <button type="button" onClick={() => antwort('nein')}>Nein</button>
        <button type="button" className="ghost" onClick={onDone}>Überspringen</button>
      </div>
    </div>
  );
}

function LiveSession({ s, onEnde }: { s: LaufendeSession; onEnde: (id: string) => void }) {
  const jetzt = useTick(true);
  const waters = useGewaesserMitEntfernung();
  const wetter = useWetterStand();
  const melde = useMeldung();
  const { stand, vergleichen } = useFeier();
  const [fangOffen, setFangOffen] = useState(false);
  const w = waters.find((x) => x.id === s.gewaesserId);
  const R = regelFuer(s.zielfisch, w);
  const score = w && hatProfil(s.zielfisch) ? bisswertJetzt(reiheFuer(wetter, w), w, s.zielfisch, jetzt) : null;

  async function bissNotieren() {
    await speichereSession({ ...s, bisse: [...s.bisse, Date.now()] });
    melde(`Biss notiert (${s.bisse.length + 1})`);
  }

  async function beenden() {
    const vorher = await stand();
    const gw = w ?? { lat: 50.9, lon: 13.4, typ: 'see' as const, name: 'Gewässer' };
    const { s: wx } = await schnappschussLaden(gw, s.zielfisch, s.start);
    const t = teile(s.start);
    const tag: Angeltag = {
      id: neueId('a'), datum: t.key, beginn: t.hhmm, startTs: s.start, dauerH: Math.max(0.1, Math.round((Date.now() - s.start) / 36e4) / 10),
      gewaesserId: s.gewaesserId, gewaesserName: w?.name ?? 'Gewässer', zielfisch: s.zielfisch, live: true,
      bisse: Math.max(s.bisse.length, s.faenge.length), bissZeiten: s.bisse, faenge: s.faenge, wasserCheck: !!s.wasserCheck,
      wetter: { ...wx, truebung: s.truebung },
    };
    await db.angeltage.put(tag);
    await speichereSession(null);
    const v = await vergleichen(vorher);
    melde(`Angeltag gespeichert: ${fmt1(tag.dauerH)} h, ${biss(tag.bisse)}, ${fische(tag.faenge.length)} · +${v.plus} Punkte${v.neu.length ? ` · Abzeichen: ${v.neu.join(', ')}` : ''}`);
    onEnde(tag.id);
  }

  async function verwerfen() {
    for (const f of s.faenge) await loescheFoto(f.fotoId);
    await speichereSession(null);
  }

  return (
    <>
      <div className="live-head"><span className="live-dot" /><h3>Du angelst · {w?.name ?? 'Gewässer'} · {artName(s.zielfisch)}</h3></div>
      <p className={R.geschont ? 'warn' : 'hint'}>
        {R.geschont ? `${artName(s.zielfisch)} ist geschont – Fänge sofort zurücksetzen.` : R.mindestmass ? `Mindestmaß ${artName(s.zielfisch)}: ${R.mindestmass} cm` : `Kein Mindestmaß für ${artName(s.zielfisch)}`}
      </p>
      <div className="timer" aria-live="off">{dauerUhr(jetzt - s.start)}</div>
      <div className="counters">
        <div className="counter"><div className="v">{s.bisse.length}</div><div className="k">Bisse</div></div>
        <div className="counter"><div className="v">{s.faenge.length}</div><div className="k">Fische</div></div>
        <div className="counter"><div className="v">{score != null ? fmt1(score) : '–'}</div><div className="k">Bisswert</div></div>
      </div>
      {fangOffen ? (
        <FangForm s={s} w={w} onClose={() => setFangOffen(false)} />
      ) : (
        <div className="actions">
          <button type="button" className="bite" onClick={bissNotieren}>Biss</button>
          <button type="button" className="primary" onClick={() => setFangOffen(true)}>Fisch gefangen</button>
        </div>
      )}
      {s.faenge.length > 0 && <div className="thumbs">{s.faenge.map((f) => <FangThumb key={f.id} f={f} />)}</div>}
      {s.truebung && <p className="hint">Wasser: {TRUEBUNG[s.truebung].n}</p>}
      <div className="row between">
        <ArmButton label="Angeln beenden" confirm="Wirklich beenden?" onConfirm={beenden} />
        <ArmButton className="ghost" label="Verwerfen" confirm="Wirklich verwerfen?" onConfirm={verwerfen} />
      </div>
    </>
  );
}

export function FangThumb({ f }: { f: Pick<Fang, 'fotoId' | 'fischart'> }) {
  const url = useFoto(f.fotoId);
  return url ? <img className="thumb" src={url} alt={`Foto ${artName(f.fischart)}`} /> : <div className="thumb"><Icon d={IC.fish} /></div>;
}

function FangForm({ s, w, onClose }: { s: LaufendeSession; w?: Gewaesser; onClose: () => void }) {
  const tage = useAngeltage();
  const koeder = useKoeder();
  const e = useEinstellungen();
  const wetter = useWetterStand();
  const melde = useMeldung();
  const { feiern } = useFeier();
  const [art, setArt] = useState(s.zielfisch);
  const [laenge, setLaenge] = useState('');
  const [koederId, setKoederId] = useState<string | null>(koeder.some((k) => k.id === e.letzterKoeder) ? e.letzterKoeder! : null);
  const [text, setText] = useState('');
  const [foto, setFoto] = useState<Blob | null>(null);
  const [vorschau, setVorschau] = useState<string | null>(null);
  const [zurueck, setZurueck] = useState(false);
  const len = +laenge || null;
  const hinweis = fangHinweis(art, len, w);
  const best = bisherBest([...tage.flatMap((t) => t.faenge), ...s.faenge], art);
  useEffect(() => { if (hinweis) setZurueck(true); }, [hinweis]);
  useEffect(() => {
    if (!foto) { setVorschau(null); return; }
    const u = URL.createObjectURL(foto);
    setVorschau(u);
    return () => URL.revokeObjectURL(u);
  }, [foto]);

  async function speichern(ev: React.FormEvent) {
    ev.preventDefault();
    const ts = Date.now();
    const k = koeder.find((x) => x.id === koederId);
    const f: Fang = {
      id: neueId('f'), zeit: ts, fischart: art, laengeCm: len ?? undefined,
      koeder: k ? k.name : text.trim() || undefined, koederId: k?.id, koederFarbe: k?.farbe,
      zurueckgesetzt: zurueck || undefined,
      score: w && hatProfil(art) ? bisswertJetzt(reiheFuer(wetter, w), w, art, ts) ?? undefined : undefined,
    };
    if (foto) f.fotoId = await speichereFoto(foto);
    await speichereSession({ ...s, faenge: [...s.faenge, f] });
    if (k) await speichereEinstellungen({ letzterKoeder: k.id });
    if (len && len > best) {
      melde(best ? `Neuer PB! ${artName(art)} ${len} cm (vorher ${best} cm) · +15 Punkte` : `Erster ${artName(art)} mit Länge: ${len} cm`);
      feiern({ art: 'pb', fisch: art, laenge: len, vorher: best });
    } else melde('Petri Heil! Fang gespeichert.');
    onClose();
  }

  return (
    <form className="sheet" onSubmit={speichern}>
      <h2>Fisch gefangen</h2>
      <div className="row">
        <label className="f" htmlFor="fcSp">Art<ArtWahl id="fcSp" value={art} onChange={setArt} /></label>
        <label className="f" htmlFor="fcLen">Länge (cm)<input id="fcLen" type="number" min={1} max={300} inputMode="numeric" value={laenge} onChange={(ev) => setLaenge(ev.target.value)} /></label>
      </div>
      {hinweis && <p className="warn">{hinweis}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span className="flabel">Köder</span>
        <KoederLeiste wert={koederId} onWahl={setKoederId} />
        {!koederId && <input aria-label="Köder als Text" placeholder="oder Köder als Text" value={text} onChange={(ev) => setText(ev.target.value)} />}
      </div>
      <div className="row">
        <FotoKnopf label={foto ? 'Anderes Foto' : 'Foto (Kamera oder Galerie)'} onFile={async (file) => {
          try { setFoto(await verkleinern(file)); } catch { melde('Das Foto konnte nicht gelesen werden. Versuch ein anderes Bild.'); }
        }} />
        {vorschau && <img className="preview" src={vorschau} alt="Vorschau" />}
      </div>
      <label className="chk" htmlFor="fcRel"><input id="fcRel" type="checkbox" checked={zurueck} onChange={(ev) => setZurueck(ev.target.checked)} />Zurückgesetzt</label>
      <p className="hint">{best ? `Dein PB ${artName(art)}: ${best} cm.` : `Erster ${artName(art)} mit Länge wird dein PB.`} Ohne Länge zählt der Fang nicht als PB.</p>
      <div className="row">
        <button type="submit" className="primary">Fang speichern</button>
        <button type="button" className="ghost" onClick={onClose}>Abbrechen</button>
      </div>
    </form>
  );
}

type FischZeile = { key: string; art: string; laenge: string; koederId: string; foto: Blob | null };

function Nachtrag({ onClose }: { onClose: () => void }) {
  const e = useEinstellungen();
  const waters = useGewaesserMitEntfernung();
  const tage = useAngeltage();
  const koeder = useKoeder();
  const melde = useMeldung();
  const { stand, vergleichen, feiern } = useFeier();
  const [datum, setDatum] = useState(heuteKey());
  const [beginn, setBeginn] = useState('06:00');
  const [dauer, setDauer] = useState('3');
  const [wid, setWid] = useState(waters[0]?.id ?? '');
  const [art, setArt] = useState(e.fischart);
  const [truebung, setTruebung] = useState<Truebung | ''>('');
  const [bisse, setBisse] = useState(0);
  const [fischListe, setFischListe] = useState<FischZeile[]>([]);
  const [speichert, setSpeichert] = useState(false);
  useEffect(() => { if (!wid && waters.length) setWid(waters[0].id); }, [waters, wid]);

  const setF = (k: string, p: Partial<FischZeile>) => setFischListe((l) => l.map((x) => (x.key === k ? { ...x, ...p } : x)));

  async function speichern(ev: React.FormEvent) {
    ev.preventDefault();
    const w = waters.find((x) => x.id === wid);
    if (!w) { melde('Lege zuerst ein Gewässer an.'); return; }
    const ts = zeitpunkt(datum, beginn || '06:00');
    if (ts > Date.now()) { melde('Der Angeltag liegt in der Zukunft. Prüf Datum und Beginn.'); return; }
    setSpeichert(true);
    try {
      const vorher = await stand();
      const { s: wx, mitWetter } = await schnappschussLaden(w, art, ts);
      const alle = tage.flatMap((t) => t.faenge);
      const faenge: Fang[] = [];
      const pbs: string[] = [];
      for (const z of fischListe) {
        const k = koeder.find((x) => x.id === z.koederId);
        const len = +z.laenge || undefined;
        const f: Fang = { id: neueId('f'), zeit: ts, fischart: z.art, laengeCm: len, koeder: k?.name, koederId: k?.id, koederFarbe: k?.farbe,
          score: hatProfil(z.art) && z.art === art ? wx.score : undefined };
        const best = bisherBest([...alle, ...faenge], z.art);
        if (len && len > best) { pbs.push(`${artName(z.art)} ${len} cm`); feiern({ art: 'pb', fisch: z.art, laenge: len, vorher: best }); }
        if (z.foto) f.fotoId = await speichereFoto(z.foto);
        faenge.push(f);
      }
      await db.angeltage.put({
        id: neueId('a'), datum, beginn, startTs: ts, dauerH: Math.max(0.5, +dauer || 1), gewaesserId: w.id, gewaesserName: w.name,
        zielfisch: art, live: false, bisse: Math.max(bisse, faenge.length), faenge, wetter: { ...wx, truebung: truebung || undefined },
      });
      const v = await vergleichen(vorher);
      melde(`Angeltag gespeichert · +${v.plus} Punkte${pbs.length ? ` · PB: ${pbs.join(', ')}` : ''}${faenge.length ? '' : ' · Schneidertag zählt extra'}${v.neu.length ? ` · Abzeichen: ${v.neu.join(', ')}` : ''}${mitWetter ? '' : ' · Wetter ließ sich nicht laden'}`);
      onClose();
      window.scrollTo({ top: 0 });
    } finally {
      setSpeichert(false);
    }
  }

  return (
    <form onSubmit={speichern} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="row between"><h2>Angeltag nachtragen</h2><button type="button" className="ghost" onClick={onClose}>Schließen</button></div>
      <div className="grp">
        <h3>Wann</h3>
        <div className="row">
          <label className="f" htmlFor="nDate">Datum<input id="nDate" type="date" required max={heuteKey()} value={datum} onChange={(ev) => setDatum(ev.target.value)} /></label>
          <label className="f" htmlFor="nStart">Beginn<input id="nStart" type="time" required value={beginn} onChange={(ev) => setBeginn(ev.target.value)} /></label>
          <label className="f" htmlFor="nDur">Dauer (h)<input id="nDur" type="number" min={0.5} max={24} step={0.5} required value={dauer} onChange={(ev) => setDauer(ev.target.value)} /></label>
        </div>
      </div>
      <div className="grp">
        <h3>Wo und worauf</h3>
        <div className="row">
          <label className="f" htmlFor="nWater">Gewässer
            <select id="nWater" value={wid} onChange={(ev) => setWid(ev.target.value)}>{waters.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
          </label>
          <label className="f" htmlFor="nSp">Zielfisch<ArtWahl id="nSp" value={art} onChange={setArt} /></label>
          <label className="f" htmlFor="nTurb">Wasser
            <select id="nTurb" value={truebung} onChange={(ev) => setTruebung(ev.target.value as Truebung | '')}>
              <option value="">Weiß ich nicht</option>
              {(Object.keys(TRUEBUNG) as Truebung[]).map((k) => <option key={k} value={k}>{TRUEBUNG[k].n} ({TRUEBUNG[k].d})</option>)}
            </select>
          </label>
        </div>
      </div>
      <div className="grp">
        <h3>Ergebnis</h3>
        <div className="row between">
          <span>Bisse</span>
          <div className="stepper">
            <button type="button" aria-label="Ein Biss weniger" onClick={() => setBisse(Math.max(0, bisse - 1))}>−</button>
            <span>{bisse}</span>
            <button type="button" aria-label="Ein Biss mehr" onClick={() => setBisse(bisse + 1)}>+</button>
          </div>
        </div>
        {fischListe.map((z, i) => (
          <div className="fishrow" key={z.key}>
            <label className="f" htmlFor={`nfS${i}`}>Fisch {i + 1}<ArtWahl id={`nfS${i}`} value={z.art} onChange={(a) => setF(z.key, { art: a })} /></label>
            <label className="f len" htmlFor={`nfL${i}`}>Länge (cm)<input id={`nfL${i}`} type="number" min={1} max={300} inputMode="numeric" placeholder="cm" value={z.laenge} onChange={(ev) => setF(z.key, { laenge: ev.target.value })} /></label>
            <label className="f" htmlFor={`nfK${i}`}>Köder
              <select id={`nfK${i}`} value={z.koederId} onChange={(ev) => setF(z.key, { koederId: ev.target.value })}>
                <option value="">Kein Köder</option>
                {koeder.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
              </select>
            </label>
            <div className="row between" style={{ flex: '1 1 100%' }}>
              <FotoKnopf label={z.foto ? 'Foto gewählt ✓' : 'Foto hinzufügen'} onFile={async (file) => {
                try { setF(z.key, { foto: await verkleinern(file) }); } catch { melde('Das Foto konnte nicht gelesen werden.'); }
              }} />
              <button type="button" className="ghost danger" onClick={() => setFischListe((l) => l.filter((x) => x.key !== z.key))}>Entfernen</button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => setFischListe((l) => [...l, { key: neueId('z'), art, laenge: '', koederId: e.letzterKoeder ?? '', foto: null }])}>
          {fischListe.length ? '+ Weiteren Fisch' : '+ Fisch hinzufügen'}
        </button>
        <p className="hint">{fischListe.length ? 'Mit Länge kann der Fisch dein PB werden.' : 'Ohne Fisch wird es ein Schneidertag. Die zählen extra (+15 Punkte).'}</p>
      </div>
      <button type="submit" className="primary go" disabled={speichert}>{speichert ? 'Speichert …' : 'Angeltag speichern'}</button>
    </form>
  );
}

function Fangbuch() {
  const tage = useAngeltage();
  const pbIds = new Set<string>();
  const best = new Map<string, Fang>();
  tage.forEach((t) => t.faenge.forEach((f) => { if (f.laengeCm && (!best.get(f.fischart) || f.laengeCm > best.get(f.fischart)!.laengeCm!)) best.set(f.fischart, f); }));
  best.forEach((f) => pbIds.add(f.id));
  return (
    <div className="panel">
      <div className="row between"><h2>Fangbuch</h2><span className="hint">{tage.length} Angeltage</span></div>
      <div className="list">
        {!tage.length && <p className="hint">Noch keine Einträge. Tipp oben auf „Ich angle jetzt“, wenn du am Wasser bist.</p>}
        {tage.map((t) => <FangbuchZeile key={t.id} t={t} pb={t.faenge.some((f) => pbIds.has(f.id))} />)}
      </div>
      <p className="hint">Fotos und Einträge bleiben nur in diesem Browser auf diesem Gerät. Sichere sie ab und zu (unten).</p>
    </div>
  );
}

function FangbuchZeile({ t, pb }: { t: Angeltag; pb: boolean }) {
  const arten = [...new Set(t.faenge.map((f) => artName(f.fischart)))];
  const laengen = t.faenge.filter((f) => f.laengeCm).map((f) => `${f.laengeCm} cm`);
  const mitFoto = t.faenge.find((f) => f.fotoId);
  async function loeschen() {
    for (const f of t.faenge) await loescheFoto(f.fotoId);
    await db.angeltage.delete(t.id);
  }
  return (
    <div className="item wl">
      {mitFoto && <FangThumb f={mitFoto} />}
      <div className="main">
        <div>{datumKeyKurz(t.datum, false)} · {t.gewaesserName}</div>
        <div>{[arten.length ? arten.join(', ') : artName(t.zielfisch), `${fmt1(t.dauerH)} h`, t.bisse ? biss(t.bisse) : '', laengen.join(', '), t.live ? 'live' : ''].filter(Boolean).join(' · ')}</div>
      </div>
      {pb && <span className="chip pb">PB</span>}
      <span className={'chip' + (t.faenge.length ? '' : ' zero')}>{t.faenge.length ? fische(t.faenge.length) : 'Schneider'}</span>
      <div className="acts"><ArmButton className="ghost danger" label="Löschen" onConfirm={loeschen} /></div>
    </div>
  );
}
