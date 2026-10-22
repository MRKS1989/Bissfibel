// Alarm als Benachrichtigung: ein Schalter. Prüft beim Öffnen, alle 30 Minuten bei offener App
// und – wo der Browser es kann (Chrome/Android, installiert) – auch im Hintergrund.
import { useEffect, useState } from 'react';
import { speichereEinstellungen } from '../db';
import { alarmPruefen } from '../alarm-pruefen';
import { useEinstellungen } from '../hooks/daten';
import { ALARM_AB } from '../lib/score';
import { fmt1, uhrzeit } from '../lib/zeit';

const kannMelden = () => typeof window !== 'undefined' && 'Notification' in window;

async function zeigen(titel: string, text: string, tag: string) {
  const reg = await navigator.serviceWorker?.getRegistration();
  if (reg) await reg.showNotification(titel, { body: text, tag, icon: 'icon-192.png', badge: 'icon-192.png' });
  else new Notification(titel, { body: text, tag });
}

type PeriodicSyncReg = ServiceWorkerRegistration & { periodicSync?: { register: (tag: string, o: { minInterval: number }) => Promise<void>; unregister: (tag: string) => Promise<void> } };

/** Hintergrund-Prüfung anmelden. true, wenn der Browser das unterstützt und erlaubt. */
async function hintergrundAnmelden(): Promise<boolean> {
  try {
    const reg = (await navigator.serviceWorker?.ready) as PeriodicSyncReg | undefined;
    if (!reg?.periodicSync) return false;
    const st = await navigator.permissions.query({ name: 'periodic-background-sync' as PermissionName });
    if (st.state !== 'granted') return false;
    await reg.periodicSync.register('bissfibel-alarm', { minInterval: 4 * 3600e3 });
    return true;
  } catch {
    return false;
  }
}

async function hintergrundAbmelden() {
  try { await ((await navigator.serviceWorker?.ready) as PeriodicSyncReg | undefined)?.periodicSync?.unregister('bissfibel-alarm'); } catch { /* egal */ }
}

/** In der App: prüfen, solange der Alarm an ist. */
export function useAlarmPruefung() {
  const e = useEinstellungen();
  const an = !!e.alarm?.an;
  useEffect(() => {
    if (!an || !kannMelden() || Notification.permission !== 'granted') return;
    const pruefen = () => { alarmPruefen(zeigen).catch(() => {}); };
    pruefen();
    const i = setInterval(pruefen, 30 * 60e3);
    const sicht = () => document.visibilityState === 'visible' && pruefen();
    document.addEventListener('visibilitychange', sicht);
    return () => { clearInterval(i); document.removeEventListener('visibilitychange', sicht); };
  }, [an]);
}

export function AlarmSchalter() {
  const e = useEinstellungen();
  const an = !!e.alarm?.an;
  const [hinweis, setHinweis] = useState('');
  const [hintergrund, setHintergrund] = useState<boolean | null>(null);
  useEffect(() => { if (an) hintergrundAnmelden().then(setHintergrund); }, [an]);

  async function umschalten() {
    if (an) {
      await speichereEinstellungen({ alarm: { ...(e.alarm ?? { ab: ALARM_AB, gemeldet: [] }), an: false } });
      await hintergrundAbmelden();
      setHinweis('');
      return;
    }
    if (!kannMelden()) {
      setHinweis('Dieser Browser kann keine Benachrichtigungen zeigen. Auf dem iPhone: App erst über „Teilen → Zum Home-Bildschirm“ installieren, dann von dort öffnen und hier einschalten.');
      return;
    }
    const p = await Notification.requestPermission();
    if (p !== 'granted') {
      setHinweis('Benachrichtigungen sind blockiert. Erlaube sie in den Einstellungen deines Browsers bzw. Handys für diese App.');
      return;
    }
    await speichereEinstellungen({ alarm: { ab: ALARM_AB, gemeldet: e.alarm?.gemeldet ?? [], an: true } });
    setHinweis('');
  }

  return (
    <div className="panel">
      <div className="row between">
        <div style={{ flex: '1 1 200px', minWidth: 0 }}>
          <h3>Alarm</h3>
          <p className="hint">Benachrichtigung, wenn in den nächsten 2 Tagen ein Zeitfenster ab {fmt1(ALARM_AB)} kommt (deine Top-Fische, Gewässer im Umkreis). Nie bei Sturm.</p>
        </div>
        <button type="button" role="switch" aria-checked={an} className={'switch' + (an ? ' on' : '')} onClick={umschalten} aria-label="Alarm-Benachrichtigung">
          <span />
        </button>
      </div>
      {hinweis && <p className="err">{hinweis}</p>}
      {an && (
        <p className="hint">
          {hintergrund
            ? 'Prüft auch bei geschlossener App, etwa alle paar Stunden (wann genau, entscheidet das Handy).'
            : 'Prüft beim Öffnen der App und alle 30 Minuten, solange sie offen ist. Bei geschlossener App klappt das nur mit installierter App in Chrome auf Android.'}
          {e.alarm?.geprueft ? ` Zuletzt geprüft: ${uhrzeit(e.alarm.geprueft)} Uhr.` : ''}
        </p>
      )}
    </div>
  );
}
