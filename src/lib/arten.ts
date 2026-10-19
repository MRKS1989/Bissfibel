// Fischarten: Profile für den Bisswert (31 Arten) und die vollständige Auswahlliste.
// Werte aus docs/SPEZIFIKATION.md, Abschnitt 3 und 10.

export type Gruppe = 'raub' | 'salmo' | 'fried';
export type Druckvorliebe = 'front' | 'stabil';
export type Abschnitt = 's' | 'm' | 'x'; // Süßwasser, Meer, Sonstiges

export type Artprofil = {
  gruppe: Gruppe;
  wasser: [number, number, number, number]; // min, Optimum von, Optimum bis, max (°C)
  licht: [number, number, number]; // Dämmerung, Tag, Nacht
  bewoelkung: [number, number]; // idealer Bereich in %
  wind: [number, number]; // idealer Bereich in km/h
  druck: Druckvorliebe;
  tipp: string;
};

export type Art = { key: string; name: string; abschnitt: Abschnitt; alias?: string; profil?: Artprofil };

export const GRUPPEN: [Gruppe, string][] = [
  ['raub', 'Raubfische'],
  ['salmo', 'Forellen und Salmoniden'],
  ['fried', 'Friedfische'],
];

type Roh = [string, Gruppe, number[], number[], number[], number[], Druckvorliebe, string];

