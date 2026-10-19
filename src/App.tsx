import { useState } from 'react';
import { Logo } from './components/Logo';
import { TabBar, type TabId } from './components/TabBar';
import { Angeln } from './tabs/Angeln';
import { Erfolge } from './tabs/Erfolge';
import { Gewaesser } from './tabs/Gewaesser';
import { Heute } from './tabs/Heute';
import { applyTheme, loadTheme, nextTheme, THEME_LABEL, type Theme } from './theme';

const PAGES: Record<TabId, () => JSX.Element> = { heute: Heute, gewaesser: Gewaesser, angeln: Angeln, erfolge: Erfolge };

export function App() {
  const [tab, setTab] = useState<TabId>('heute');
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const Page = PAGES[tab];

  function toggleTheme() {
    const t = nextTheme(theme);
    applyTheme(t);
    setTheme(t);
  }

  function changeTab(t: TabId) {
    setTab(t);
    window.scrollTo({ top: 0 });
  }

  return (
    <>
      <div className="wrap">
        <header className="top">
          <Logo />
          <button type="button" className="theme-btn" onClick={toggleTheme} aria-label={`Darstellung: ${THEME_LABEL[theme]}. Tippen zum Wechseln.`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="12" cy="12" r="8" />
              <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
            </svg>
            {THEME_LABEL[theme]}
          </button>
        </header>
        <section id={`t-${tab}`} className="tab" role="tabpanel">
          <Page />
        </section>
      </div>
      <TabBar active={tab} onChange={changeTab} />
    </>
  );
}
