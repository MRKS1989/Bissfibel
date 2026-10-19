// Fotos auf dem Gerät verarbeiten. Durch das Neuzeichnen im Canvas gehen EXIF- und GPS-Daten verloren.
import { db } from '../db';
import { farbeErkennen, freistellen, truebungAusFarbe, type Farbfamilie, type Truebung } from './wasser';
import { neueId } from './zeit';

function ladeBild(src: Blob): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(src);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); res(img); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Bild nicht lesbar')); };
    img.src = url;
  });
}

const alsBlob = (c: HTMLCanvasElement, typ: string, q?: number) =>
  new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Bild nicht speicherbar'))), typ, q));

/** Lange Seite ca. 1200 px, JPEG ~75 %, ohne Ortsdaten. */
export async function verkleinern(file: Blob, max = 1200, q = 0.75): Promise<Blob> {
  const img = await ladeBild(file);
  const sc = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  return alsBlob(c, 'image/jpeg', q);
}

export async function speichereFoto(blob: Blob): Promise<string> {
  const id = neueId('p');
  await db.fotos.put({ id, blob });
  return id;
}

export async function loescheFoto(id?: string) {
  if (id) await db.fotos.delete(id);
}

/** Wasserfoto: mittleren Bildbereich auswerten (kein Upload). */
export async function wasserAuswerten(file: Blob): Promise<{ truebung: Truebung; warum: string } | null> {
  try {
    const img = await ladeBild(file);
    const W = 80, H = Math.max(1, Math.round((80 * img.height) / img.width));
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d')!;
    x.drawImage(img, 0, 0, W, H);
    const d = x.getImageData(Math.round(W * 0.2), Math.round(H * 0.35), Math.max(1, Math.round(W * 0.6)), Math.max(1, Math.round(H * 0.5))).data;
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
    return truebungAusFarbe(r / n, g / n, b / n);
  } catch {
    return null;
  }
}

/** Köderfoto: quadratisch zuschneiden, wenn möglich freistellen, Farbe erkennen. */
export async function koederBild(file: Blob): Promise<{ original: Blob; frei: Blob | null; farbe: Farbfamilie | null }> {
  const img = await ladeBild(file);
  // Quadratischer Zuschnitt als Ausweg
  const side = Math.min(img.width, img.height);
  const q = document.createElement('canvas');
  q.width = q.height = 320;
  q.getContext('2d')!.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 320, 320);
  const original = await alsBlob(q, 'image/jpeg', 0.8);

  const M = 360, sc = Math.min(1, M / Math.max(img.width, img.height));
  const W = Math.max(1, Math.round(img.width * sc)), H = Math.max(1, Math.round(img.height * sc));
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const x = cv.getContext('2d')!;
  x.drawImage(img, 0, 0, W, H);
  const id = x.getImageData(0, 0, W, H);
  const box = freistellen(id.data, W, H);
  let frei: Blob | null = null;
  let pixel: ArrayLike<number> = x.getImageData(0, 0, W, H).data;
  if (box) {
    x.putImageData(id, 0, 0);
    const s = Math.max(box.w, box.h) * 1.15;
    const o = document.createElement('canvas');
    o.width = o.height = 320;
    o.getContext('2d')!.drawImage(cv, box.x - (s - box.w) / 2, box.y - (s - box.h) / 2, s, s, 0, 0, 320, 320);
    frei = await alsBlob(o, 'image/png');
    pixel = o.getContext('2d')!.getImageData(0, 0, 320, 320).data;
  }
  return { original, frei, farbe: farbeErkennen(pixel) };
}

/** Blob ↔ Data-URL für Export/Import. */
export const blobZuDataUrl = (b: Blob) => new Promise<string>((res, rej) => {
  const fr = new FileReader();
  fr.onload = () => res(fr.result as string);
  fr.onerror = () => rej(fr.error);
  fr.readAsDataURL(b);
});

export async function dataUrlZuBlob(u: string): Promise<Blob> {
  return (await fetch(u)).blob();
}
