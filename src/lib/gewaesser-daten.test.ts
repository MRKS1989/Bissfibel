import { describe, expect, it } from 'vitest';
import { baueDaten, sucheInDaten, type Feature } from './gewaesser-daten';

const ZWICKAU = { lat: 50.72, lon: 12.49 };
// Rechteck um einen Mittelpunkt, Seitenlängen in Grad
const rechteck = (lon: number, lat: number, dx: number, dy: number) => [[[lon - dx, lat - dy], [lon + dx, lat - dy], [lon + dx, lat + dy], [lon - dx, lat + dy], [lon - dx, lat - dy]]] as [number, number][][];

const features: Feature[] = [
  { properties: { '@type': 'way', '@id': 1, natural: 'water', water: 'reservoir', name: 'Talsperre Pöhl' }, geometry: { type: 'Polygon', coordinates: rechteck(12.17, 50.55, 0.02, 0.01) } },
  { properties: { '@type': 'relation', '@id': 2, natural: 'water', name: 'Großer Teich' }, geometry: { type: 'MultiPolygon', coordinates: [rechteck(12.48, 50.725, 0.002, 0.001)] } },
  { properties: { '@type': 'way', '@id': 3, natural: 'water', name: 'Pfütze' }, geometry: { type: 'Polygon', coordinates: rechteck(12.5, 50.73, 0.0001, 0.0001) } },
  { properties: { '@type': 'way', '@id': 4, natural: 'water', name: 'Talsperre Eibenstock' }, geometry: { type: 'Polygon', coordinates: rechteck(12.62, 50.52, 0.03, 0.02) } },
  { properties: { '@type': 'way', '@id': 5, waterway: 'river', name: 'Zwickauer Mulde' }, geometry: { type: 'LineString', coordinates: [[12.50, 50.60], [12.50, 50.70], [12.50, 50.80]] } },
  { properties: { '@type': 'way', '@id': 6, waterway: 'river', name: 'Zwickauer Mulde' }, geometry: { type: 'LineString', coordinates: [[12.50, 50.80], [12.55, 50.90]] } },
  { properties: { '@type': 'way', '@id': 7, waterway: 'stream', name: 'Planitzbach' }, geometry: { type: 'LineString', coordinates: [[12.47, 50.70], [12.48, 50.71]] } },
  { properties: { '@type': 'way', '@id': 8, waterway: 'river' }, geometry: { type: 'LineString', coordinates: [[12.4, 50.7], [12.41, 50.7]] } },
];

describe('Gewässerliste bauen', () => {
  const d = baueDaten(features, '2026-10-22');
  it('Stillgewässer mit Fläche, ohne Kleinstgewässer und ohne Namenlose', () => {
    expect(d.still.map((s) => s[0]).sort()).toEqual(['Großer Teich', 'Talsperre Eibenstock', 'Talsperre Pöhl']);
    const poehl = d.still.find((s) => s[0] === 'Talsperre Pöhl')!;
    expect(poehl[1]).toBe('talsperre');
    expect(poehl[4]).toBeGreaterThan(300);
    expect(poehl[2]).toBeCloseTo(50.55, 2);
    expect(d.still.find((s) => s[0] === 'Talsperre Eibenstock')![5]).toBe(1);
  });
  it('Flussabschnitte nach Namen zusammengefasst, Länge in km', () => {
    const m = d.fliess.find((f) => f[0] === 'Zwickauer Mulde')!;
    expect(m[1]).toBe('fluss');
    expect(m[2]).toBeGreaterThan(30);
    expect(m[3].length).toBeGreaterThan(60); // Punkte etwa alle 500 m
  });
});

describe('Suche in der Gewässerliste', () => {
  const d = baueDaten(features, '2026-10-22');
  it('nach Entfernung, Fluss am nächsten Punkt, Bäche nur auf Wunsch', () => {
    const t = sucheInDaten(d, ZWICKAU, 30);
    expect(t.map((x) => x.name)).toEqual(['Zwickauer Mulde', 'Großer Teich', 'Talsperre Eibenstock', 'Talsperre Pöhl']);
    expect(t[0].distKm).toBeLessThan(1);
    expect(t[0].laengeKm).toBeGreaterThan(20);
    expect(sucheInDaten(d, ZWICKAU, 30, true).some((x) => x.typ === 'bach')).toBe(true);
    expect(sucheInDaten(d, ZWICKAU, 5).map((x) => x.name)).toEqual(['Zwickauer Mulde', 'Großer Teich']);
  });
});
