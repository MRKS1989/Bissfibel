import { Placeholder } from './Placeholder';

export function Gewaesser() {
  return (
    <>
      <Placeholder
        title="Gewässer in Sachsen suchen"
        step="Schritt 4"
        items={[
          'Ort eingeben, Umkreis wählen (5–100 km)',
          'Treffer nach Entfernung, Filter nach Typ',
          'Gewässer selbst auf der Karte anlegen',
        ]}
      />
      <Placeholder
        title="Wasser-Check"
        step="Schritt 8"
        items={['Kurze Hilfe zur Köderwahl: Wasser einschätzen, passende Farben und Dekore sehen']}
      />
      <p className="hint">
        Ob du dort angeln darfst, steht im{' '}
        <a href="https://angelatlas-sachsen.de" target="_blank" rel="noopener">
          Angelatlas Sachsen
        </a>
        .
      </p>
    </>
  );
}
