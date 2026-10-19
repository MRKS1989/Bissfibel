// Schonzeiten und Mindestmaße nach Sächsischer Fischereiverordnung (SächsFischVO)
// vom 22.04.2022, gültig ab 1.6.2022. Jährlich prüfen.
import { artName, istRaubfisch } from './arten';

export const REGELN_STAND = 'Sächsische Fischereiverordnung vom 22.04.2022 (gültig ab 1.6.2022), geprüft Oktober 2026';
export const REGELN_HINWEIS = 'Die Gewässerordnung deines Vereins oder Pächters kann strenger sein.';

type Tag = [number, number]; // [Monat, Tag]
type Zeitraum = [Tag, Tag];
type Regel = {
  sz?: Zeitraum; mm?: number; fliess?: boolean; note?: string;
  ganzjaehrig?: boolean; ausnahmeGewaesser?: string[]; ausnahme?: { sz: Zeitraum; mm: number };
};

const REG: Record<string, Regel> = {
  aal: { mm: 50 },
  aland: { mm: 20 },
  aesche: { sz: [[1, 1], [6, 15]], mm: 35 },
  forelle: { sz: [[10, 1], [4, 30]], mm: 28 },
  saibling: { sz: [[10, 1], [4, 30]], mm: 25 },
  barbe: { sz: [[4, 15], [6, 30]], mm: 50 },
  maraene: { sz: [[10, 1], [12, 31]], mm: 30, note: 'Gilt für die Große Maräne.' },
  hecht: { sz: [[2, 1], [4, 30]], mm: 50 },
  karausche: { sz: [[2, 1], [6, 30]], mm: 15 },
  karpfen: { mm: 40 },
  seeforelle: { sz: [[10, 1], [4, 30]], mm: 60 },
  rapfen: { sz: [[1, 1], [5, 31]], mm: 40 },
  zander: { sz: [[2, 1], [5, 31]], mm: 50 },
  schleie: { mm: 25 },
  regenbogen: { sz: [[10, 1], [4, 30]], mm: 25, fliess: true, note: 'Die Schonzeit gilt nur in Fließgewässern.' },
  rotfeder: { mm: 20, fliess: true, note: 'Das Mindestmaß gilt nur in Fließgewässern.' },
  nase: {
    ganzjaehrig: true, ausnahmeGewaesser: ['elbe'], ausnahme: { sz: [[1, 1], [6, 15]], mm: 40 },
    note: 'In der Elbe: Schonzeit 1. Jan. – 15. Juni, Mindestmaß 40 cm. Sonst ganzjährig geschont.',
  },
  quappe: {
    // Nur die Vereinigte Mulde, nicht Zwickauer oder Freiberger Mulde.
    ganzjaehrig: true, ausnahmeGewaesser: ['elbe', 'vereinigte mulde', 'weiße elster', 'weisse elster'], ausnahme: { sz: [[1, 1], [3, 31]], mm: 30 },
    note: 'In Elbe, Vereinigter Mulde und Weißer Elster: Schonzeit 1. Jan. – 31. März, Mindestmaß 30 cm. Sonst ganzjährig geschont.',
  },
  lachs: { sz: [[10, 1], [4, 30]], mm: 60 },
  meerforelle: { sz: [[10, 1], [4, 30]], mm: 60 },
  seesaibling: { sz: [[10, 1], [4, 30]], mm: 28 },
};
['bitterling', 'elritze', 'finte', 'groppe-koppe', 'maifisch', 'neunstachliger-stichling', 'nordseeschnaepel', 'schlammpeitzger',
  'bachschmerle', 'schneider', 'steinbeisser', 'stoer', 'zaehrte', 'zope'].forEach((k) => (REG[k] = { ganzjaehrig: true }));

const MON = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];
const tagTxt = ([m, d]: Tag) => `${d}. ${MON[m - 1]}`;
export const zeitraumTxt = (z: Zeitraum) => `${tagTxt(z[0])} – ${tagTxt(z[1])}`;

