import { useEffect, useMemo, useState } from 'react';
import { db, ladeSession, speichereEinstellungen, speichereSession, type Angeltag, type Fang, type Koeder } from '../db';
import { Icon, IC } from '../components/Icons';
import { FotoKnopf } from '../components/Koeder';
import { Sheet, useMeldung } from '../components/Ui';
import { useAngeltage, useEinstellungen, useFoto, useKoeder, useSession } from '../hooks/daten';
import { ARTEN, artName } from '../lib/arten';
import { LICHT_NAME } from '../lib/astro';
import { beispielTage } from '../lib/demo';
import { loescheFoto, speichereFoto, verkleinern } from '../lib/foto';
import { EHRLICH_HINWEIS, farbAuswertung, koederAuswertung, MIN_TAGE_MYTHEN, mythenCheck } from '../lib/lernen';
import { abzeichen, pbVerlauf, PUNKTE_TEXT, punkte, RAENGE, rangVon, SAISON_NAME, saisonziele, stufenKeys, STUFEN_NAME } from '../lib/punkte';
import { rueckblick, verfuegbareJahre, type Rueckblick } from '../lib/rueckblick';
import { FARBEN, TRUEBUNG, type Truebung } from '../lib/wasser';
import { datumKeyKurz, datumKurz, fmt1, teile, uhrzeit } from '../lib/zeit';

type FangMitTag = { f: Fang; t: Angeltag; laeuft?: boolean };

export function Erfolge() {
  const echteTage = useAngeltage();
  const echteKoeder = useKoeder();
  const session = useSession();
  const e = useEinstellungen();
  const [demo, setDemo] = useState(false);
  const tage = useMemo(() => (demo ? beispielTage() : echteTage), [demo, echteTage]);
  const koeder = demo ? [] : echteKoeder;

  // Neue Abzeichen gelten als gesehen, sobald der Tab offen ist.
  useEffect(() => {
    if (!e.geladen || demo) return;
    const k = stufenKeys(abzeichen(echteTage, echteKoeder));
    if (k.some((x) => !e.gesehenAbzeichen.includes(x))) speichereEinstellungen({ gesehenAbzeichen: k });
  }, [e.geladen, echteTage, echteKoeder]); // eslint-disable-line react-hooks/exhaustive-deps

  // PBs: Fänge der laufenden Session zählen sofort mit.
  const pbTage: Angeltag[] = useMemo(() => {
    if (demo || !session) return tage;
    const t = teile(session.start);
    return [...tage, {
      id: 'live', datum: t.key, beginn: t.hhmm, startTs: session.start, dauerH: (Date.now() - session.start) / 36e5, gewaesserId: session.gewaesserId,
      gewaesserName: '', zielfisch: session.zielfisch, live: true, bisse: session.bisse.length, faenge: session.faenge, wetter: { licht: 'tag', mond: 'zunehmend' },
    }];
  }, [demo, session, tage]);

  return (
    <>
      <div className="row between">
        <span className="hint">{demo ? 'Beispiel: 60 erfundene Angeltage' : ''}</span>
        <button type="button" onClick={() => setDemo(!demo)}>{demo ? 'Zurück zu meinen Daten' : 'Mit Beispieldaten ansehen'}</button>
      </div>
      <RangBox tage={tage} koeder={koeder} />
      {!demo && <SaisonZiele tage={tage} />}
      <PBs tage={pbTage} demo={demo} />
      <Abzeichen tage={tage} koeder={koeder} />
      <WasFaengt tage={tage} />
      <MythenCheck tage={tage} />
      <Jahresrueckblick tage={tage} koeder={koeder} demo={demo} />
    </>
  );
}

function RangBox({ tage, koeder }: { tage: Angeltag[]; koeder: Koeder[] }) {
  const p = punkte(tage, koeder);
  const r = rangVon(p);
  const anteil = r.naechster ? ((p - r.ab) / (r.naechster[0] - r.ab)) * 100 : 100;
  return (
    <div className="panel">
      <div className="rank">
        <div className="badge-big">{r.i + 1}</div>
        <div>
          <h3>Rang {r.i + 1} von {RAENGE.length}</h3>
          <div className="name">{r.name}</div>
          <div className="xp"><i style={{ width: `${anteil}%` }} /></div>
          <p className="hint mono">{p} Punkte{r.naechster ? ` · noch ${r.naechster[0] - p} bis „${r.naechster[1]}“` : ' · höchster Rang'}</p>
        </div>
      </div>
      <p className="hint">{PUNKTE_TEXT}</p>
    </div>
  );
}

