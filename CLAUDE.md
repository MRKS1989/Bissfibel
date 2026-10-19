# Bissfibel – Projektregeln

## Worum es geht
Private Angel-App „Bissfibel“ (Web-App/PWA) für Angler in Sachsen. Sie bewertet für eine gewählte Fischart die nächsten 7 Tage an den eigenen Gewässern im Umkreis des Wohnorts (Bisswert 0–10) und lernt aus dem eigenen Fangbuch. Die vollständige Beschreibung steht in `docs/SPEZIFIKATION.md`. Der Klick-Prototyp in `prototyp/bissfibel.html` ist die Referenz für Aussehen, Texte und Rechenlogik.

## Der Nutzer
- Programmiert nicht selbst. Erkläre Schritte in einfachem Deutsch, ohne Fachjargon, und sag immer, wie er das Ergebnis testen kann.
- Arbeite in kleinen, testbaren Schritten. Nach jedem Schritt: was ist neu, wie probiere ich es aus.
- Frag nach, bevor du neue kostenpflichtige Dienste, Konten oder größere Abhängigkeiten einführst.

## Technik (Vorschlag, bei Bedarf begründet ändern)
- Vite + React + TypeScript, als installierbare PWA (offlinefähig)
- Daten lokal im Browser in IndexedDB (z. B. über Dexie), plus Export/Import als JSON-Datei zur Sicherung
- Wetter: Open-Meteo Forecast-API mit `past_days=14` (kein API-Schlüssel); Ortssuche: Open-Meteo Geocoding-API
- Karte zum Anlegen von Gewässern: Leaflet mit OpenStreetMap-Kacheln (Nutzungsrichtlinie und Namensnennung beachten)
- Hosting später: GitHub Pages, Netlify oder Cloudflare Pages (kostenlos)
- Rechenlogik (Score, Wassertemperatur, Mond, Sonne, Punkte, Abzeichen) als reine Funktionen in eigenen Modulen mit Unit-Tests (Vitest)

## Feste Regeln
- **Keine Daten von ALLE ANGELN.** Deren AGB verbieten Bots, Crawler und Scraper ausdrücklich. Nichts davon abrufen, nachbauen oder einbetten.
- **Angelatlas Sachsen nur verlinken**, nicht auslesen oder kopieren (geschützte Datenbank, Bestimmungen ändern sich). Eine Datenübernahme erst nach schriftlicher Zustimmung des Landesverbands Sächsischer Angler.
- **Ehrlichkeit vor Effekt:** Jeder Score zeigt seine Gründe. Der Mond bekommt wenig Gewicht, weil sein Einfluss kaum belegt ist. Geschätzte Werte (Wassertemperatur) sind als Schätzung gekennzeichnet.
- **Gamification belohnt das Eintragen, nie die Menge an Fisch.** Schneidertage bringen mehr Punkte als Fangtage. Keine öffentlichen Ranglisten und keine geteilten Fangplätze (Hotspot-Schutz, Privatsphäre).
- **Sicherheit:** Bei Sturm (Wind über 35 km/h) oder stark fallendem Luftdruck einen Warnhinweis zeigen, nie zum Angeln ermuntern.
- Schonzeiten und Mindestmaße kommen aus der Sächsischen Fischereiverordnung 2022 (Tabelle in der Spezifikation). Immer mit Stand-Datum und dem Hinweis, dass die Gewässerordnung von Verein oder Pächter strenger sein kann. Bei geschontem Zielfisch deutlich warnen.
- Das Lernen aus eigenen Daten darf nie mehr behaupten, als die Daten hergeben: Aussagen erst ab den Mindestmengen und immer mit Anzahl Angeltage.
- Die Wasserfoto-Auswertung läuft auf dem Gerät, Fotos werden dafür nicht hochgeladen.
- Daten bleiben auf dem Gerät. Kein Tracking, keine Analyse-Dienste.
- Fotos immer ohne Ortsdaten (EXIF/GPS) speichern.
- Der Live-Modus muss mit einer Hand und nassen Fingern bedienbar sein: große Buttons, keine Pflichtfelder außer beim Fang.

## Gestaltung
- Mobile first, eine Spalte, Navigation unten mit 4 Tabs: Heute, Gewässer, Angeln (Live-Modus + Fangbuch), Erfolge
- Weniger ist mehr: pro Bildschirm eine Hauptaussage, Details aufklappbar
- Farben, Schriften und die „Pegellatte“ als Score-Anzeige aus dem Prototyp übernehmen; Hell- und Dunkelmodus
- Alle Texte auf Deutsch, Du-Form, kurze Sätze

## Arbeitsweise
- Vor größeren Schritten kurz den Plan nennen.
- Nach Änderungen Tests laufen lassen und die App einmal im Browser starten.
- Commits klein halten, Commit-Nachrichten auf Deutsch.
