# Bissfibel – Übergabepaket für Claude Code

Angel-App, die für eine gewählte Fischart sagt, wann und wo es sich lohnt, und die aus deinem eigenen Fangbuch lernt.

## Inhalt

| Datei | Wofür |
|---|---|
| `CLAUDE.md` | Projektregeln. Claude Code liest die Datei automatisch bei jedem Start. |
| `docs/SPEZIFIKATION.md` | Was die App können soll: Funktionen, Bewertungsmodell, Datenmodell, Gamification, Fahrplan. |
| `docs/START-PROMPT.md` | Die erste Nachricht, die du in Claude Code einfügst. |
| `assets/` | Logo (hell, dunkel) und App-Symbol als SVG. |
| `prototyp/bissfibel.html` | Der Klick-Prototyp aus dem Chat. Referenz für Aussehen und Logik. |

## So startest du

1. Claude Code auf deinem Rechner installieren. Anleitung: https://docs.claude.com/en/docs/claude-code/overview
2. Diesen Ordner entpacken, zum Beispiel nach `Dokumente/bissfibel`.
3. Im Terminal in den Ordner wechseln und `claude` starten.
4. Den Text aus `docs/START-PROMPT.md` einfügen.

Claude Code plant dann die erste Version, fragt bei offenen Punkten nach und baut Schritt für Schritt. Du testest im Browser auf deinem Rechner und später auf dem Handy.

## Was du nebenbei brauchst

- **Node.js** (wird für die Entwicklung gebraucht, Claude Code hilft beim Einrichten)
- **Ein GitHub-Konto** (kostenlos), wenn die App später online und aufs Handy soll
- Keine kostenpflichtigen Dienste für Phase 1. Wetterdaten kommen von Open-Meteo, für private Nutzung kostenlos.