function SaisonZiele({ tage }: { tage: Angeltag[] }) {
  const z = saisonziele(tage);
  return (
    <div className="panel">
      <div className="row between"><h2>Ziele für {SAISON_NAME[z.s]}</h2><span className="hint">noch {z.restTage} Tage</span></div>
      {z.ziele.map((g) => (
        <div key={g.id} className="goal">
          <div className="row"><span>{g.erreicht ? '✓ ' : ''}{g.text}</span><span className="hint mono">{Math.min(g.v, g.ziel)} von {g.ziel}</span></div>
          <div className="xp"><i style={{ width: `${Math.min(100, (g.v / g.ziel) * 100)}%` }} /></div>
        </div>
      ))}
      <p className="hint">Jedes erreichte Ziel bringt 15 Punkte. Die Ziele richten sich nach deinem Vorjahr, nie nach Fischmenge.</p>
    </div>
  );
}

function fangeVonArt(k: string, tage: Angeltag[]): FangMitTag[] {
  const l: FangMitTag[] = [];
  tage.forEach((t) => t.faenge.forEach((f) => { if (f.fischart === k) l.push({ f, t, laeuft: t.id === 'live' }); }));
  return l.sort((a, b) => (b.f.laengeCm ?? 0) - (a.f.laengeCm ?? 0) || +!!b.f.fotoId - +!!a.f.fotoId);
}

function PBs({ tage, demo }: { tage: Angeltag[]; demo: boolean }) {
  const [offen, setOffen] = useState<string | null>(null);
  const karten = Object.keys(ARTEN).map((k) => { const l = fangeVonArt(k, tage); return l.length ? { k, top: l[0], n: l.length } : null; })
    .filter(Boolean).sort((a, b) => (b!.top.f.laengeCm ?? 0) - (a!.top.f.laengeCm ?? 0)) as { k: string; top: FangMitTag; n: number }[];
  return (
    <div className="panel">
      <div className="row between"><h2>Deine PBs</h2><span className="hint">Tippe für Details</span></div>
      {!karten.length && <p className="hint">Noch kein Fisch im Buch. Sobald du einen Fang einträgst, erscheint hier dein PB für diese Art.</p>}
      <div className="pbs">
        {karten.map(({ k, top, n }) => <PbKarte key={k} k={k} top={top} n={n} demo={demo} onOpen={() => setOffen(k)} />)}
      </div>
      {offen && <PbDetail k={offen} tage={tage} demo={demo} onClose={() => setOffen(null)} />}
    </div>
  );
}

function FangFoto({ f, className }: { f: Fang; className: string }) {
  const url = useFoto(f.fotoId);
  return url ? <img className={className} src={url} alt={artName(f.fischart) + (f.laengeCm ? `, ${f.laengeCm} cm` : '')} /> : <div className={className}><Icon d={IC.fish} /></div>;
}

async function fotoSetzen(x: FangMitTag, file: File) {
  const id = await speichereFoto(await verkleinern(file));
  await loescheFoto(x.f.fotoId);
  if (x.laeuft) {
    const sess = await ladeSession();
    if (sess) await speichereSession({ ...sess, faenge: sess.faenge.map((f) => (f.id === x.f.id ? { ...f, fotoId: id } : f)) });
  } else {
    await db.angeltage.update(x.t.id, { faenge: x.t.faenge.map((f) => (f.id === x.f.id ? { ...f, fotoId: id } : f)) });
  }
}

function PbKarte({ k, top, n, demo, onOpen }: { k: string; top: FangMitTag; n: number; demo: boolean; onOpen: () => void }) {
  const { f, t, laeuft } = top;
  const melde = useMeldung();
  return (
    <div className="pb">
      <button type="button" className="pb" onClick={onOpen} aria-label={`PB ${artName(k)}${f.laengeCm ? `, ${f.laengeCm} cm` : ''}. Details öffnen`}>
        <div className="ph"><FangFoto f={f} className="" /></div>
        <div className="tx">
          <span className="sp">{artName(k)}</span>
          {f.laengeCm ? <span className="len">{f.laengeCm}<small> cm</small></span> : <span className="len nolen">Länge fehlt</span>}
          <span className="meta">{[datumKeyKurz(t.datum), t.gewaesserName, laeuft ? 'läuft gerade' : '', n > 1 ? `${n} Fänge` : ''].filter(Boolean).join(' · ')}</span>
        </div>
      </button>
      {!f.fotoId && !demo && (
        <div className="tx"><FotoKnopf label="Foto hinzufügen" onFile={async (file) => { try { await fotoSetzen(top, file); melde('Foto gespeichert · +2 Punkte'); } catch { melde('Das Foto konnte nicht gelesen werden.'); } }} /></div>
      )}
    </div>
  );
}

