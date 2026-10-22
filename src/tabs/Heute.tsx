import { useMemo, useState } from 'react';
import { speichereEinstellungen, type Gewaesser } from '../db';
import { AlarmSchalter } from '../components/AlarmSchalter';
import { Icon, IC, MoonSvg, SunArc, WindSock, WxIcon, wetterWort } from '../components/Icons';
import { OrtSuche } from '../components/OrtSuche';
import { RegelZeile } from '../components/Regeln';
import { Pegellatte } from '../components/Ui';
import { PegelBox } from '../components/Pegel';
import { useAngeltage, useEinstellungen, useGewaesserMitEntfernung } from '../hooks/daten';
import { reiheFuer } from '../hooks/wetter';
import { useWetterStand } from '../hooks/WetterKontext';
import { ARTEN, artName, GRUPPEN, hatProfil } from '../lib/arten';
import { mond as mondVon, sonne } from '../lib/astro';
import { gewaesserLernen, gruppenAus, MIN_TAGE_ART, MIN_TAGE_GEWAESSER, mitGewaesser, persoenlich, faengeVon } from '../lib/lernen';
import { prognose, type TagesPrognose } from '../lib/prognose';
import { raubfischVerbotGilt, regelFuer } from '../lib/regeln-sachsen';
import { ALARM_AB, sicherheitsWarnung, stufe, urteile, windText, nachStrich, type Urteil } from '../lib/score';
import { WETTER_QUELLE } from '../lib/wetter';
import { datumKeyKurz, datumLang, fmt1, uhrzeit, wochentag, STUNDE } from '../lib/zeit';
import type { TabId } from '../components/TabBar';

type GW = Gewaesser & { distKm: number | null };

