import { describe, expect, it } from 'vitest';
import { ARTEN, artPasst, hatProfil, profilArten } from './arten';
import { lichtKlasse, mond, sonne } from './astro';
import { prognose, schnappschuss, type Stunde, type WetterReihe } from './prognose';
import { fangHinweis, imZeitraum, regelFuer } from './regeln-sachsen';
import { bestesFenster, bewerte, druckFaktor, sicherheitsWarnung, trapez, urteile, windFaktor } from './score';
import { wasserTempReihe } from './wassertemp';
import { teile, zeitpunkt, STUNDE } from './zeit';

const ZWICKAU = { lat: 50.72, lon: 12.49 };

describe('Fischarten', () => {
  it('hat 31 Arten mit Profil', () => expect(profilArten()).toHaveLength(31));
  it('führt Listennamen auf die Profile zurück', () => {
    expect(ARTEN.brasse.alias).toBe('Brachse');
    expect(ARTEN.barsch.alias).toBe('Flussbarsch');
    expect(ARTEN.maraene.alias).toBe('Renke');
    expect(hatProfil('forelle')).toBe(true);
    expect(hatProfil('groppe-koppe')).toBe(false);
  });
  it('bietet keine Krebse und keine Neunaugen an', () => {
    const namen = Object.values(ARTEN).map((a) => a.name);
    expect(namen.some((n) => /krebs|krabbe|hummer|neunauge/i.test(n))).toBe(false);
    expect(namen).toContain('Sonstiges');
  });
  it('sucht auch Alternativnamen', () => {
    expect(artPasst('brasse', 'brach')).toBe(true);
    expect(artPasst('maraene', 'renke')).toBe(true);
    expect(artPasst('hecht', 'zan')).toBe(false);
  });
});

describe('Bewertungsfaktoren', () => {
  it('Trapez für die Wassertemperatur', () => {
    const t = [3, 8, 17, 24];
    expect(trapez(13, t)).toBe(1);
    expect(trapez(5.5, t)).toBe(0.5);
    expect(trapez(20.5, t)).toBe(0.5);
    expect(trapez(24, t)).toBe(0);
    expect(trapez(1, t)).toBe(0);
  });
  it('Luftdruck nach Tabelle', () => {
    expect([-10, -5, 0, 3, 8].map((d) => druckFaktor(d, 'front'))).toEqual([0.7, 0.95, 0.65, 0.5, 0.35]);
    expect([-10, -5, 0, 3, 8].map((d) => druckFaktor(d, 'stabil'))).toEqual([0.4, 0.6, 0.9, 0.65, 0.45]);
  });
  it('Wind: über 35 km/h immer 0,1, sonst linear bis 0,25', () => {
    const p = ARTEN.hecht.profil!;
    expect(windFaktor(40, p)).toBe(0.1);
    expect(windFaktor(15, p)).toBe(1);
    expect(windFaktor(1, p)).toBeCloseTo(0.5);
    expect(windFaktor(0, { ...p, wind: [30, 34] })).toBe(0.25);
  });
});

describe('Bisswert', () => {
  const ideal = { wasserTemp: 12, licht: 'daemmerung', bewoelkung: 50, wind: 15, dp: -5, mond: 'zunehmend' } as const;
  it('rechnet die gewichtete Summe', () => {
    const { score, f } = bewerte(ideal, 'hecht');
    expect(f).toEqual({ wasser: 1, licht: 1, bewoelkung: 1, wind: 1, druck: 0.95, mond: 0.5 });
    expect(score).toBeCloseTo(9.695, 3);
  });
  it('nachts zählt die Bewölkung fest 0,85', () => {
    expect(bewerte({ ...ideal, licht: 'nacht', bewoelkung: 0 }, 'zander').f.bewoelkung).toBe(0.85);
  });
  it('Neumond und Vollmond 0,6', () => {
    expect(bewerte({ ...ideal, mond: 'Vollmond' }, 'hecht').f.mond).toBe(0.6);
  });
  it('Urteile je Art', () => {
    const b = { ...ideal, licht: 'tag' as const, bewoelkung: 10 };
    const u = urteile(b, bewerte(b, 'zander').f, 'zander');
    expect(u.licht.text).toBe('Licht: zu sonnig für Zander');
    expect(u.licht.ok).toBe(false);
    expect(u.druck.text).toBe('Druck: vor Fronten oft aktiv');
  });
  it('bestes 3-Stunden-Fenster', () => {
    const s = Array.from({ length: 26 }, (_, h) => (h >= 18 && h <= 20 ? 8 : 4));
    expect(bestesFenster(s)).toEqual({ start: 18, avg: 8 });
    expect(bestesFenster(s, 20).start).toBe(20);
  });
  it('warnt bei Sturm und stark fallendem Druck', () => {
    expect(sicherheitsWarnung(40, 0)).toMatch(/Sturm/);
    expect(sicherheitsWarnung(10, -9)).toMatch(/Unwetter/);
    expect(sicherheitsWarnung(10, -3)).toBeNull();
  });
});

