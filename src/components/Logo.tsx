// Wortmarke BISSFIBEL: das I in BISS ist eine Fischgräte, das I in FIBEL ein Maßband.
const TICKS = [4, 9, 14, 19, 24, 29, 34, 39, 44, 49, 54, 59, 64, 69, 74, 79, 84, 89];

export function Logo() {
  return (
    <h1 className="logo" aria-label="Bissfibel">
      <span aria-hidden="true">B</span>
      <svg className="bone-i" viewBox="0 0 28 100" aria-hidden="true">
        <path className="fb-h" d="M4 26C4 12 9 3 14 0c5 3 10 12 10 26z" />
        <circle className="fb-e" cx="14" cy="15" r="3" />
        <path
          className="fb-l"
          d="M14 26v60M14 36l-10 8M14 36l10 8M14 50l-10 8M14 50l10 8M14 64l-8 7M14 64l8 7M14 86l-9 12M14 86l9 12"
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>
      <span aria-hidden="true">SSF</span>
      <svg className="tape-i" viewBox="0 0 28 100" aria-hidden="true">
        <rect className="tp-b" x="3" y="0" width="22" height="92" rx="2" />
        {TICKS.map((y, i) => (
          <rect key={y} className="tp-t" x="3" y={y} width={i % 4 === 0 ? 11 : 6} height="2" />
        ))}
        <rect className="tp-c" x="1" y="90" width="26" height="10" rx="2" />
        <rect className="tp-m" x="0" y="38" width="28" height="5" />
      </svg>
      <span aria-hidden="true" className="nd">BEL</span>
    </h1>
  );
}