export function Heute({ geheZu }: { geheZu: (t: TabId) => void }) {
  const e = useEinstellungen();
  const waters = useGewaesserMitEntfernung();
  const wetter = useWetterStand();
  const tage = useAngeltage();
  const [favOffen, setFavOffen] = useState(false);
  const [wahl, setWahl] = useState<{ id: string; key: string } | null>(null);
  const [lernOffen, setLernOffen] = useState(false);
  const art = hatProfil(e.fischart) ? e.fischart : e.topFische[0] ?? 'hecht';

  const prognosen = useMemo(() => {
    const m = new Map<string, TagesPrognose[]>();
    waters.forEach((w) => {
      const r = reiheFuer(wetter, w);
      if (r) m.set(w.id, prognose(r, w.typ, art));
    });
    return m;
  }, [waters, wetter.reihen, art]); // eslint-disable-line react-hooks/exhaustive-deps

  const kandidaten = useMemo(() => {
    const c: { w: GW; tag: TagesPrognose }[] = [];
    waters.filter((w) => w.distKm == null || w.distKm <= e.umkreisKm).forEach((w) => prognosen.get(w.id)?.forEach((tag) => c.push({ w, tag })));
    return c.sort((a, b) => b.tag.bestes.avg - a.tag.bestes.avg);
  }, [prognosen, waters, e.umkreisKm]);

  if (!e.geladen) return null;
  if (!e.wohnort) return <Willkommen geheZu={geheZu} />;

  const zeigeFav = favOffen || !e.topFischeGewaehlt;
  const best = kandidaten[0];
  const detailW = waters.find((w) => w.id === (wahl?.id ?? best?.w.id)) ?? waters[0];
  const detailTage = detailW ? prognosen.get(detailW.id) ?? [] : [];
  const detailTag = detailTage.find((t) => t.key === (wahl?.key ?? best?.tag.key)) ?? detailTage[0];

  return (
    <>
      {zeigeFav ? (
        <FavWahl gewaehlt={e.topFische} erstes={!e.topFischeGewaehlt} onFertig={(l) => {
          speichereEinstellungen({ topFische: l, topFischeGewaehlt: true, fischart: l.includes(e.fischart) ? e.fischart : l[0] });
          setFavOffen(false);
        }} />
      ) : (
        <div className="chips" role="group" aria-label="Fischart">
          {e.topFische.map((k) => {
            const R = regelFuer(k, null);
            const geschont = R.geschont && !R.ganzjaehrig;
            return (
              <button key={k} type="button" className={geschont ? 'closed' : undefined} title={geschont ? 'Schonzeit' : undefined}
                aria-pressed={k === art} onClick={() => speichereEinstellungen({ fischart: k })}>{artName(k)}</button>
            );
          })}
          <button type="button" className="edit" onClick={() => setFavOffen(true)}>{e.topFische.length < 5 ? '+ Fisch' : 'Ändern'}</button>
        </div>
      )}

      <Hero art={art} best={best} waters={waters} wetterLaedt={wetter.laden} wetterFehler={wetter.fehler} geheZu={geheZu}
        tage={tage} umkreis={e.umkreisKm} />
      <AlarmSchalter />

      {detailW && (
        <div className="panel" id="detail">
          <h2>Gewässer im Detail</h2>
          <select aria-label="Gewässer" value={detailW.id} onChange={(ev) => setWahl({ id: ev.target.value, key: detailTag?.key ?? '' })}>
            {waters.map((w) => <option key={w.id} value={w.id}>{w.name}{w.distKm != null ? ` · ${fmt1(w.distKm)} km` : ''}</option>)}
          </select>
          {!detailTage.length && <p className="hint">{wetter.laden ? 'Wetter wird geladen …' : 'Für dieses Gewässer gibt es noch kein Wetter.'}</p>}
          {detailTage.length > 0 && (
            <div className="days">
              {detailTage.map((t, i) => {
                const mittag = t.stunden[13] ?? t.stunden[12];
                return (
                  <button key={t.key} type="button" className="day" aria-pressed={t.key === detailTag?.key}
                    aria-label={`${i === 0 ? 'Heute' : datumLang(t.start)}: Bisswert ${fmt1(t.bestes.avg)}`}
                    onClick={() => setWahl({ id: detailW.id, key: t.key })}>
                    <span className="wd">{i === 0 && t.key === detailTage[0].key && t.start <= Date.now() ? 'Heute' : wochentag(t.start)}</span>
                    <WxIcon c={mittag.s.c} rp={mittag.s.rp} nacht={false} className="wxs" />
                    <span className="bar"><i style={{ height: `${t.bestes.avg * 10}%` }} /></span>
                    <span className="sc">{fmt1(t.bestes.avg)}</span>
                  </button>
                );
              })}
            </div>
          )}
          {detailTag && (
            <TagDetail w={detailW} tag={detailTag} art={art} tage={tage}
              lernOffen={lernOffen} setLernOffen={setLernOffen} />
          )}
        </div>
      )}

      {kandidaten.length > 1 && <WeitereFenster kandidaten={kandidaten} onWahl={(id, key) => {
        setWahl({ id, key });
        document.getElementById('detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }} />}

      <p className="src">
        {WETTER_QUELLE}{wetter.stand ? ` · Stand ${uhrzeit(wetter.stand)} Uhr` : ''} · Prognosen ohne Gewähr.{' '}
        <button type="button" className="linkbtn" onClick={wetter.neuLaden} disabled={wetter.laden}>{wetter.laden ? 'lädt …' : 'Neu laden'}</button>
      </p>
    </>
  );
}

function Willkommen({ geheZu }: { geheZu: (t: TabId) => void }) {
  const e = useEinstellungen();
  return (
    <div className="panel">
      <h2>Willkommen bei der Bissfibel</h2>
      <p>Die App sagt dir, an welchem deiner Gewässer und wann es sich in den nächsten 7 Tagen lohnt. Und sie lernt aus deinem Fangbuch.</p>
      <p className="hint">Schritt 1: Wo wohnst du? Die App gibt es vorerst nur für Sachsen.</p>
      <OrtSuche startText="" onWahl={(o) => speichereEinstellungen({ wohnort: { name: o.name, lat: o.lat, lon: o.lon } })} />
      <p className="hint">Danach suchst du im Tab „Gewässer“ deine Gewässer im Umkreis (gerade {e.umkreisKm} km).</p>
      <button type="button" className="ghost" style={{ alignSelf: 'flex-start' }} onClick={() => geheZu('gewaesser')}>Zum Tab „Gewässer“</button>
    </div>
  );
}

function FavWahl({ gewaehlt, erstes, onFertig }: { gewaehlt: string[]; erstes: boolean; onFertig: (l: string[]) => void }) {
  const [l, setL] = useState(gewaehlt.filter(hatProfil));
  const voll = l.length >= 5;
  return (
    <div className="panel">
      <h2>Deine Top 5 Fische</h2>
      <p className="hint">{erstes
        ? 'Wähl bis zu 5 Fische, für die du die Vorhersage sehen willst. Fangen und eintragen kannst du trotzdem alle Arten.'
        : 'Für diese Fische siehst du die Vorhersage. Tippe zum Wählen oder Abwählen.'}</p>
      <p className="verdict">{l.length} von 5 gewählt{voll ? ' · Nimm erst einen raus, um einen anderen zu wählen.' : ''}</p>
      {GRUPPEN.map(([g, lab]) => (
        <div key={g} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h3>{lab}</h3>
          <div className="picks">
            {Object.values(ARTEN).filter((a) => a.profil?.gruppe === g).map((a) => {
              const an = l.includes(a.key);
              return (
                <button key={a.key} type="button" aria-pressed={an} disabled={voll && !an} title={voll && !an ? 'Nimm erst einen anderen Fisch raus' : undefined}
                  onClick={() => setL(an ? l.filter((x) => x !== a.key) : [...l, a.key])}>{a.name}</button>
              );
            })}
          </div>
        </div>
      ))}
      <button type="button" className="primary" disabled={!l.length} onClick={() => onFertig(l)}>{l.length ? 'Fertig' : 'Mindestens einen Fisch wählen'}</button>
    </div>
  );
}

function Hero({ art, best, waters, wetterLaedt, wetterFehler, geheZu, tage, umkreis }: {
  art: string; best?: { w: GW; tag: TagesPrognose }; waters: GW[]; wetterLaedt: boolean; wetterFehler: string | null;
  geheZu: (t: TabId) => void; tage: ReturnType<typeof useAngeltage>; umkreis: number;
}) {
  if (!waters.some((w) => w.distKm == null || w.distKm <= umkreis)) {
    return (
      <div className="panel hero">
        <h2>Kein Gewässer im Umkreis</h2>
        <p className="hint">Such im Tab „Gewässer“ nach Gewässern in deiner Nähe oder vergrößere den Umkreis.</p>
        <button type="button" className="primary" onClick={() => geheZu('gewaesser')}>Gewässer suchen</button>
      </div>
    );
  }
  if (!best) {
    return (
      <div className="panel hero">
        <h3>Beste Chance für {artName(art)}</h3>
        {wetterFehler ? <p className="err">{wetterFehler}</p> : <p className="hint">{wetterLaedt ? 'Wetter wird geladen …' : 'Noch keine Wetterdaten.'}</p>}
      </div>
    );
  }
  const { w, tag } = best;
  const mitte = tag.stunden[Math.min(tag.bestes.start + 1, tag.stunden.length - 1)];
  const P = persoenlich(art, gruppenAus(mitte.b), tage, tag.bestes.avg);
  const G = gewaesserLernen(w.id, w.name, tage);
  const sc = mitGewaesser(P.aktiv ? P.score : tag.bestes.avg, G);
  const [lc, lt] = stufe(sc);
  const R = regelFuer(art, w);
  const warn = sicherheitsWarnung(Math.max(...tag.stunden.map((s) => s.s.w)), Math.min(...tag.stunden.map((s) => s.b.dp)));
  const angepasst = P.aktiv && G.aktiv ? 'angepasst an deine Fänge und dieses Gewässer' : P.aktiv ? 'an deine Fänge angepasst' : G.aktiv ? 'an dieses Gewässer angepasst' : '';
  const delta = sc - tag.bestes.avg;
  return (
    <div className="panel hero">
      {R.geschont && <RegelZeile art={art} w={w} />}
      {raubfischVerbotGilt(art) && <p className="warn">1. Feb. – 30. Apr.: keine Raubfischköder (Sachsen)</p>}
      <div className="row between">
        <h3>Beste Chance für {artName(art)}</h3>
        <span className={`lvl ${lc}`}>{sc >= ALARM_AB ? 'Alarm' : lt}</span>
      </div>
      <Pegellatte score={sc} />
      {angepasst && <p className="pers">Allgemein {fmt1(tag.bestes.avg)} · {angepasst} {delta >= 0 ? '+' : '−'}{fmt1(Math.abs(delta))}</p>}
      <div className="where">{w.name} · {datumLang(tag.bestes.ts)}, {uhrzeit(tag.bestes.ts)}–{uhrzeit(tag.bestes.ts + 3 * STUNDE)} Uhr</div>
      {warn && <div className="warnbox" role="alert">{warn}</div>}
      {w.trinkwasser && <p className="hint">Trinkwassertalsperre: Angeln ist dort meist verboten.</p>}
    </div>
  );
}

function Plakette({ u }: { u: Urteil }) {
  return <span className={'vt' + (u.ok === true ? ' ok' : u.ok === false ? ' no' : '')}>{u.text}</span>;
}

function TagDetail({ w, tag, art, tage, lernOffen, setLernOffen }: {
  w: GW; tag: TagesPrognose; art: string; tage: ReturnType<typeof useAngeltage>;
  lernOffen: boolean; setLernOffen: (b: boolean) => void;
}) {
  const bs = tag.bestes.start;
  const m = tag.stunden[Math.min(bs + 1, tag.stunden.length - 1)];
  const nacht = m.b.licht === 'nacht';
  const u = urteile(m.b, m.bew.f, art);
  const so = sonne(tag.start + 12 * STUNDE, w.lat, w.lon);
  const laenge = (so.unter - so.auf) / STUNDE;
  const mo = mondVon(m.ts);
  const warn = sicherheitsWarnung(Math.max(...tag.stunden.map((s) => s.s.w)), Math.min(...tag.stunden.map((s) => s.b.dp)));
  const P = persoenlich(art, gruppenAus(m.b), tage, tag.bestes.avg);
  const G = gewaesserLernen(w.id, w.name, tage);
  const dp = m.b.dp;
  const windWort = nachStrich(windText(m.b, m.bew.f, art));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="hours" role="img" aria-label="Bisswert je Stunde">
        {tag.stunden.map((s, h) => (
          <div key={s.ts} className={(h >= bs && h < bs + 3 ? 'top ' : '') + (s.b.licht === 'nacht' ? 'night' : '')}
            style={{ height: `${Math.max(2, s.bew.score * 10)}%` }} title={`${s.h} Uhr: ${fmt1(s.bew.score)}`} />
        ))}
      </div>
      <div className="haxis">{tag.stunden.map((s, i) => <span key={s.ts}>{i % 6 === 0 ? s.h : ''}</span>)}</div>
      <p className="hint">Bestes Fenster ab {uhrzeit(tag.bestes.ts)} Uhr · blass = Nacht · Wasser geschätzt ±2 °C</p>
      {warn && <div className="warnbox" role="alert">{warn}</div>}

      <div className="cond">
        <div className="ccard wide">
          <WxIcon c={m.s.c} rp={m.s.rp} nacht={nacht} />
          <div>
            <h4>Wetter im besten Fenster</h4>
            <div className="big">{Math.round(m.s.t)}<small> °C Luft</small></div>
            <div>{wetterWort(m.s.c, m.s.rp)}</div>
          </div>
          <div className="kv">
            <span className="mini-ic"><Icon d={IC.drop} />Regen</span><b>{Math.round(m.s.rp)} %</b>
            <span className="mini-ic"><Icon d={IC.baro} />Druck</span><b>{Math.round(m.s.p)} hPa {dp < -2 ? '↓' : dp > 2 ? '↑' : '→'}</b>
            <span className="mini-ic"><Icon d={IC.therm} />Wasser</span><b>{fmt1(m.b.wasserTemp)} °C</b>
            <span className="mini-ic"><Icon d={IC.sunc} />Wolken</span><b>{Math.round(m.s.c)} %</b>
          </div>
          <div className="vrow"><Plakette u={u.licht} /><Plakette u={u.wasser} /><Plakette u={u.druck} /></div>
        </div>
        <div className="ccard">
          <h4>Sonne · {Math.floor(laenge)} h {Math.round((laenge % 1) * 60)} min</h4>
          <SunArc auf={so.auf} unter={so.unter} bei={m.ts} />
          <div className="kv"><span>Aufgang</span><b>{uhrzeit(so.auf)}</b><span>Untergang</span><b>{uhrzeit(so.unter)}</b></div>
        </div>
        <div className="ccard">
          <h4>Mond</h4>
          <div className="row2">
            <MoonSvg anteil={mo.anteil} />
            <div><div>{mo.name}</div><div className="hint">{Math.round(mo.beleuchtung * 100)} % beleuchtet</div></div>
          </div>
          <p className="hint">Kaum belegter Einfluss, zählt nur 5 %.</p>
        </div>
        <div className="ccard wide">
          <WindSock kmh={m.s.w} />
          <div><h4>Wind</h4><div className="big">{Math.round(m.s.w)}<small> km/h</small></div></div>
          <span className={'vt ' + (m.s.w > 35 ? 'no' : u.wind.ok ? 'ok' : 'no')}>{windWort}</span>
        </div>
      </div>

      <PegelBox w={w} art={art} />

      <details className="learn" open={lernOffen} onToggle={(ev) => setLernOffen((ev.target as HTMLDetailsElement).open)}>
        <summary>Das sagen deine Daten</summary>
        {P.aktiv ? (
          <>
            <p>{P.aussage}</p>
            {P.aehnlich.map((t) => (
              <p key={t.id}>Ähnlicher Tag: {datumKeyKurz(t.datum)} · {t.gewaesserName} · {faengeVon(t, art)} {artName(art)} in {fmt1(t.dauerH)} h</p>
            ))}
          </>
        ) : (
          <p className="hint">{`Ab ${MIN_TAGE_ART} Angeltagen auf ${artName(art)} lernt der Bisswert von dir und erkennt Tage, an denen du besonders gut fängst (${P.n} von ${MIN_TAGE_ART}).`}</p>
        )}
        {(G.aktiv ? <p>{G.aussage}</p> : <p className="hint">{G.n} von {MIN_TAGE_GEWAESSER} Angeltagen an {w.name}. Ab {MIN_TAGE_GEWAESSER} lernt der Bisswert auch dieses Gewässer kennen.</p>)}
        <p className="hint">Typisch für {artName(art)}: {ARTEN[art]?.profil?.tipp}</p>
      </details>
    </div>
  );
}

function WeitereFenster({ kandidaten, onWahl }: { kandidaten: { w: GW; tag: TagesPrognose }[]; onWahl: (id: string, key: string) => void }) {
  const seen = new Set<string>();
  const liste = kandidaten.slice(1).filter(({ w, tag }) => {
    const k = `${w.id}|${tag.key}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 4);
  return (
    <div className="panel">
      <h2>Weitere gute Zeitfenster</h2>
      <div className="more">
        {liste.map(({ w, tag }) => (
          <button key={w.id + tag.key} type="button" className={'al' + (tag.bestes.avg >= ALARM_AB ? ' hot' : '')} onClick={() => onWahl(w.id, tag.key)}>
            <div>{datumLang(tag.bestes.ts)}, {uhrzeit(tag.bestes.ts)} Uhr · {w.name}</div>
            <span className="s">{fmt1(tag.bestes.avg)}</span>
          </button>
        ))}
      </div>
      <p className="hint">Tippen zeigt das Fenster oben im Detail.</p>
    </div>
  );
}