/** Liegt das Datum im Zeitraum? Zeiträume über den Jahreswechsel werden unterstützt. */
export function imZeitraum(datum: Date, [[m1, d1], [m2, d2]]: Zeitraum): boolean {
  const v = (datum.getMonth() + 1) * 100 + datum.getDate(), a = m1 * 100 + d1, b = m2 * 100 + d2;
  return a <= b ? v >= a && v <= b : v >= a || v <= b;
}

export type GewaesserInfo = { name: string; typ: string } | null | undefined;
const istFliess = (w: GewaesserInfo) => !!w && ['fluss', 'bach', 'kanal'].includes(w.typ);

export type Regelergebnis = {
  geschont: boolean; ganzjaehrig: boolean; mindestmass: number | null;
  schonzeit: string | null; bis: string; hinweis?: string; geregelt: boolean;
};

export function regelFuer(art: string, w: GewaesserInfo, datum = new Date()): Regelergebnis {
  const r = REG[art];
  const out: Regelergebnis = { geschont: false, ganzjaehrig: false, mindestmass: null, schonzeit: null, bis: '', geregelt: !!r };
  if (!r) return out;
  let sz = r.sz, mm = r.mm;
  const name = (w?.name ?? '').toLowerCase();
  if (r.ganzjaehrig) {
    if (r.ausnahme && (r.ausnahmeGewaesser ?? []).some((x) => name.includes(x))) {
      sz = r.ausnahme.sz; mm = r.ausnahme.mm;
    } else {
      return { ...out, geschont: true, ganzjaehrig: true, hinweis: r.note };
    }
  }
  const fliessOk = !r.fliess || istFliess(w);
  if (sz && fliessOk) {
    out.schonzeit = zeitraumTxt(sz);
    out.geschont = imZeitraum(datum, sz);
    if (out.geschont) out.bis = tagTxt(sz[1]);
  }
  if (mm && (art !== 'rotfeder' || fliessOk)) out.mindestmass = mm;
  out.hinweis = r.note;
  return out;
}

/** 1. Feb. – 30. Apr.: Angeln mit Raubfischködern verboten (§ 4). */
export const raubfischkoederVerbot = (datum = new Date()) => imZeitraum(datum, [[2, 1], [4, 30]]);
export const raubfischVerbotGilt = (art: string, datum = new Date()) => istRaubfisch(art) && raubfischkoederVerbot(datum);

/** Hinweis beim Fang: nur wenn geschont oder untermaßig. */
export function fangHinweis(art: string, laengeCm: number | null, w: GewaesserInfo, datum = new Date()): string {
  const R = regelFuer(art, w, datum);
  if (R.geschont) return R.ganzjaehrig
    ? `${artName(art)} ist hier ganzjährig geschont. Nicht erlaubt, sofort schonend zurücksetzen.`
    : `Schonzeit bis ${R.bis}: nicht erlaubt, sofort schonend zurücksetzen.`;
  if (R.mindestmass && laengeCm && laengeCm < R.mindestmass)
    return `Untermaßig (Mindestmaß ${R.mindestmass} cm): nicht erlaubt, sofort schonend zurücksetzen.`;
  return '';
}

export const ALLGEMEINE_REGELN = [
  'Vom 1. Feb. bis 30. Apr. ist das Angeln mit Raubfischködern verboten.',
  'Höchstens 2 Handangeln, beim Spinn- oder Fliegenfischen nur 1. Angeln ständig beaufsichtigen.',
  'Köderfische vorher waidgerecht töten, lebende Köderfische sind verboten.',
  'Ganzjährig geschont sind u. a. Bitterling, Elritze, Groppe, Schlammpeitzger, Schmerle, Schneider, Steinbeißer, Stör, Zährte, Zope, Neunaugen, Edelkrebs und Muscheln.',
];
