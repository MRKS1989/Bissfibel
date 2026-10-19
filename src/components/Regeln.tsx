// Kompakte Regelzeile: nur Mindestmaß und Schonzeit, rot wenn die Art gerade geschont ist.
import { regelFuer, type GewaesserInfo } from '../lib/regeln-sachsen';

export function RegelZeile({ art, w }: { art: string; w: GewaesserInfo }) {
  const R = regelFuer(art, w);
  return (
    <div className={'rule mini' + (R.geschont ? ' closed' : '')}>
      <span>Mindestmaß <b>{R.mindestmass ? `${R.mindestmass} cm` : 'keins'}</b></span>
      <span>Schonzeit <b>{R.ganzjaehrig ? 'ganzjährig' : R.schonzeit ?? 'keine'}</b></span>
      {R.geschont && <span className="now">{R.ganzjaehrig ? 'geschont – zurücksetzen' : 'jetzt geschont – zurücksetzen'}</span>}
    </div>
  );
}
