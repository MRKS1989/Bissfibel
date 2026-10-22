import { describe, expect, it } from 'vitest';
import { entfernungKm, sachsenTreffer } from './geo';
import { flaechenTyp, istTrinkwasser, overpassQuery, parseOverpass, type El } from './gewaesser-suche';
import { parseOpenMeteo, wetterKey } from './wetter';

const ZWICKAU = { lat: 50.72, lon: 12.49 };

describe('Open-Meteo', () => {
  it('wandelt Stundenwerte um und füllt Lücken', () => {
    const r = parseOpenMeteo({
      latitude: 50.7, longitude: 12.5,
      hourly: { time: [1000, 4600, 8200], temperature_2m: [10, 11, null], pressure_msl: [1010, null, 1012],
        cloud_cover: [50, 60, 70], wind_speed_10m: [5, 6, 7], precipitation_probability: [null, 20, 30] },
    }, 50.7, 12.5, 0);
    expect(r.stunden).toHaveLength(3);
    expect(r.stunden[1]).toEqual({ ts: 4600000, t: 11, p: 1010, c: 60, w: 6, rp: 20 });
    expect(r.stunden[2].t).toBe(11);
    expect(r.stunden[0].rp).toBe(0);
  });
  it('nahe Orte teilen sich die Wetterdaten', () => {
    expect(wetterKey(50.72, 12.49)).toBe(wetterKey(50.71, 12.51));
  });
});

describe('Ortssuche', () => {
  it('lässt nur Orte in Sachsen zu', () => {
    const orte = sachsenTreffer({ results: [
      { name: 'Zwickau', latitude: 50.72, longitude: 12.49, admin1: 'Sachsen', admin2: 'Zwickau', country_code: 'DE' },
      { name: 'Gera', latitude: 50.88, longitude: 12.08, admin1: 'Thüringen', country_code: 'DE' },
    ] });
    expect(orte.map((o) => o.name)).toEqual(['Zwickau']);
  });
  it('Entfernung Zwickau – Chemnitz etwa 37 km', () => {
    expect(entfernungKm(ZWICKAU, { lat: 50.83, lon: 12.92 })).toBeGreaterThan(30);
    expect(entfernungKm(ZWICKAU, { lat: 50.83, lon: 12.92 })).toBeLessThan(40);
  });
});

describe('Gewässersuche', () => {
  it('fragt nur Sachsen im Umkreis ab', () => {
    const q = overpassQuery(50.72, 12.49, 50);
    expect(q).toContain('"ISO3166-2"="DE-SN"');
    expect(q).toContain('around:50000,50.7200,12.4900');
    expect(q).toContain('out tags bb');
    expect(q).not.toContain('geom');
    expect(q).not.toContain('stream');
    expect(overpassQuery(50.72, 12.49, 50, true)).toContain('stream');
  });
  it('findet Seen und Talsperren auch ohne Mittelpunkt (nur Umrissrechteck)', () => {
    const t = parseOverpass([
      { type: 'way', id: 7, tags: { natural: 'water', water: 'reservoir', name: 'Talsperre Pöhl' }, bounds: { minlat: 50.53, minlon: 12.14, maxlat: 50.57, maxlon: 12.20 } },
      { type: 'relation', id: 8, tags: { natural: 'water', water: 'lake', name: 'Kiessee Mosel' }, bounds: { minlat: 50.76, minlon: 12.46, maxlat: 50.77, maxlon: 12.48 } },
      { type: 'way', id: 9, tags: { waterway: 'river', name: 'Pleiße' }, bounds: { minlat: 50.70, minlon: 12.40, maxlat: 50.80, maxlon: 12.45 } },
    ], ZWICKAU, 50);
    expect(t.map((x) => `${x.name}:${x.typ}`).sort()).toEqual(['Kiessee Mosel:see', 'Pleiße:fluss', 'Talsperre Pöhl:talsperre']);
    expect(t.find((x) => x.name === 'Pleiße')!.laengeKm).toBeGreaterThan(5);
  });
  it('erkennt Gewässertypen und lässt Rückhaltebecken weg', () => {
    expect(flaechenTyp({ name: 'Großer Teich', natural: 'water' })).toBe('teich');
    expect(flaechenTyp({ name: 'Talsperre Pöhl', natural: 'water', water: 'reservoir' })).toBe('talsperre');
    expect(flaechenTyp({ name: 'Hochwasserrückhaltebecken X', natural: 'water' })).toBeNull();
    expect(flaechenTyp({ name: 'Kiessee', natural: 'water', water: 'lake' })).toBe('see');
    expect(flaechenTyp({ name: 'Mulde', natural: 'water', water: 'river' })).toBeNull();
  });
  it('markiert Trinkwassertalsperren', () => {
    expect(istTrinkwasser('Talsperre Eibenstock')).toBe(true);
    expect(istTrinkwasser('Talsperre Pöhl')).toBe(false);
  });
  it('fasst Flussabschnitte zusammen, nächster Punkt zählt', () => {
    const els: El[] = [
      { type: 'way', id: 1, tags: { waterway: 'river', name: 'Zwickauer Mulde' }, geometry: [{ lat: 50.70, lon: 12.50 }, { lat: 50.72, lon: 12.50 }] },
      { type: 'way', id: 2, tags: { waterway: 'river', name: 'Zwickauer Mulde' }, geometry: [{ lat: 50.72, lon: 12.50 }, { lat: 50.80, lon: 12.55 }] },
      { type: 'way', id: 3, tags: { natural: 'water', name: 'Schwanenteich' }, center: { lat: 50.725, lon: 12.48 },
        bounds: { minlat: 50.724, minlon: 12.478, maxlat: 50.726, maxlon: 12.482 } },
      { type: 'way', id: 4, tags: { natural: 'water', name: 'Pfütze' }, center: { lat: 50.73, lon: 12.48 },
        bounds: { minlat: 50.73, minlon: 12.48, maxlat: 50.7302, maxlon: 12.4802 } },
    ];
    const t = parseOverpass(els, ZWICKAU, 50);
    expect(t).toHaveLength(2);
    const mulde = t.find((x) => x.name === 'Zwickauer Mulde')!;
    expect(mulde.typ).toBe('fluss');
    expect(mulde.distKm).toBeLessThan(1);
    expect(mulde.laengeKm).toBeGreaterThan(8);
    expect(t.find((x) => x.name === 'Schwanenteich')!.typ).toBe('teich');
  });
});
