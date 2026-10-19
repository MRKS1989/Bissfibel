import { Placeholder } from '../components/Placeholder';

export function Angeln(_p: { geheZu: (t: import('../components/TabBar').TabId) => void }) {
  return (
    <>
      <Placeholder
        title="Ich angle jetzt"
        step="Schritt 6"
        items={['Laufende Uhr, Bisse und Fänge per Fingertipp', 'Foto direkt zum Fang, ohne Ortsdaten']}
      />
      <Placeholder
        title="Fangbuch und Köderbox"
        step="Schritt 7"
        items={['Angeltag nachtragen, auch Schneidertage', 'Deine Köder mit Foto und Farbe']}
      />
    </>
  );
}
