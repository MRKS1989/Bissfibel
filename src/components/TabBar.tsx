export type TabId = 'heute' | 'gewaesser' | 'angeln' | 'erfolge';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'heute', label: 'Heute', icon: 'M4 18h16M7 18V9m5 9V5m5 13v-6' },
  { id: 'gewaesser', label: 'Gewässer', icon: 'M3 9c3-2 5 2 9 0s6 2 9 0M3 15c3-2 5 2 9 0s6 2 9 0' },
  { id: 'angeln', label: 'Angeln', icon: 'M5 4h11l3 3v13H5zM9 9h6M9 13h6M9 17h3' },
  { id: 'erfolge', label: 'Erfolge', icon: '' },
];

export function TabBar({ active, onChange, oben, neu }: { active: TabId; onChange: (t: TabId) => void; oben?: React.ReactNode; neu?: boolean }) {
  return (
    <nav className="tabs" aria-label="Bereiche">
      {oben}
      <div className="in" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            aria-controls={`t-${t.id}`}
            style={{ position: 'relative' }}
            onClick={() => onChange(t.id)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              {t.id === 'erfolge' ? (
                <>
                  <circle cx="12" cy="9" r="5" />
                  <path d="M9 13.5L7.5 21l4.5-2.5 4.5 2.5-1.5-7.5" />
                </>
              ) : (
                <path d={t.icon} />
              )}
            </svg>
            {t.label}
            {t.id === 'erfolge' && neu && <span className="dot" aria-label="neues Abzeichen" />}
          </button>
        ))}
      </div>
    </nav>
  );
}