function bedingungen(f: Fang, t: Angeltag): [string, string][] {
  const w = f.wetter ?? t.wetter;
  const sc = f.score ?? w.score;
  return [
    ['Bisswert', sc != null ? fmt1(sc) : '–'],
    ['Licht', LICHT_NAME[w.licht]],
    ['Bewölkung', w.bewoelkungProzent != null ? `${w.bewoelkungProzent} %` : w.bewoelkung ?? '–'],
    ['Wind', w.windKmh != null ? `${w.windKmh} km/h` : '–'],
    ['Luftdruck', w.luftdruckHpa != null ? `${w.luftdruckHpa} hPa, ${w.luftdruckTrend}` : w.luftdruckTrend ?? '–'],
    ['Wasser (gesch.)', w.wasserTempGeschaetzt != null ? `${fmt1(w.wasserTempGeschaetzt)} °C` : '–'],
    ['Luft', w.lufttemp != null ? `${fmt1(w.lufttemp)} °C` : '–'],
    ['Mond', w.mond],
  ];
}

function Fakten({ rows }: { rows: [string, string][] }) {
  return <div className="facts">{rows.map(([k, v]) => <div className="fact" key={k}><div className="k">{k}</div><div className="v small">{v}</div></div>)}</div>;
}

function PbDetail({ k, tage, demo, onClose }: { k: string; tage: Angeltag[]; demo: boolean; onClose: () => void }) {
  const melde = useMeldung();
  const alle = fangeVonArt(k, tage);
  if (!alle.length) return null;
  const x = alle[0], { f, t } = x;
  const verlauf = pbVerlauf(tage.filter((d) => d.id !== 'live'), k);
  return (
    <Sheet title={`PB ${artName(k)}`} onClose={onClose}>
      <FangFoto f={f} className="mphoto" />
      {!demo && <FotoKnopf label={f.fotoId ? 'Foto ändern' : 'Foto hinzufügen'} onFile={async (file) => { try { await fotoSetzen(x, file); melde('Foto gespeichert.'); } catch { melde('Das Foto konnte nicht gelesen werden.'); } }} />}
      <div className={'mlen' + (f.laengeCm ? '' : ' nolen')}>{f.laengeCm ? <>{f.laengeCm}<small> cm</small></> : 'Länge fehlt'}</div>
      <Fakten rows={[
        ['Datum', datumKeyKurz(t.datum)], ['Uhrzeit', `${uhrzeit(f.zeit)} Uhr`], ['Gewässer', t.gewaesserName || '–'], ['Köder', f.koeder ?? '–'],
        ['Angeltag', x.laeuft ? 'läuft gerade' : `${fmt1(t.dauerH)} h${t.bisse ? `, ${t.bisse} ${t.bisse === 1 ? 'Biss' : 'Bisse'}` : ''}`], ['Fänge an dem Tag', String(t.faenge.length)],
      ]} />
      <h3>Bedingungen beim Fang</h3>
      <Fakten rows={bedingungen(f, t)} />
      {verlauf.length >= 2 && (
        <>
          <h3>PB-Verlauf</h3>
          <PbKurve l={verlauf} />
          <div className="list">
            {verlauf.slice().reverse().map(({ f: g, t: d }) => (
              <div className="item" key={g.id}>
                <div className="main"><div>{g.laengeCm} cm</div><div>{[datumKeyKurz(d.datum), d.gewaesserName, g.koeder].filter(Boolean).join(' · ')}</div></div>
              </div>
            ))}
          </div>
        </>
      )}
      {alle.length > 1 && (
        <>
          <h3>Deine Top {Math.min(5, alle.length)} {artName(k)}</h3>
          <div className="list">
            {alle.slice(0, 5).map(({ f: g, t: d }, i) => (
              <div className="item" key={g.id}>
                <FangFoto f={g} className="thumb" />
                <div className="main"><div>{g.laengeCm ? `${g.laengeCm} cm` : 'ohne Länge'}</div><div>{[datumKeyKurz(d.datum), d.gewaesserName].filter(Boolean).join(' · ')}</div></div>
                {i === 0 && <span className="chip pb">PB</span>}
              </div>
            ))}
          </div>
        </>
      )}
    </Sheet>
  );
}

