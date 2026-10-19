import { useEffect, useState } from 'react';
import { Logo } from './components/Logo';
import { TabBar, type TabId } from './components/TabBar';
import { MeldungProvider } from './components/Ui';
import { useOnline } from './hooks/daten';
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
        <TabBar active={tab} onChange={geheZu} />
      </WetterProvider>
    </MeldungProvider>
  );
}
