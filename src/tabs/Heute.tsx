import { Placeholder } from './Placeholder';

export function Heute() {
  const score = 7.4; // nur Vorschau der Pegellatte, kein echter Wert
  return (
    <>
      <div className="panel">
        <h3>So sieht der Bisswert aus</h3>
        <div className="gauge" role="img" aria-label={`Beispiel: Bisswert ${score.toLocaleString('de-DE')} von 10`}>
          <div className="score">
            {score.toLocaleString('de-DE', { minimumFractionDigits: 1 })}
            <small>/10</small>
          </div>
          <div className="staff">
            <i style={{ width: `${score * 10}%` }} />
            <b style={{ left: `${score * 10}%` }} />
          </div>
        </div>
        <p className="hint">Nur eine Vorschau. Echte Werte kommen mit dem Wetter.</p>
      </div>
      <Placeholder
        title="Beste Chance"
        step="Schritte 3 und 5"
        items={[
          'Deine Top 5 Fische als Auswahl oben',
          'Bestes Zeitfenster der nächsten 7 Tage an deinen Gewässern',
          'Gewässer im Detail: Wetter, Sonne, Mond, Wind',
          'Warnung bei Sturm oder stark fallendem Luftdruck',
        ]}
      />
    </>
  );
}