/** Stufenlinie der Rekordlänge über die Zeit, jeder neue PB ein Punkt mit Datum. */
function PbKurve({ l }: { l: { f: Fang; t: Angeltag }[] }) {
  const W = 320, H = 150, P = 28;
  const t0 = l[0].f.zeit, t1 = Math.max(Date.now(), l[l.length - 1].f.zeit);
  const lens = l.map((x) => x.f.laengeCm!);
  const lo = Math.floor(Math.min(...lens) * 0.9), hi = Math.ceil(Math.max(...lens) * 1.05);
  const X = (ts: number) => P + ((ts - t0) / Math.max(1, t1 - t0)) * (W - 2 * P);
  const Y = (v: number) => H - P - ((v - lo) / Math.max(1, hi - lo)) * (H - 2 * P);
  let d = '';
  l.forEach((x, i) => { d += i ? `H${X(x.f.zeit)}V${Y(x.f.laengeCm!)}` : `M${X(x.f.zeit)} ${Y(x.f.laengeCm!)}`; });
  d += `H${X(t1)}`;
  return (
    <svg className="pbcurve" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`PB-Verlauf: ${lens.join(', ')} cm`}>
      <line className="ax" x1={P} y1={H - P} x2={W - P} y2={H - P} />
      <path className="ln" d={d} fill="none" strokeWidth="2.5" />
      {l.map((x) => (
        <g key={x.f.id}>
          <circle className="pt" cx={X(x.f.zeit)} cy={Y(x.f.laengeCm!)} r="4.5" />
          <text x={X(x.f.zeit)} y={Y(x.f.laengeCm!) - 9} textAnchor="middle">{x.f.laengeCm}</text>
          <text x={X(x.f.zeit)} y={H - P + 14} textAnchor="middle">{datumKurz(x.f.zeit).replace(/ \d{4}$/, '')}</text>
        </g>
      ))}
    </svg>
  );
}

function Abzeichen({ tage, koeder }: { tage: Angeltag[]; koeder: Koeder[] }) {
  return (
    <div className="panel">
      <h2>Abzeichen</h2>
      <div className="badges">
        {abzeichen(tage, koeder).map((a) => {
          const einstufig = a.stufen.length === 1;
          const t = einstufig ? (a.stufe ? 3 : 0) : a.stufe;
          return (
            <div key={a.id} className={'bd' + (a.stufe ? ' on' : '')}>
              <div className={`medal${t ? ` t${t}` : ''}`}><Icon d={IC[a.ic as keyof typeof IC]} /></div>
              <div className="n">{a.n}</div>
              {!einstufig && a.stufe > 0 && <div className="tier">{STUFEN_NAME[a.stufe]}</div>}
              <div className="d">{einstufig ? `${a.stufen[0]} ${a.d}` : a.d}</div>
              {a.naechstes != null && <div className="pr">{Math.min(a.v, a.naechstes)} von {a.naechstes}</div>}
            </div>
          );
        })}
      </div>
      <p className="hint">Bronze, Silber, Gold: jede neue Stufe bringt 10 Punkte.</p>
    </div>
  );
}

function WasFaengt({ tage }: { tage: Angeltag[] }) {
  const zeilen = (Object.keys(TRUEBUNG) as Truebung[]).map((k) => ({ k, fa: farbAuswertung(k, tage), ka: koederAuswertung(k, tage) })).filter((z) => z.fa || z.ka);
  return (
    <div className="panel">
      <h2>Was bei dir fängt</h2>
      <p className="hint">Köderfarbe und Köder je Wassertrübung</p>
      <div className="list">
        {zeilen.map(({ k, fa, ka }) => (
          <div className="item" key={k}>
            {fa && <div className="sw"><i style={{ background: FARBEN[fa.farbe][1] }} /></div>}
            <div className="main">
              <div>{TRUEBUNG[k].n}</div>
              <div>{[fa ? `${fa.n} von ${fa.gesamt} Fängen auf ${FARBEN[fa.farbe][0]}` : '', ka ? `meist „${ka.koeder}“` : ''].filter(Boolean).join(' · ')}</div>
            </div>
          </div>
        ))}
      </div>
      <p className="hint">{zeilen.length ? EHRLICH_HINWEIS : 'Wähl beim Fang den Köder aus deiner Köderbox und mach den Wasser-Check. Dann siehst du hier, welche Farbe bei welchem Wasser bei dir fängt.'}</p>
    </div>
  );
}

