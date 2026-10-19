// Eigene Bildsprache aus dem Prototyp: Linien-Symbole, Wetter, Sonne, Mond, Windsack, Köder-Zeichnung.
import { clamp } from '../lib/zeit';
import { NAYS } from '../lib/wasser';

export const IC = {
  hook: 'M14 3v10a4 4 0 1 1-8 0v-2',
  check: 'M5 12l4 4 10-10',
  dawn: 'M4 18h16M7 18a5 5 0 0 1 10 0M12 7v3M5.5 10.5l2 2M18.5 10.5l-2 2',
  moon: 'M19 14.5A7.5 7.5 0 1 1 9.5 5a6 6 0 0 0 9.5 9.5z',
  fish: 'M3 12c3-4 8-5 12-3l5-3v12l-5-3c-4 2-9 1-12-3z',
  target: 'M12 4a8 8 0 1 0 .01 0M12 9a3 3 0 1 0 .01 0',
  pin: 'M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11zM12 8.5v3',
  map: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14',
  wind: 'M3 9h11a3 3 0 1 0-3-3M3 15h15a3 3 0 1 1-3 3',
  lens: 'M11 5a6 6 0 1 0 .01 0M20 20l-4.5-4.5',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 10a3.5 3.5 0 1 0 .01 0',
  therm: 'M10 4a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0zM12 9v7',
  baro: 'M4 16a8 8 0 1 1 16 0M12 16l4-5M8 20h8',
  drop: 'M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z',
  sunc: 'M8 4v2M3 9h2M4.5 5.5l1.4 1.4M12 7.5A4 4 0 0 0 5 10M8 20h9a4 4 0 0 0 .5-8 5 5 0 0 0-9.5 1.5A3.3 3.3 0 0 0 8 20z',
  cloud: 'M7 18h10a4 4 0 0 0 .5-8 5.5 5.5 0 0 0-10.5 1.5A3.3 3.3 0 0 0 7 18z',
  star: 'M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8z',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
};

export function Icon({ d, title }: { d: string; title?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}>
      {title && <title>{title}</title>}
      <path d={d} />
    </svg>
  );
}

export function wetterWort(c: number, rp: number): string {
  return rp >= 60 ? 'Regen' : rp >= 40 ? 'Schauer möglich' : c > 85 ? 'Bedeckt' : c > 55 ? 'Stark bewölkt' : c > 25 ? 'Leicht bewölkt' : 'Sonnig';
}

export function WxIcon({ c, rp, nacht, className = 'wxi' }: { c: number; rp: number; nacht: boolean; className?: string }) {
  const sonne = c < 85, wolke = c >= 25, regen = rp >= 40;
  return (
    <svg viewBox="0 0 72 74" aria-hidden="true" className={className}>
      {sonne && !nacht && (
        <g>
          <circle cx="26" cy="26" r="11" fill="#F5B82E" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
            const r = (a * Math.PI) / 180;
            return <line key={a} x1={26 + 16 * Math.cos(r)} y1={26 + 16 * Math.sin(r)} x2={26 + 21 * Math.cos(r)} y2={26 + 21 * Math.sin(r)} stroke="#F5B82E" strokeWidth="3.5" strokeLinecap="round" />;
          })}
        </g>
      )}
      {sonne && nacht && <path d="M30 10a14 14 0 1 0 12 20A11 11 0 0 1 30 10z" fill="#F1E5BE" />}
      {wolke && <path d="M22 58h34a12 12 0 0 0 1-24 16 16 0 0 0-30 4 10 10 0 0 0-5 20z" fill={c > 80 ? '#AFC2D2' : '#D7E5F0'} stroke="#8FA9BE" strokeWidth="1.5" />}
      {regen && (
        <g stroke="#3D86D6" strokeWidth="3.5" strokeLinecap="round">
          <line x1="30" y1="64" x2="27" y2="71" /><line x1="40" y1="64" x2="37" y2="71" /><line x1="50" y1="64" x2="47" y2="71" />
        </g>
      )}
    </svg>
  );
}