describe('Mond und Sonne', () => {
  it('Referenz-Neumond 6.1.2000', () => expect(mond(Date.UTC(2000, 0, 6, 18, 14)).gruppe).toBe('Neumond'));
  it('Vollmond 25.1.2024', () => {
    const m = mond(Date.UTC(2024, 0, 25, 18));
    expect(m.gruppe).toBe('Vollmond');
    expect(m.beleuchtung).toBeGreaterThan(0.98);
  });
  it('Sonnenaufgang in Zwickau am 21.6. gegen 5 Uhr, Untergang gegen 21:25 Uhr', () => {
    const s = sonne(zeitpunkt('2026-06-21'), ZWICKAU.lat, ZWICKAU.lon);
    const auf = teile(s.auf), unter = teile(s.unter);
    expect(auf.h * 60 + auf.mi).toBeGreaterThan(4 * 60 + 45);
    expect(auf.h * 60 + auf.mi).toBeLessThan(5 * 60 + 10);
    expect(unter.h * 60 + unter.mi).toBeGreaterThan(21 * 60 + 15);
    expect(unter.h * 60 + unter.mi).toBeLessThan(21 * 60 + 40);
  });
  it('Lichtklasse', () => {
    expect(lichtKlasse(zeitpunkt('2026-06-21', '13:00'), ZWICKAU.lat, ZWICKAU.lon)).toBe('tag');
    expect(lichtKlasse(zeitpunkt('2026-06-21', '01:00'), ZWICKAU.lat, ZWICKAU.lon)).toBe('nacht');
    expect(lichtKlasse(zeitpunkt('2026-06-21', '04:00'), ZWICKAU.lat, ZWICKAU.lon)).toBe('daemmerung');
  });
});

describe('Regeln Sachsen', () => {
  const see = { name: 'Kiessee', typ: 'see' };
  it('Zander: Schonzeit 1. Feb. – 31. Mai, 50 cm', () => {
    const r = regelFuer('zander', see, new Date(2026, 2, 15));
    expect(r).toMatchObject({ geschont: true, mindestmass: 50, bis: '31. Mai', schonzeit: '1. Feb. – 31. Mai' });
    expect(regelFuer('zander', see, new Date(2026, 6, 1)).geschont).toBe(false);
  });
  it('Zeitraum über den Jahreswechsel', () => {
    expect(imZeitraum(new Date(2026, 11, 1), [[10, 1], [4, 30]])).toBe(true);
    expect(imZeitraum(new Date(2026, 5, 1), [[10, 1], [4, 30]])).toBe(false);
  });
  it('Nase: in der Elbe Ausnahme, sonst ganzjährig geschont', () => {
    expect(regelFuer('nase', { name: 'Zwickauer Mulde', typ: 'fluss' }).ganzjaehrig).toBe(true);
    expect(regelFuer('nase', { name: 'Elbe', typ: 'fluss' }, new Date(2026, 6, 1))).toMatchObject({ geschont: false, mindestmass: 40 });
  });
  it('Quappe: Ausnahme nur für die Vereinigte Mulde', () => {
    expect(regelFuer('quappe', { name: 'Zwickauer Mulde', typ: 'fluss' }).ganzjaehrig).toBe(true);
    expect(regelFuer('quappe', { name: 'Vereinigte Mulde', typ: 'fluss' }, new Date(2026, 6, 1)).mindestmass).toBe(30);
    expect(regelFuer('quappe', { name: 'Weiße Elster', typ: 'fluss' }, new Date(2026, 6, 1)).ganzjaehrig).toBe(false);
  });
  it('Regenbogenforelle und Rotfeder nur in Fließgewässern', () => {
    expect(regelFuer('regenbogen', see, new Date(2026, 11, 1)).geschont).toBe(false);
    expect(regelFuer('regenbogen', { name: 'Bach', typ: 'bach' }, new Date(2026, 11, 1)).geschont).toBe(true);
    expect(regelFuer('rotfeder', see).mindestmass).toBeNull();
    expect(regelFuer('rotfeder', { name: 'Pleiße', typ: 'fluss' }).mindestmass).toBe(20);
  });
  it('Barsch: keine Regel', () => expect(regelFuer('barsch', see).geregelt).toBe(false));
  it('Hinweis beim Fang nur wenn nötig', () => {
    const juli = new Date(2026, 6, 1);
    expect(fangHinweis('hecht', 45, see, juli)).toMatch(/Untermaßig/);
    expect(fangHinweis('hecht', 60, see, juli)).toBe('');
    expect(fangHinweis('hecht', 60, see, new Date(2026, 2, 1))).toMatch(/Schonzeit bis 30\. Apr\./);
  });
});