// Schlüssel → [Anzeigename, Gruppe, Wasser, Licht, Bewölkung, Wind, Druck, Kurzprofil]
const PROFILE: Record<string, Roh> = {
  hecht: ['Hecht', 'raub', [3, 8, 17, 24], [1, 0.75, 0.1], [30, 80], [8, 22], 'front', 'Leicht bewölkt mit Sonnenlücken und Wind, der die Oberfläche kräuselt. Vor Gewittern oft aktiv, bei Sonne und Spiegelglätte zäh.'],
  zander: ['Zander', 'raub', [6, 12, 22, 28], [1, 0.35, 0.85], [60, 100], [10, 28], 'front', 'Dämmerung, Nacht und trübes Licht. Wind mit Wellen und eingetrübtes Wasser helfen: Zander sehen bei wenig Licht besser als ihre Beute.'],
  barsch: ['Barsch', 'raub', [5, 12, 22, 27], [0.85, 0.9, 0.05], [0, 70], [3, 18], 'front', 'Tagaktiver Augenjäger. Sonne stört kaum, leichter Wind reicht. Nachts fast keine Aktivität.'],
  wels: ['Wels', 'raub', [12, 20, 28, 32], [0.7, 0.25, 1], [50, 100], [5, 25], 'front', 'Nachts und bei warmem Wasser. Schwüles Wetter vor Gewittern gilt als beste Zeit.'],
  aal: ['Aal', 'raub', [10, 16, 25, 30], [0.6, 0.1, 1], [60, 100], [0, 15], 'front', 'Dunkle, warme Nächte, gern nach Regen bei steigendem und leicht trübem Wasser.'],
  rapfen: ['Rapfen', 'raub', [6, 12, 22, 27], [1, 0.8, 0.05], [0, 60], [0, 15], 'front', 'Jagt an der Oberfläche, vor allem morgens und abends. Ruhiges, klares Wetter macht die Jagd sichtbar.'],
  quappe: ['Quappe', 'raub', [0, 2, 10, 16], [0.6, 0.1, 1], [50, 100], [0, 20], 'front', 'Kältefreund: am aktivsten in langen Winternächten bei sehr kaltem Wasser.'],
  kaulbarsch: ['Kaulbarsch', 'raub', [4, 10, 20, 25], [0.9, 0.7, 0.4], [40, 100], [3, 18], 'stabil', 'Bodennah im Schwarm, gern bei trübem Licht.'],
  schwarzbarsch: ['Schwarzbarsch', 'raub', [12, 18, 26, 30], [1, 0.6, 0.2], [30, 90], [3, 15], 'front', 'Warmes Wasser, Dämmerung, gern bewölkt. Steht an Kraut und Holz.'],
  forelle: ['Bachforelle', 'salmo', [3, 8, 15, 19], [1, 0.6, 0.35], [50, 100], [3, 18], 'front', 'Bedeckter Himmel und leichter Nieselregen bringen Insekten und machen sie mutiger. Grelle Sonne macht sie scheu.'],
  regenbogen: ['Regenbogenforelle', 'salmo', [4, 10, 17, 21], [0.9, 0.75, 0.2], [40, 100], [5, 20], 'front', 'Weniger scheu als die Bachforelle und auch tagsüber gut zu fangen.'],
  seeforelle: ['Seeforelle', 'salmo', [3, 6, 13, 17], [1, 0.55, 0.2], [50, 100], [10, 28], 'front', 'Kaltes Wasser, Wind auf der Oberfläche, trübes Licht.'],
  saibling: ['Bachsaibling', 'salmo', [2, 7, 14, 18], [0.9, 0.6, 0.2], [40, 100], [3, 18], 'front', 'Kaltes, sauerstoffreiches Wasser, bewölkte Tage.'],
  aesche: ['Äsche', 'salmo', [3, 8, 15, 19], [0.8, 0.9, 0.05], [20, 80], [0, 12], 'stabil', 'Tagaktiv, steigt beim Insektenschlupf. Ruhiges Wetter mit wenig Wind ist ideal.'],
  huchen: ['Huchen', 'salmo', [1, 5, 12, 16], [1, 0.5, 0.3], [50, 100], [0, 20], 'front', 'Winterfisch: kaltes Wasser, trübes Licht, oft bei Wetterumschwung.'],
  maraene: ['Maräne', 'salmo', [2, 6, 12, 16], [0.9, 0.6, 0.4], [30, 90], [3, 18], 'stabil', 'Kaltes, tiefes Freiwasser, am besten in der Dämmerung.'],
  karpfen: ['Karpfen', 'fried', [10, 18, 26, 30], [0.9, 0.55, 0.85], [20, 80], [8, 25], 'stabil', 'Warmes, stabiles Wetter. Warmer Wind aufs Ufer treibt Nahrung dorthin, die Karpfen folgen.'],
  schleie: ['Schleie', 'fried', [10, 18, 25, 29], [1, 0.4, 0.6], [50, 100], [0, 8], 'stabil', 'Warme, windstille Morgen am Krautrand. Bläschenteppiche verraten sie.'],
  brasse: ['Brasse', 'fried', [8, 15, 24, 28], [0.9, 0.55, 0.8], [40, 100], [5, 20], 'stabil', 'Schwarmfisch, gern bei bedecktem Himmel und leichtem Wind, abends und nachts.'],
  guester: ['Güster', 'fried', [8, 15, 24, 28], [0.9, 0.6, 0.6], [30, 90], [3, 15], 'stabil', 'Ähnlich wie die Brasse, etwas tagaktiver.'],
  rotauge: ['Rotauge', 'fried', [5, 12, 22, 27], [0.9, 0.8, 0.3], [20, 90], [3, 15], 'stabil', 'Fast immer zu fangen. Stabiles Wetter und leichter Wind sind ideal.'],
  rotfeder: ['Rotfeder', 'fried', [10, 17, 25, 29], [0.8, 0.9, 0.2], [0, 60], [0, 8], 'stabil', 'Sonnige, warme, ruhige Tage dicht unter der Oberfläche.'],
  aland: ['Aland', 'fried', [4, 10, 20, 25], [0.9, 0.8, 0.3], [20, 80], [3, 15], 'stabil', 'Fließgewässer, oft nah an der Oberfläche. Mildes, stabiles Wetter.'],
  doebel: ['Döbel', 'fried', [5, 12, 22, 27], [0.9, 0.85, 0.4], [10, 80], [0, 15], 'stabil', 'Vorsichtiger Allesfresser an Strömungskanten. Beißt fast das ganze Jahr.'],
  barbe: ['Barbe', 'fried', [8, 14, 22, 26], [1, 0.5, 0.85], [40, 100], [0, 15], 'stabil', 'Bodenfisch in der Strömung. Dämmerung, Nacht und leicht trübes Wasser.'],
  nase: ['Nase', 'fried', [6, 12, 20, 24], [0.7, 0.9, 0.1], [0, 70], [0, 15], 'stabil', 'Tagaktiv, weidet Algen von Steinen. Klares, ruhiges Wetter.'],
  karausche: ['Karausche', 'fried', [10, 18, 26, 30], [0.9, 0.6, 0.5], [20, 80], [0, 8], 'stabil', 'Warme, stille Kleingewässer, ruhiges Wetter.'],
  giebel: ['Giebel', 'fried', [10, 17, 26, 30], [0.9, 0.7, 0.4], [20, 80], [0, 12], 'stabil', 'Robust und wärmeliebend, ruhiges Wetter.'],
  graskarpfen: ['Graskarpfen', 'fried', [14, 20, 28, 32], [0.8, 0.8, 0.5], [0, 60], [0, 12], 'stabil', 'Sehr warmes Wasser und sonnige Tage. Frisst Pflanzen nahe der Oberfläche.'],
  hasel: ['Hasel', 'fried', [5, 11, 20, 25], [0.8, 0.9, 0.1], [10, 80], [0, 12], 'stabil', 'Kleiner, tagaktiver Strömungsfisch.'],
  ukelei: ['Ukelei', 'fried', [10, 16, 24, 28], [0.8, 0.95, 0.05], [0, 60], [0, 10], 'stabil', 'Oberflächenschwarm an sonnigen, ruhigen Tagen.'],
};

