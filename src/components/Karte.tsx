// Karte zum Setzen eines Punkts (Leaflet mit OpenStreetMap-Kacheln, Namensnennung sichtbar).
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';

const SACHSEN = { lat: 50.93, lon: 13.46 };

export function PunktKarte({ mitte, punkt, onPunkt }: {
  mitte?: { lat: number; lon: number }; punkt?: { lat: number; lon: number } | null; onPunkt: (p: { lat: number; lon: number }) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.CircleMarker | null>(null);
  const cb = useRef(onPunkt);
  cb.current = onPunkt;

  useEffect(() => {
    if (!el.current || map.current) return;
    const start = punkt ?? mitte ?? SACHSEN;
    const m = L.map(el.current, { zoomControl: true, attributionControl: true }).setView([start.lat, start.lon], punkt ? 14 : mitte ? 11 : 8);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap-Mitwirkende</a>',
    }).addTo(m);
    m.on('click', (e: L.LeafletMouseEvent) => cb.current({ lat: e.latlng.lat, lon: e.latlng.lng }));
    map.current = m;
    return () => { m.remove(); map.current = null; marker.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (!punkt) { marker.current?.remove(); marker.current = null; return; }
    if (!marker.current) marker.current = L.circleMarker([punkt.lat, punkt.lon], { radius: 9, color: '#C8431E', weight: 3, fillColor: '#E8552B', fillOpacity: 0.8 }).addTo(m);
    else marker.current.setLatLng([punkt.lat, punkt.lon]);
  }, [punkt?.lat, punkt?.lon]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={el} className="map" role="application" aria-label="Karte: Tippe auf die Stelle des Gewässers" />;
}