function MythenCheck({ tage }: { tage: Angeltag[] }) {
  const [wert, setWert] = useState<'fische' | 'bisse'>('fische');
  const n = tage.length;
  return (
    <div className="panel">
      <h2>Mythen-Check</h2>
      {n < MIN_TAGE_MYTHEN ? (
        <div className="lock">
          <p className="verdict">Wird nach {MIN_TAGE_MYTHEN} Angeltagen freigeschaltet</p>
          <div className="xp"><i style={{ width: `${(n / MIN_TAGE_MYTHEN) * 100}%` }} /></div>
          <p className="hint mono">{n} von {MIN_TAGE_MYTHEN}</p>
          <p className="hint">Dann siehst du, ob Luftdruck, Tageszeit, Wolken, Wassertrübung oder Mond bei dir wirklich etwas ändern.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="chips">
            <button type="button" aria-pressed={wert === 'fische'} onClick={() => setWert('fische')}>Fische pro Stunde</button>
            <button type="button" aria-pressed={wert === 'bisse'} onClick={() => setWert('bisse')}>Bisse pro Stunde</button>
          </div>
          {mythenCheck(tage, wert).map((m) => {
            const max = Math.max(...m.gruppen.map((g) => g.rate), 0.01);
            return (
              <div className="myth" key={m.titel}>
                <h3>{m.titel}</h3>
                {m.gruppen.map((g) => (
                  <div className="mb" key={g.gruppe}>
                    <span>{g.label}</span>
                    <div className="track"><i className={g.rate === max && g.n ? 'max' : ''} style={{ width: `${(g.rate / max) * 100}%` }} /></div>
                    <span className="val mono">{g.n ? `${g.rate.toLocaleString('de-DE', { maximumFractionDigits: 2 })}/h` : '–'}</span>
                  </div>
                ))}
                <p className="verdict">{m.urteil}</p>
                <p className="hint">{m.gruppen.map((g) => `${g.label}: ${g.n} Tage`).join(' · ')}</p>
              </div>
            );
          })}
          <p className="hint">{wert === 'fische' ? 'Fische' : 'Bisse'} pro Stunde, Schneidertage eingerechnet. Ein einfacher Vergleich, keine strenge Statistik. Aussagen erst ab 4 Angeltagen je Gruppe.</p>
        </div>
      )}
    </div>
  );
}

function Jahresrueckblick({ tage, koeder, demo }: { tage: Angeltag[]; koeder: Koeder[]; demo: boolean }) {
  const jahre = verfuegbareJahre(tage);
  const [jahr, setJahr] = useState<number | null>(null);
  const j = jahr && jahre.includes(jahr) ? jahr : jahre[0];
  const r = useMemo(() => (j ? rueckblick(tage, j, koeder) : null), [tage, j, koeder]);
  const [seite, setSeite] = useState(0);
  return (
    <div className="panel">
      <div className="row between">
        <h2>Jahresrückblick</h2>
        {jahre.length > 1 && <select aria-label="Jahr" value={j} onChange={(e) => setJahr(+e.target.value)} style={{ width: 'auto' }}>{jahre.map((x) => <option key={x}>{x}</option>)}</select>}
      </div>
      {!r ? (
        <p className="hint">Ab 1. Dezember siehst du hier dein Angeljahr {teile(Date.now()).y}. Vergangene Jahre jederzeit.</p>
      ) : (
        <>
          {r.tage < 5 && <p className="hint">Nur {r.tage} Angeltage in {r.jahr}: Die Zahlen sind noch wenig aussagekräftig.</p>}
          <div className="review" onScroll={(e) => { const el = e.currentTarget; setSeite(Math.round(el.scrollLeft / el.clientWidth)); }}>
            {seiten(r).map((s, i) => <div className="page" key={i}>{s}</div>)}
          </div>
          <div className="dots" aria-hidden="true">{seiten(r).map((_, i) => <i key={i} className={i === seite ? 'on' : ''} />)}</div>
          <p className="hint">Zum Blättern wischen.</p>
          {!demo && <button type="button" onClick={() => alsBild(r)}>Als Bild speichern</button>}
          <p className="hint">Das Bild enthält keine Ortsangaben und keine GPS-Daten.</p>
        </>
      )}
    </div>
  );
}

