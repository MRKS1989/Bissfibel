// Vorläufiger Inhalt eines Tabs: zeigt, was in welchem Schritt dazukommt.
export function Placeholder({ title, step, items }: { title: string; step: string; items: string[] }) {
  return (
    <div className="panel">
      <span className="step">{step}</span>
      <h2>{title}</h2>
      <ul className="soon">
        {items.map((it) => (
          <li key={it}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
