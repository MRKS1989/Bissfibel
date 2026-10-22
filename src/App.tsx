import { useEffect, useState } from 'react';
import { Logo } from './components/Logo';
import { TabBar, type TabId } from './components/TabBar';
import { useAlarmPruefung } from './components/AlarmSchalter';
import { FeierProvider } from './components/Feier';
import { MeldungProvider } from './components/Ui';
import { useAngeltage, useEinstellungen, useKoeder, useOnline, useSession, useTick } from './hooks/daten';
import { abzeichen, stufenKeys } from './lib/punkte';
import { dauerUhr } from './lib/zeit';
import { WetterProvider } from './hooks/WetterKontext';
import { Angeln } from './tabs/Angeln';
import { Erfolge } from './tabs/Erfolge';
import { Gewaesser } from './tabs/Gewaesser';
import { Heute } from './tabs/Heute';
import { applyTheme, loadTheme, nextTheme, THEME_LABEL, type Theme } from './theme';

export function App() {
  const [tab, setTab] = useState<TabId>('heute');
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const online = useOnline();
  const neu = useNeueAbzeichen();
  useAlarmPruefung();

  function toggleTheme() {
    const t = nextTheme(theme);
    applyTheme(t);
    setTheme(t);
  }

  function geheZu(t: TabId) {
    setTab(t);
    window.scrollTo({ top: 0 });
  }

  // Nach dem Tab-Wechsel oben anfangen.
  useEffect(() => window.scrollTo({ top: 0 }), [tab]);

  return (
    <MeldungProvider>
      <FeierProvider>
      <WetterProvider>
        <div className="wrap">
          <header className="top">
            <Logo />
            <div className="top-r">
              {!online && <span className="offline" title="Einträge werden trotzdem gespeichert.">Offline</span>}
              <button type="button" className="theme-btn" onClick={toggleTheme} aria-label={`Darstellung: ${THEME_LABEL[theme]}. Tippen zum Wechseln.`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <circle cx="12" cy="12" r="8" />
                  <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
                </svg>
                {THEME_LABEL[theme]}
              </button>
            </div>
          </header>
          <section id={`t-${tab}`} className="tab" role="tabpanel">
            {tab === 'heute' && <Heute geheZu={geheZu} />}
            {tab === 'gewaesser' && <Gewaesser />}
            {tab === 'angeln' && <Angeln geheZu={geheZu} />}
            {tab === 'erfolge' && <Erfolge />}
          </section>
        </div>
        <TabBar active={tab} onChange={geheZu} oben={tab !== 'angeln' && <LiveBalken onClick={() => geheZu('angeln')} />} neu={neu && tab !== 'erfolge'} />
      </WetterProvider>
      </FeierProvider>
    </MeldungProvider>
  );
}

/** Auf allen anderen Tabs: „Du angelst seit 1:23 h · 3 Bisse · 1 Fisch“. Tippen springt zurück. */
function LiveBalken({ onClick }: { onClick: () => void }) {
  const s = useSession();
  const jetzt = useTick(!!s, 15000);
  if (!s) return null;
  const n = s.faenge.length, b = s.bisse.length;
  return (
    <button type="button" className="livebar" onClick={onClick}>
      <span className="pulse" />
      <span>Du angelst seit {dauerUhr(jetzt - s.start).slice(0, -3)} h · {b} {b === 1 ? 'Biss' : 'Bisse'} · {n} Fisch{n === 1 ? '' : 'e'}</span>
    </button>
  );
}

function useNeueAbzeichen(): boolean {
  const tage = useAngeltage();
  const koeder = useKoeder();
  const e = useEinstellungen();
  if (!e.geladen) return false;
  return stufenKeys(abzeichen(tage, koeder)).some((k) => !e.gesehenAbzeichen.includes(k));
}