function seiten(r: Rueckblick) {
  return [
    <><h3>Dein Angeljahr {r.jahr}</h3><div className="big">{r.tage}</div><p>Angeltage, {fmt1(r.stunden)} Stunden am Wasser</p></>,
    <><h3>Fänge</h3><div className="big">{r.faenge}</div><p>Fische, dazu {r.schneider} ehrliche Schneidertage</p></>,
    <><h3>Neue PBs</h3>{r.neuePBs.length ? r.neuePBs.slice(-4).map(({ f }) => <p key={f.id}><b>{artName(f.fischart)}</b> {f.laengeCm} cm</p>) : <p>Keine neuen PBs in diesem Jahr.</p>}</>,
    <><h3>Gewässer</h3>
      {r.meistGewaesser && <p>Am häufigsten: <b>{r.meistGewaesser.name}</b> ({r.meistGewaesser.n} Angeltage)</p>}
      {r.bestesGewaesser && <p>Am besten: <b>{r.bestesGewaesser.name}</b> mit {fmt1(r.bestesGewaesser.rate)} Fischen pro Stunde ({r.bestesGewaesser.n} Angeltage)</p>}
    </>,
    <><h3>Köder</h3>
      {r.besterKoeder ? <p>Bester Köder: <b>{r.besterKoeder.name}</b> ({r.besterKoeder.n} Fänge)</p> : <p>Noch keine Köder eingetragen.</p>}
      {r.farben.map((x) => <p key={x.truebung}>{TRUEBUNG[x.truebung].n}: {FARBEN[x.farbe][0]} ({x.n} von {x.gesamt})</p>)}
    </>,
    <><h3>Bester Monat</h3>{r.besterMonat ? <><div className="big">{r.besterMonat.name}</div><p>{fmt1(r.besterMonat.rate)} Fische pro Stunde ({r.besterMonat.n} Angeltage)</p></> : <p>Noch zu wenige Angeltage je Monat.</p>}</>,
    <><h3>Rang und Abzeichen</h3><p>Von <b>{r.rangStart}</b> zu <b>{r.rangEnde}</b> · +{r.punkteJahr} Punkte</p>
      {r.neueAbzeichen.length ? <p>Neue Abzeichen: {r.neueAbzeichen.join(', ')}</p> : null}</>,
  ];
}

/** Rückblick als PNG zum Speichern (ohne Gewässernamen, ohne Ortsangaben). */
function alsBild(r: Rueckblick) {
  const c = document.createElement('canvas');
  c.width = 1080; c.height = 1350;
  const x = c.getContext('2d')!;
  x.fillStyle = '#0E3B43'; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = '#F2C230'; x.fillRect(80, 120, 14, 220);
  x.fillStyle = '#E4ECE8';
  x.font = '800 96px "Barlow Condensed", sans-serif'; x.fillText('BISSFIBEL', 120, 200);
  x.font = '700 64px "Barlow Condensed", sans-serif'; x.fillText(`Mein Angeljahr ${r.jahr}`, 120, 300);
  const zeilen: [string, string][] = [
    [String(r.tage), `Angeltage · ${fmt1(r.stunden)} h am Wasser`],
    [String(r.faenge), `Fische · ${r.schneider} Schneidertage`],
    [String(r.neuePBs.length), 'neue PBs'],
    ...r.neuePBs.slice(-3).map((p) => [`${p.f.laengeCm} cm`, artName(p.f.fischart)] as [string, string]),
    [r.rangEnde, `Rang · +${r.punkteJahr} Punkte`],
  ];
  let y = 460;
  zeilen.forEach(([a, b]) => {
    x.fillStyle = '#6CB9B4'; x.font = '800 88px "Barlow Condensed", sans-serif'; x.fillText(a, 120, y);
    x.fillStyle = '#E4ECE8'; x.font = '500 40px "Public Sans", sans-serif'; x.fillText(b, 120, y + 52);
    y += 150;
  });
  c.toBlob((b) => {
    if (!b) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = `bissfibel-${r.jahr}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }, 'image/png');
}
