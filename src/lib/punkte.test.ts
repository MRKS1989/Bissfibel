import { describe, expect, it } from 'vitest';
import type { Angeltag, Fang } from '../db';
import { beispielTage } from './demo';
import { gewaesserLernen, mitGewaesser, mythenCheck, persoenlich, farbAuswertung } from './lernen';
import { abzeichen, bisherBest, grundpunkte, pbVerlauf, punkte, rangVon, saisonVon, saisonziele } from './punkte';
import { zeitpunkt, TAG } from './zeit';

let n = 0;
function tag(p: Partial<Angeltag> = {}, faenge: Partial<Fang>[] = []): Angeltag {
  const startTs = p.startTs ?? zeitpunkt('2026-05-01', '06:00') + n++ * TAG;
  return {
    id: 't' + n, datum: '2026-05-01', beginn: '06:00', startTs, dauerH: 3, gewaesserId: 'g1', gewaesserName: 'Mulde',
    zielfisch: 'zander', live: false, bisse: 0, wetter: { licht: 'tag', mond: 'zunehmend' }, ...p,
    faenge: faenge.map((f, i) => ({ id: `f${n}_${i}`, zeit: startTs + i, fischart: 'zander', ...f })),
  };
}

describe('Punkte', () => {
  it('Schneidertag bringt mehr als Fangtag', () => {
    expect(grundpunkte([tag()])).toBe(15);
    expect(grundpunkte([tag({}, [{}])])).toBe(10 + 25);
  });
  it('Extras: live, Wasser-Check, Feedback, Köder, Foto, Alarm, PB', () => {
    const t1 = tag({ live: true, wasserCheck: true, prognoseFeedback: 'ja' }, [{ laengeCm: 50, koeder: 'Gummi', fotoId: 'x', score: 7.2 }]);
    expect(grundpunkte([t1])).toBe(10 + 5 + 3 + 2 + 2 + 2 + 25 + 20);
    const t2 = tag({}, [{ laengeCm: 60 }]);
    expect(grundpunkte([t1, t2]) - grundpunkte([t1])).toBe(10 + 15);
  });
  it('nie Punkte für die Fischmenge', () => {
    const viele = tag({}, Array.from({ length: 10 }, () => ({})));
    expect(grundpunkte([viele])).toBe(10 + 25);
  });
  it('Ränge', () => {
    expect(rangVon(0).name).toBe('Wurmbader');
    expect(rangVon(260)).toMatchObject({ i: 2, name: 'Uferläufer', naechster: [500, 'Petrijünger'] });
    expect(rangVon(9000).naechster).toBeNull();
  });
  it('Abzeichen-Stufen bringen je 10 Punkte', () => {
    const l = Array.from({ length: 5 }, () => tag());
    const ehrlich = abzeichen(l).find((a) => a.id === 'honest')!;
    expect(ehrlich).toMatchObject({ v: 5, stufe: 1, naechstes: 15 });
    expect(punkte(l, [], zeitpunkt('2026-05-30'))).toBeGreaterThanOrEqual(grundpunkte(l) + 20); // Erster Wurf + Ehrlicher Angler
  });
});

describe('PBs', () => {
  it('bisheriger Bestwert und Verlauf', () => {
    const l = [tag({}, [{ laengeCm: 48 }]), tag({}, [{ laengeCm: 45 }]), tag({}, [{ laengeCm: 61 }])];
    expect(bisherBest(l.flatMap((t) => t.faenge), 'zander')).toBe(61);
    expect(pbVerlauf(l, 'zander').map((x) => x.f.laengeCm)).toEqual([48, 61]);
  });
});

describe('Saisonziele', () => {
  it('Herbst = Sep. bis Nov., Winter über den Jahreswechsel', () => {
    expect(saisonVon(zeitpunkt('2026-10-19')).s).toBe('herbst');
    const w = saisonVon(zeitpunkt('2027-01-10'));
    expect(w).toMatchObject({ s: 'winter', jahr: 2026 });
  });
  it('Startwerte ohne Vorjahr, Restzeit', () => {
    const z = saisonziele([], zeitpunkt('2026-10-19'));
    expect(z.ziele.map((x) => x.ziel)).toEqual([8, 2, 5]);
    expect(z.restTage).toBe(43);
  });
  it('orientiert sich am Vorjahr', () => {
    const vj = Array.from({ length: 10 }, (_, i) => tag({ startTs: zeitpunkt('2025-09-10') + i * TAG }));
    expect(saisonziele(vj, zeitpunkt('2026-10-19')).ziele[0].ziel).toBe(11);
  });
});

describe('Lernen', () => {
  it('persönlicher Bisswert erst ab 10 Angeltagen', () => {
    const l = Array.from({ length: 9 }, () => tag({}, [{}]));
    expect(persoenlich('zander', { druck: 'fallend', licht: 'tag', wolken: 'bedeckt' }, l, 6).aktiv).toBe(false);
  });
  it('mit Beispieldaten: Zander bei fallendem Druck besser', () => {
    const p = persoenlich('zander', { druck: 'fallend', licht: 'daemmerung', wolken: 'bedeckt' }, beispielTage(), 6);
    expect(p.aktiv).toBe(true);
    if (p.aktiv) {
      expect(p.score).toBeGreaterThan(6);
      expect(p.aussage).toMatch(/Angeltage\)/);
    }
  });
  it('Gewässer-Lernen ab 10 Tagen, Faktor begrenzt', () => {
    const hier = Array.from({ length: 10 }, () => tag({ gewaesserId: 'g1' }, [{}, {}, {}]));
    const dort = Array.from({ length: 10 }, () => tag({ gewaesserId: 'g2' }));
    const g = gewaesserLernen('g1', 'Mulde', [...hier, ...dort]);
    expect(g.aktiv).toBe(true);
    if (g.aktiv) expect(g.faktor).toBe(1.6);
    expect(mitGewaesser(5, g)).toBeGreaterThan(5);
    expect(gewaesserLernen('g1', 'Mulde', hier.slice(0, 9)).aktiv).toBe(false);
  });
  it('Mythen-Check urteilt erst ab 4 Tagen je Gruppe', () => {
    const m = mythenCheck(beispielTage());
    expect(m.map((x) => x.titel)).toEqual(['Luftdruck', 'Tageszeit', 'Bewölkung', 'Wassertrübung', 'Mond']);
    expect(m[0].urteil).not.toBe('Noch zu wenige Angeltage je Gruppe.');
    expect(mythenCheck([tag()])[0].urteil).toBe('Noch zu wenige Angeltage je Gruppe.');
  });
  it('Köderfarbe je Trübung ab 3 Fängen', () => {
    const l = [tag({ wetter: { licht: 'tag', mond: 'Neumond', truebung: 'trueb' } }, [{ koederFarbe: 'chartreuse' }, { koederFarbe: 'chartreuse' }, { koederFarbe: 'orange' }])];
    expect(farbAuswertung('trueb', l)).toEqual({ farbe: 'chartreuse', n: 2, gesamt: 3 });
    expect(farbAuswertung('klar', l)).toBeNull();
  });
});
