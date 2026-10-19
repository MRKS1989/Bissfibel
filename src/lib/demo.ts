// Erfundene Beispieldaten, damit neue Nutzer sehen, worauf sie hinarbeiten. Werden nie gespeichert.
import type { Angeltag, Fang } from '../db';
import type { Licht, Mondgruppe } from './astro';
import type { Farbfamilie, Truebung } from './wasser';
import { teile, TAG } from './zeit';

export function beispielTage(): Angeltag[] {
  let s = 42;
  const r = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const P = ['fallend', 'stabil', 'steigend'] as const, M: Mondgruppe[] = ['Neumond', 'zunehmend', 'Vollmond', 'abnehmend'];
  const L: Licht[] = ['daemmerung', 'tag', 'nacht'], C = ['klar', 'wechselnd', 'bedeckt'] as const;
  const SP = ['zander', 'zander', 'hecht', 'barsch', 'zander', 'aal'], W = ['Zwickauer Mulde', 'Kiesgrube', 'Zwickauer Mulde', 'Dorfteich', 'Zwickauer Mulde', 'Talsperre'];
  const basis: Record<string, number> = { zander: 45, hecht: 55, barsch: 22, aal: 55 };
  const BAIT: Record<Truebung, [string, Farbfamilie][]> = {
    klar: [['Gummifisch Barsch-Dekor', 'natur'], ['Wobbler Rotauge', 'weissfisch']],
    leicht: [['Gummifisch weiß', 'weiss'], ['Gummifisch weiß', 'weiss'], ['Spinner silber', 'weissfisch']],
    trueb: [['Gummifisch chartreuse', 'chartreuse'], ['Gummifisch chartreuse', 'chartreuse'], ['Wobbler Firetiger', 'firetiger']],
    braun: [['Spinner gold', 'gold'], ['Gummifisch orange', 'orange']],
  };
  const out: Angeltag[] = [];
  const start = Date.UTC(2025, 3, 1);
  for (let i = 0; i < 60; i++) {
    const druck = pick([...P]), licht = pick(L), wolken = pick([...C]), mond = pick(M), art = pick(SP);
    const truebung = pick<Truebung>(['klar', 'leicht', 'leicht', 'trueb', 'braun']);
    const d = 2 + Math.floor(r() * 4);
    const rate = 0.33 * (druck === 'fallend' ? 1.7 : druck === 'steigend' ? 0.6 : 1) * (licht === 'daemmerung' ? 1.6 : licht === 'nacht' ? 0.9 : 0.8)
      * (wolken === 'bedeckt' ? 1.2 : 1) * (art === 'zander' && truebung === 'trueb' ? 1.4 : 1);
    const ts = start + i * 7 * TAG + 6 * 36e5;
    const faenge: Fang[] = [];
    let bisse = 0;
    for (let h = 0; h < d; h++) {
      if (r() < rate * 1.8) bisse++;
      if (r() < rate) {
        const [koeder, koederFarbe] = pick(BAIT[truebung]);
        faenge.push({ id: `d${i}_${h}`, zeit: ts + h * 36e5, fischart: art, laengeCm: Math.round(basis[art] + r() * 28), koeder, koederFarbe, score: +(3.5 + r() * 5.5).toFixed(1) });
      }
    }
    const t = teile(ts);
    const wname = pick(W) + ' (Beispiel)';
    out.push({
      id: `d${i}`, datum: t.key, beginn: t.hhmm, startTs: ts, dauerH: d, gewaesserId: 'demo-' + wname, gewaesserName: wname,
      zielfisch: art, live: r() < 0.6, bisse: Math.max(bisse, faenge.length), faenge, wasserCheck: r() < 0.5,
      wetter: { luftdruckTrend: druck, licht, bewoelkung: wolken, mond, truebung, score: +(3 + r() * 6).toFixed(1) },
    });
  }
  return out.reverse();
}