export function SunArc({ auf, unter, bei }: { auf: number; unter: number; bei: number }) {
  const f = clamp((bei - auf) / (unter - auf), 0, 1), a = Math.PI * (1 - f);
  const x = 80 + 62 * Math.cos(a), y = 78 - 62 * Math.sin(a), oben = bei > auf && bei < unter;
  return (
    <svg viewBox="0 0 160 92" aria-hidden="true" style={{ width: '100%', maxWidth: 180, height: 'auto' }}>
      <path d="M18 78A62 62 0 0 1 142 78" fill="none" stroke="#9FC3D9" strokeWidth="2.5" strokeDasharray="4 5" />
      <line x1="8" y1="80" x2="152" y2="80" stroke="#8FA9BE" strokeWidth="2" />
      {oben ? (
        <>
          <circle cx={x} cy={y} r="15" fill="#F5B82E" opacity=".25" />
          <circle cx={x} cy={y} r="10" fill="#F5B82E" />
        </>
      ) : (
        <circle cx={f <= 0 ? 18 : 142} cy="78" r="7" fill="#8FA9BE" />
      )}
    </svg>
  );
}

export function MoonSvg({ anteil, size = 58 }: { anteil: number; size?: number }) {
  const r = size / 2 - 2, cx = size / 2, cy = size / 2, k = Math.cos(2 * Math.PI * anteil), rx = Math.abs(k) * r, zun = anteil < 0.5;
  const so = zun ? 1 : 0, si = zun ? (k < 0 ? 1 : 0) : k < 0 ? 0 : 1;
  const hell = anteil < 0.02 || anteil > 0.98 ? null
    : `M${cx} ${cy - r} A${r} ${r} 0 0 ${so} ${cx} ${cy + r} A${rx.toFixed(2)} ${r} 0 0 ${si} ${cx} ${cy - r}Z`;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} fill="#3A4852" />
      {hell && <path d={hell} fill="#F1E5BE" />}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#8FA9BE" strokeWidth="1" />
    </svg>
  );
}

export function WindSock({ kmh }: { kmh: number }) {
  const n = kmh > 35 ? 5 : Math.round(clamp(kmh / 6, 0, 5)), ang = -(70 - n * 13);
  return (
    <svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true">
      <line x1="10" y1="6" x2="10" y2="60" stroke="#8FA9BE" strokeWidth="3" strokeLinecap="round" />
      <g transform={`rotate(${ang} 10 17)`}>
        {[0, 1, 2, 3, 4].map((i) => {
          const an = i < n;
          return <rect key={i} x={14 + i * 9} y={10 + i * 0.8} width="9" height={14 - i * 1.6} fill={an ? (i % 2 ? '#F4F6F3' : '#E8552B') : 'none'} stroke={an ? '#B9472A' : '#8FA9BE'} strokeWidth="1" strokeDasharray={an ? '0' : '2 2'} />;
        })}
      </g>
    </svg>
  );
}

let shadN = 0;
/** Eigene Zeichnung eines Gummifischs im Dekor (keine Herstellerfotos). */
export function ShadSvg({ code }: { code: string }) {
  const [, b, u, g] = NAYS[code];
  const id = `sh${shadN++}`;
  const body = 'M6 20C6 11 18 7 34 7c20 0 40 5 56 10h10v6H90C74 28 54 33 34 33 18 33 6 29 6 20z';
  return (
    <svg viewBox="0 0 120 40" className="shad" aria-hidden="true">
      <defs><clipPath id={id}><rect x="0" y="21" width="120" height="20" /></clipPath></defs>
      <ellipse cx="106" cy="20" rx="6" ry="13" fill={b} />
      <path d={body} fill={b} />
      <path d={body} fill={u} clipPath={`url(#${id})`} />
      {g && [[30, 13], [44, 12], [58, 14], [70, 16], [38, 17], [52, 18], [64, 19], [80, 18], [26, 16]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.2" fill={g} />)}
      <path d="M48 9v22M60 11v19M72 14v13" stroke="#000" strokeOpacity=".12" strokeWidth="1.5" />
      <circle cx="17" cy="18" r="3.4" fill="#fff" />
      <circle cx="17.6" cy="18" r="1.8" fill="#111" />
    </svg>
  );
}

export function Trophy() {
  return (
    <svg viewBox="0 0 110 110" aria-hidden="true" className="troph">
      <g className="rays"><path className="r" d="M55 4v12M55 84v12M6 50h12M92 50h12M20 15l9 9M81 76l9 9M20 85l9-9M81 24l9-9" strokeWidth="4" strokeLinecap="round" fill="none" /></g>
      <path className="g" d="M33 22h44v18a22 22 0 0 1-44 0z" />
      <path className="gs" d="M33 28H23a10 10 0 0 0 12 16M77 28h10a10 10 0 0 1-12 16" fill="none" strokeWidth="5" />
      <rect className="g" x="51" y="61" width="8" height="12" />
      <rect className="g" x="38" y="73" width="34" height="9" rx="2" />
    </svg>
  );
}
