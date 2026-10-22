// Baut public/gewaesser-sachsen.json aus einem GeoJSON-Sequence-Export von osmium.
// Aufruf: npx tsx scripts/gewaesser/baue.ts <eingabe.geojsonseq> <ausgabe.json>
import { createReadStream, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { baueDaten, type Feature } from '../../src/lib/gewaesser-daten';

const [ein, aus, minArg] = process.argv.slice(2);
const MIN_STILL = minArg ? +minArg : 500; // Schutz gegen kaputte Downloads
if (!ein || !aus) {
  console.error('Aufruf: tsx scripts/gewaesser/baue.ts <eingabe.geojsonseq> <ausgabe.json>');
  process.exit(1);
}

const features: Feature[] = [];
const rl = createInterface({ input: createReadStream(ein, 'utf8'), crlfDelay: Infinity });
for await (const zeile of rl) {
  const z = zeile.replace(/^\x1e/, '').trim(); // RS-Zeichen am Zeilenanfang (RFC 8142)
  if (z) features.push(JSON.parse(z) as Feature);
}

const d = baueDaten(features, new Date().toISOString().slice(0, 10));
writeFileSync(aus, JSON.stringify(d));
const nach = (t: string) => d.still.filter((s) => s[1] === t).length;
console.log(`${features.length} Objekte gelesen → ${d.still.length} Stillgewässer (See ${nach('see')}, Teich ${nach('teich')}, Talsperre ${nach('talsperre')}), ${d.fliess.length} Fließgewässer`);
if (d.still.length < MIN_STILL) {
  console.error('Zu wenige Stillgewässer – da stimmt etwas nicht. Abbruch.');
  process.exit(2);
}