// Auswahlliste. Krebse und Neunaugen sind bewusst nicht dabei (in Sachsen nicht beangelbar).
const LISTE: Record<Abschnitt, string> = {
  s: 'Aal|Aland|Afrikanischer Raubwels|Amur-Schläfergrundel|Arapaima|Bachforelle|Bachsaibling|Bachschmerle|Barbe|Bitterling|Blaubandbärbling|Brachse|Donaukaulbarsch|Dreistachliger Stichling|Döbel|Elritze|Elsässer Saibling|Flussbarsch|Flussgrundel|Forellenbarsch|Frauennerfling|Giebel|Goldfisch|Goldforelle|Goldorfe|Graskarpfen|Groppe (Koppe)|Gründling|Güster|Hasel|Hecht|Huchen|Karausche|Karpfen|Kaulbarsch|Kessler-Grundel|Kilch|Lachs|Maifisch|Mairenke|Marmorataforelle|Marmorierte Grundel|Marmorkarpfen|Meerforelle|Moderlieschen|Nase|Neunstachliger Stichling|Nordseeschnäpel|Ostseeschnäpel|Perlfisch|Quappe|Rapfen|Regenbogenforelle|Renke|Rotauge|Rotfeder|Schlammpeitzger|Schleie|Schneider|Schrätzer|Schwarzbarsch|Schwarzer Amur|Schwarzmund-Grundel|Seeforelle|Seesaibling|Sonnenbarsch|Steinbeißer|Sterlet|Stint|Stör|Strömer|Tigerforelle|Ukelei|Wels|Wolgazander|Zander|Ziege|Zingel|Zobel|Zope|Zwergwels|Zährte|Äsche',
  m: 'Aalmutter|Amberjack|Barrakuda|Barramundi|Blauleng|Bonito|Butterfisch|Dorade|Dornhai|Dorsch|Drachenkopf|Finte|Fleckhai|Flunder|Glattbutt|Glatthai|Goldmakrele|Heilbutt|Hering|Hornhecht|Hundshai|Katzenhai|Kliesche|Klippenbarsch|Knurrhahn (Grauer)|Knurrhahn (Roter)|Köhler|Leng|Lippfisch|Lumb|Makrele|Marlin|Meeraal|Meeräsche|Muräne|Nagelrochen|Petermännchen|Pollack|Rotbarbe|Rotbarsch|Sandaal|Sardine|Scheibenbauch|Schellfisch|Scholle|Schriftbarsch|Seehase|Seehecht|Seequappe (dreibärtelig)|Seequappe (vierbärtelig)|Seerüßling|Seeskorpion|Seeteufel|Sprotte|Steinbutt|Streifenbarbe|Streifenbarsch|Tarpun|Thunfisch|Tobiasfisch|Wittling|Wolfsbarsch',
  x: 'Sonstiges',
};

// Listennamen, die auf einen Profilschlüssel zeigen (Name in der Liste ≠ Profilname).
const PROFIL_ZU: Record<string, string> = {
  Bachforelle: 'forelle', Bachsaibling: 'saibling', Brachse: 'brasse', Flussbarsch: 'barsch',
  Regenbogenforelle: 'regenbogen', Renke: 'maraene', 'Äsche': 'aesche', 'Döbel': 'doebel', 'Güster': 'guester',
};

export function slug(n: string): string {
  return n
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function aufbauen(): Record<string, Art> {
  const out: Record<string, Art> = {};
  (Object.keys(LISTE) as Abschnitt[]).forEach((ab) => {
    LISTE[ab].split('|').forEach((n) => {
      const key = PROFIL_ZU[n] ?? slug(n);
      const p = PROFILE[key];
      if (p) {
        const [name, gruppe, wasser, licht, bewoelkung, wind, druck, tipp] = p;
        out[key] = {
          key, name, abschnitt: ab, alias: n !== name ? n : undefined,
          profil: {
            gruppe, druck, tipp,
            wasser: wasser as Artprofil['wasser'], licht: licht as Artprofil['licht'],
            bewoelkung: bewoelkung as Artprofil['bewoelkung'], wind: wind as Artprofil['wind'],
          },
        };
      } else out[key] = { key, name: n, abschnitt: ab };
    });
  });
  return out;
}

export const ARTEN: Record<string, Art> = aufbauen();

export const artName = (k: string): string => ARTEN[k]?.name ?? k;
export const hatProfil = (k: string): boolean => !!ARTEN[k]?.profil;
export const profilArten = (): Art[] => Object.values(ARTEN).filter((a) => a.profil);
export const istRaubfisch = (k: string): boolean => {
  const g = ARTEN[k]?.profil?.gruppe;
  return g === 'raub' || g === 'salmo';
};

/** Suche über Namen und Alternativnamen, ohne Groß-/Kleinschreibung. */
export function artPasst(k: string, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const a = ARTEN[k];
  return !!a && (a.name.toLowerCase().includes(s) || (a.alias ?? '').toLowerCase().includes(s));
}