describe('Wassertemperatur', () => {
  it('startet bei erstem Tagesmittel + 1,5 °C und nähert sich der Luft', () => {
    const r = wasserTempReihe(Array(30).fill(10), 'fluss');
    expect(r[0]).toBe(11.5);
    expect(r[29]).toBeCloseTo(10, 1);
  });
  it('Talsperre reagiert träger als ein Bach', () => {
    const luft = [20, 20, 20, 10, 10, 10];
    const tal = wasserTempReihe(luft, 'talsperre'), bach = wasserTempReihe(luft, 'bach');
    expect(tal[5] - 0.8).toBeGreaterThan(bach[5] + 0.5);
  });
});

describe('Prognose', () => {
  // 21 Tage künstliches Wetter ab Mitternacht, gleichmäßig 14 °C, bewölkt, leichter Wind.
  function reihe(start: number, tage = 21, f: (i: number) => Partial<Stunde> = () => ({})): WetterReihe {
    const stunden: Stunde[] = Array.from({ length: tage * 24 }, (_, i) => ({ ts: start + i * STUNDE, t: 14, p: 1015, c: 60, w: 12, rp: 10, ...f(i) }));
    return { ...ZWICKAU, abgerufen: start, stunden };
  }
  const start = zeitpunkt('2026-10-05', '00:00');
  const ab = zeitpunkt('2026-10-19', '06:00');

  it('liefert 7 Tage ab heute mit bestem Fenster', () => {
    const p = prognose(reihe(start), 'see', 'zander', ab);
    expect(p).toHaveLength(7);
    expect(p[0].key).toBe('2026-10-19');
    expect(p[0].stunden).toHaveLength(24);
    expect(p[0].bestes.ts).toBeGreaterThanOrEqual(ab - 3 * STUNDE);
  });
  it('Zander: bestes Fenster in Dämmerung oder Nacht', () => {
    const p = prognose(reihe(start), 'see', 'zander', ab);
    const h = teile(p[1].bestes.ts).h;
    expect(h < 9 || h >= 16).toBe(true);
  });
  it('Schnappschuss mit Druckänderung über 12 h', () => {
    const r = reihe(start, 21, (i) => ({ p: 1020 - i * 0.5 }));
    const s = schnappschuss(r, 'see', 'hecht', zeitpunkt('2026-10-10', '08:30'))!;
    expect(s.luftdruckTrend).toBe('fallend');
    expect(s.dp).toBe(-6);
    expect(s.bewoelkung).toBe('wechselnd');
    expect(schnappschuss(r, 'see', 'hecht', start + 2 * STUNDE)).toBeNull();
  });
});

import { aktiveVereinsregeln, jetztGilt, tageBis, VEREINSREGEL_VORSCHLAG } from './regeln-sachsen';

describe('Was heute gilt', () => {
  it('22. Oktober: Forellen geschont, Raubfischköder erlaubt', () => {
    const j = jetztGilt(new Date(2026, 9, 22));
    expect(j.geschont.map((g) => g.art)).toEqual(expect.arrayContaining(['Bachforelle', 'Maräne', 'Regenbogenforelle (in Fließgewässern)']));
    expect(j.geschont.some((g) => g.art === 'Zander')).toBe(false);
    expect(j.raubfisch.aktiv).toBe(false);
  });
  it('Januar: Zander-Schonzeit und Raubfischköder-Verbot kündigen sich an', () => {
    const j = jetztGilt(new Date(2027, 0, 10));
    expect(j.beginntBald.map((b) => b.art)).toEqual(expect.arrayContaining(['Hecht', 'Zander']));
    expect(j.raubfisch.text).toMatch(/in 22 Tagen/);
  });
  it('März: Verbot aktiv', () => expect(jetztGilt(new Date(2027, 2, 1)).raubfisch.aktiv).toBe(true));
  it('Tage bis zu einem Datum, auch über den Jahreswechsel', () => {
    expect(tageBis([10, 1], new Date(2026, 9, 1))).toBe(0);
    expect(tageBis([2, 1], new Date(2026, 11, 31))).toBe(32);
  });
  it('Vereinsregel grüne Strecken gilt ab 1. Oktober', () => {
    expect(aktiveVereinsregeln(VEREINSREGEL_VORSCHLAG, new Date(2026, 9, 1))).toHaveLength(1);
    expect(aktiveVereinsregeln(VEREINSREGEL_VORSCHLAG, new Date(2026, 8, 30))).toHaveLength(0);
  });
});
