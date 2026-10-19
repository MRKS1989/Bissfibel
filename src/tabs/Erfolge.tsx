import { Placeholder } from '../components/Placeholder';

export function Erfolge() {
  return (
    <>
      <Placeholder
        title="Rang, PBs und Abzeichen"
        step="Schritt 9"
        items={['Punkte fürs ehrliche Eintragen, nicht für Fischmenge', 'Deine Rekordfische mit Foto']}
      />
      <Placeholder
        title="Mythen-Check"
        step="Schritt 10"
        items={['Prüft an deinen eigenen Fängen, was Luftdruck, Tageszeit und Mond wirklich bringen']}
      />
    </>
  );
}
