# Bissfibel – Spezifikation

Stand: 9. Oktober 2026 (Version 12: alle Backlog-Ideen in Phase 1 aufgenommen – Abzeichen-Stufen, Saisonziele, Jahresrückblick, PB-Verlauf, Lernen pro Gewässer ab 10 Angeltagen; davor Version 11: Startseite neu geordnet, Wasser-Check allgemein mit Nays-Dekoren). Grundlage: Klick-Prototyp `prototyp/bissfibel.html`.

## 1. Ziel

Der Angler wählt eine Fischart und sieht, an welchem seiner Gewässer im Umkreis und zu welcher Zeit in den nächsten 7 Tagen die Chancen am besten sind. Über das Fangbuch (inklusive Tagen ohne Fang) erkennt die App mit der Zeit, welche Bedingungen bei genau diesem Angler wirklich etwas bringen.

**Was es so noch nicht gibt:**
0. Live-Modus am Wasser: Uhr läuft mit, Bisse und Fänge per Fingertipp, Foto direkt zum Fang
1. Schneidertage zählen mit, dadurch echte Fangquote pro Stunde statt geschönter Statistik
2. Mythen-Check: Luftdruck, Tageszeit, Wolken und Mond werden an den eigenen Daten überprüft
3. Persönlicher Alarm, wenn die Vorhersage einem guten Zeitfenster entspricht
4. Geschätzte Wassertemperatur auch für Seen ohne Messstelle
5. Gamification, die ehrliches Eintragen belohnt

## 2. Bildschirme

### Heute
- **Top 5 Fische:** Beim ersten Start wählt der Nutzer bis zu 5 Arten (gruppiert nach Raubfische, Forellen und Salmoniden, Friedfische). Nur diese erscheinen als Chips. Sind 5 gewählt, sind alle anderen gesperrt mit dem Hinweis „Nimm erst einen raus“. Über den Chip „Ändern“ (bzw. „+ Fisch“ bei weniger als 5) lässt sich die Auswahl jederzeit anpassen.
- „Beste Chance“ bewusst knapp: Score als große Zahl mit Pegellatte, Status („Alarm“ ab 7,0), Gewässer, Tag und 3-Stunden-Fenster, ggf. „angepasst an deine Fänge“. **Direkt darunter „Gewässer im Detail“**, automatisch auf Gewässer und Tag dieses besten Fensters gestellt (bis der Nutzer selbst ein Gewässer oder einen Tag wählt). **Keine Gründe-Liste im Kopf**, die Begründung steht nur einmal, in den Symbolkarten (sonst doppelt).
- **Ganz unten** „Weitere gute Zeitfenster“ (bis zu 4, je Gewässer und Tag nur eins). Antippen stellt das Detail oben auf dieses Fenster und scrollt hoch.
- Nur bei geschonter Art: kompakte rote Zeile (Mindestmaß, Schonzeit). Bei Raubfischen vom 1. Feb. bis 30. Apr. eine Zeile „keine Raubfischköder“.
- Gewässer im Detail: 7-Tage-Leiste mit Wettersymbol je Tag, Stundenbalken des gewählten Tags (Nacht blass, bestes Fenster hervorgehoben), darunter Karten mit Bildern:
  - *Wetter im besten Fenster:* Wetter-Illustration (Sonne, Wolke, Regen, nachts Mond), Lufttemperatur groß, Wetterwort (Sonnig, Leicht bewölkt, Stark bewölkt, Bedeckt, Schauer möglich, Regen), Regenwahrscheinlichkeit, Druck mit Trendpfeil, Wassertemperatur, Wolken. Darunter **Urteile für die gewählte Art** als farbige Plaketten (grün passt, gelb nicht ideal): „Licht: passt / zu sonnig für Zander / zu trüb“, „Wasser: ideal / etwas kühl / etwas warm“, „Druck: vor Fronten oft aktiv …“
  - *Sonne:* Tagbogen mit Sonnenstand im besten Fenster, Tageslänge, Auf- und Untergang
  - *Mond:* gezeichnete Mondphase, Name, Beleuchtung in %, Hinweis „kaum belegter Einfluss“
  - *Wind:* Windsack, der je nach Stärke ausgefüllt ist, km/h, Urteil für die Art als Plakette („leichte Wellen, passt für Zander“ / „zu ruhig“)
  - Ganz unten eingeklappt: „Das sagen deine Daten“ (persönliches Lernen, ähnliche Tage, Beispiel ansehen) und der Kurztipp „Typisch für <Art>“.
  - Eigene Bildsprache, keine Kopie anderer Apps. Farben der Illustrationen: Sonne `#F5B82E`, Wolke `#D7E5F0`/`#AFC2D2`, Regen `#3D86D6`, Mond `#F1E5BE` auf `#3A4852`.
- Warnhinweis bei Sturm oder stark fallendem Druck

### Gewässer (nur Sachsen)
**Suche:** Stadt oder Ort in Sachsen eingeben (Vorschläge beim Tippen), Umkreis 5–100 km wählen, „Gewässer suchen“.
- Ergebnisliste nach Entfernung sortiert: Name, Typ, Entfernung, Fläche (ha) bzw. Länge (km), Button „Hinzufügen“ (danach „Hinzugefügt“)
- Filter-Chips nach Typ mit Anzahl (Alle, Fluss, Bach, Kanal, Teich, See, Talsperre)
- Trinkwassertalsperren werden markiert („Trinkwasser, Angeln meist verboten“)
- Umkreis ändern filtert die Ergebnisse sofort neu
- Hinweis unter der Liste: Ob Angeln erlaubt ist, steht nicht in den Daten → Link zum Angelatlas Sachsen

**Deine Gewässer:** Liste mit Typ, Entfernung, Gewässernummer, „im Umkreis“/„außerhalb“, letzte Wassertrübung mit Alter („Wasser: Stark trüb (heute)“), Button **„Wasser checken“** (siehe Wasser-Check), Entfernen. Darunter eingeklappt: „Gewässer nicht gefunden? Selbst anlegen“ (Name, Typ, Punkt auf der Karte, Gewässernummer optional).

**Technik der Suche:**
1. Ort → Koordinaten: Open-Meteo Geocoding (`countryCode=DE`) und nur Treffer mit `admin1 = Sachsen` zulassen. Ort außerhalb Sachsens: „Die App gibt es vorerst nur für Sachsen.“
2. Gewässer, Hauptquelle **amtliche Daten des LfULG** (Sächsisches Landesamt für Umwelt, Landwirtschaft und Geologie):
   - *Standgewässer Sachsen*: Polygone mit NAME, KATEGORIE (Talsperre, Speicher, Hochwasserrückhaltebecken, Bergbaufolgesee, Teich, Sonstiges), AREA_HA, NUTZUNG, ZUSTAND (z. B. „In Flutung“); Shapefile, ETRS89/UTM 33N (EPSG:25833)
   - *Gewässernetz Sachsen*: Fließgewässer mit Gewässerkennzahl, voll attributiert ab 10 km² Einzugsgebiet
   - Bezug: Datensätze sind in Geodatenkatalogen gelistet, ein offener Download-Link fehlt teils. Ansprechpartner laut Steckbrief: LfULG, Referat 45. Vor Nutzung Bezugsweg und Lizenz klären.
   - Nutzungsbedingung: Quellenangabe „Darstellung auf der Grundlage von Daten des Sächsischen Landesamtes für Umwelt, Landwirtschaft und Geologie“; keine Gewähr für Richtigkeit
   - Verarbeitung: einmalig in eine kompakte Datei umwandeln (GeoJSON, nach WGS84, Mittelpunkt + Fläche, Gewässer < 0,5 ha und Hochwasserrückhaltebecken weglassen), mit der App ausliefern, gelegentlich aktualisieren. Dann läuft die Suche offline und ohne Server.
3. Ergänzend/als Ausweichlösung: **OpenStreetMap** über Overpass (`natural=water` mit Namen, `waterway=river|canal` mit Namen, `around:<Radius>`), Flussabschnitte nach Namen zusammenfassen, kürzeste Entfernung zählt. Ergebnisse je Region zwischenspeichern (Fair-Use der Overpass-Server). Namensnennung „© OpenStreetMap-Mitwirkende, ODbL“.
4. **Angelerlaubnis:** Keine offene Quelle gefunden. Der Gewässerfonds des Landesverbands Sächsischer Angler steht nur im Angelatlas (geschützt), die Broschüre der Verbände ist „Alle Rechte vorbehalten“. Lösung: Link zum Angelatlas je Gewässer; Ziel für Phase 3: Liste der Verbandsgewässer (Gewässernummer, Name) mit Zustimmung des LVSA, dann Markierung „Verbandsgewässer“ in den Suchergebnissen.

### Angeln (Live-Modus und Fangbuch)
Hauptweg ist das Live-Mitloggen am Wasser, das nachträgliche Eintragen ist nur noch der Ausweg.

**Vor dem Start:** Gewässer und Zielfisch wählen, großer Button „Ich angle jetzt“. Darunter nur eine Textzeile zum Wasser („Wasser: Leicht trüb (heute)“ oder „Wasser noch nicht geprüft. Das geht im Tab „Gewässer““), kein eigener Button. Eine am Gewässer gespeicherte Trübung, die höchstens 2 Tage alt ist, wird beim Start automatisch übernommen.

**Fischart wählen:** Überall (Zielfisch, Fang, Nachtrag) über eine Auswahl mit **Suchfeld**, Abschnitte „Meine Fische“, „Süßwasser“, „Meer“, „Krebse und Sonstiges“, alphabetisch. Alternativnamen werden mitgesucht (z. B. Brachse → Brasse, Renke → Maräne, Flussbarsch → Barsch).

**Während des Angelns:**
- Laufende Uhr (Stunden:Minuten:Sekunden), aktueller Bisswert für dieses Gewässer
- Zähler: Bisse, Fische
- Zwei große Buttons, auch mit nassen Händen treffbar: „Biss“ (speichert nur den Zeitpunkt) und „Fisch gefangen“
- „Fisch gefangen“ öffnet ein kurzes Formular: Art (vorbelegt mit Zielfisch, alle Arten wählbar), Länge in cm, **Köder aus der Köderbox** (waagerechte Leiste mit Vorschaubildern: zuletzt benutzter Köder vorausgewählt, dann Lieblingsköder, dann der Rest; am Ende „+ Neuer Köder“; Freitext als Ausweg), Foto (Kamera oder Galerie), Haken „Zurückgesetzt“. Darunter steht der bisherige PB der Art. **Der Köder wird nur hier gewählt**, nicht beim Start, und Köderwechsel werden nicht mitgeloggt (Raubfischangler wechseln oft).
- Rückmeldung beim Speichern: „Neuer PB! Zander 64 cm (vorher 58 cm) · +15 Punkte“ und die PB-Animation (siehe Gamification)
- Vorschaubilder der Fänge dieser Session
- „Angeln beenden“ (zweiter Tipp zur Bestätigung) speichert den Angeltag mit Dauer, Bissen, Fängen und Wetter-Schnappschuss; „Verwerfen“ löscht die Session
- **Prognose-Feedback:** Direkt nach dem Beenden fragt die App „Hat die Vorhersage gestimmt? Der Bisswert lag bei 7,4.“ mit Ja / Teilweise / Nein / Überspringen (+2 Punkte). Gespeichert als `prognoseFeedback` am Angeltag; Grundlage für späteres Lernen pro Gewässer.
- Die Session läuft weiter, wenn die App geschlossen wird (Startzeit wird gespeichert). Auf allen anderen Tabs zeigt ein Balken über der Navigation: „Du angelst seit 1:23 h · 3 Bisse · 1 Fisch“, Tippen springt zurück.
- In der nativen Version später: laufende Session in der Benachrichtigungsleiste bzw. als Live-Aktivität auf dem Sperrbildschirm

**Angeltag nachtragen:** eigener Button direkt unter „Ich angle jetzt“ (nicht versteckt am Seitenende). Öffnet ein gegliedertes Formular mit „Schließen“:
- *Wann:* Datum, Beginn, Dauer
- *Wo und worauf:* Gewässer, Zielfisch
- *Ergebnis:* Bisse mit −/+ Tasten; „+ Fisch hinzufügen“ legt je Fisch eine Zeile an (Art, Länge, Köder aus der Köderbox, Foto, Entfernen). Ohne Fisch = Schneidertag, mit Hinweis auf die Extrapunkte.
- Speichern zeigt Punkte, neue PBs und Abzeichen; Einträge werden nach Datum einsortiert.

**Fangbuch-Liste:** Datum, Gewässer, Art, Dauer, Bisse, Längen, Vorschaubild, Markierung „PB“ am aktuellen Rekordfisch, „Schneider“ bei 0 Fängen. Löschen mit zweitem Tipp. Export/Import als JSON (inklusive Fotos).

**Fotos:**
- Vor dem Speichern verkleinern (lange Seite ca. 1200 px, JPEG ~75 %) und in IndexedDB ablegen, **nie in localStorage** (dort ist nach wenigen Bildern der Speicher voll; im Prototyp führte das zu verlorenen Fotos)
- Ein Foto lässt sich später nachreichen, z. B. direkt an der PB-Karte („Foto hinzufügen“)
- **Ortsdaten (EXIF/GPS) beim Verkleinern entfernen**, damit beim Teilen keine Fangplätze verraten werden
- Fotos werden im Prototyp über ein Canvas neu kodiert; dabei gehen die EXIF-Daten automatisch verloren. In der echten App genauso machen oder gezielt entfernen.
- Kamera-Zugriff über die normale Datei-Auswahl mit `accept="image/*"`; das Handy bietet dann Kamera oder Galerie an

### Erfolge
- Rang mit Fortschrittsbalken
- **Deine PBs:** eine Karte **nur für Arten, die schon gefangen wurden**, mit Foto des Rekordfischs, Länge in Gold, Datum, Gewässer und Anzahl Fänge. Sortiert nach Länge. Ohne Fänge ein kurzer Hinweis statt leerer Karten.
  - **Tippen öffnet die PB-Details** (Blatt von unten, schließen mit „Schließen“, Tippen daneben oder Escape): großes Foto, Foto hinzufügen/ändern, Länge, Datum, Uhrzeit, Gewässer, Köder, Dauer und Bisse des Angeltags, Fänge an dem Tag; Bedingungen beim Fang (Bisswert, Licht, Bewölkung, Wind, Luftdruck mit Trend, geschätzte Wassertemperatur, Lufttemperatur, Mond); „Deine Top 5“ der Art.
  - Fänge der **laufenden Session zählen sofort mit** (Markierung „läuft gerade“), nicht erst nach „Angeln beenden“
  - Gibt es von einer Art nur Fänge ohne Länge, zeigt die Karte den Fang mit Foto und „Länge fehlt“
  - Hat der PB kein Foto, gibt es auf der Karte „Foto hinzufügen“
- Abzeichen (freigeschaltet golden, gesperrt mit Fortschritt „3/5“)
- Mythen-Check (ab 20 Angeltagen freigeschaltet)
- Schalter „Mit Beispieldaten ansehen“, damit neue Nutzer sehen, worauf sie hinarbeiten

## 3. Bewertungsmodell (Bisswert)

Stündlich berechnet, je Gewässer und Fischart:

`Score = 10 × (0,40·Wasser + 0,22·Licht + 0,12·Bewölkung + 0,10·Wind + 0,11·Luftdruck + 0,05·Mond)`

Jeder Faktor liegt zwischen 0 und 1. Ein Zeitfenster ist der beste Durchschnitt aus 3 aufeinanderfolgenden Stunden. Jede Art hat ein eigenes Profil (Tabelle unten). Alle Werte gehören in eine Konfigurationsdatei (z. B. `src/data/arten.ts`).

### Faktoren
- **Wasser:** Trapezfunktion. 0 unter Minimum, linear steigend bis Optimum-Beginn, 1 im Optimum, linear fallend bis Maximum.
- **Licht:** Wert für Dämmerung (±75 min um Sonnenauf- und -untergang), Tag oder Nacht aus dem Profil.
- **Bewölkung:** 1 im idealen Bereich der Art, außerhalb pro 45 Prozentpunkte Abstand linear bis minimal 0,3. Nachts fest 0,85.
- **Wind:** 1 im idealen Bereich, außerhalb pro 14 km/h Abstand linear bis minimal 0,25. Über 35 km/h immer 0,1 plus Sturmwarnung. Zu wenig Wind heißt „glatte Oberfläche“, z. B. schlecht für Hecht.
- **Luftdruck** (Änderung über 12 h):

| Änderung | „mag fallenden Druck“ | „mag stabilen Druck“ |
|---|---|---|
| < −8 hPa (Warnung) | 0,70 | 0,40 |
| −8 bis −2 hPa | 0,95 | 0,60 |
| −2 bis +2 hPa | 0,65 | 0,90 |
| +2 bis +5 hPa | 0,50 | 0,65 |
| > +5 hPa | 0,35 | 0,45 |

- **Mond:** Neumond oder Vollmond 0,6, sonst 0,5. Bewusst kaum Einfluss.

### Begründung in der App
Unter dem Score stehen vier Zeilen, je Art formuliert, z. B. für Hecht:
- „Wasser ca. 13,4 °C – ideal“
- „Bewölkung 64 % – passt (ideal 30–80 %)“ bzw. „zu sonnig für Hecht“ / „zu trüb für Hecht“
- „Wind 12 km/h – leichte Wellen, passt für Hecht“ bzw. „zu ruhig, glatte Oberfläche“
- „Luftdruck fällt – vor Fronten oft aktiv“

Darunter das Kurzprofil „Typisch für Hecht: …“.

### Artenprofile

| Art | Schlüssel | Gruppe | Wasser °C (min / optimal / max) | Licht D / T / N | Bewölkung ideal | Wind ideal | Luftdruck |
|---|---|---|---|---|---|---|---|
| Hecht | `hecht` | Raubfische | 3 / 8–17 / 24 | 1 / 0,75 / 0,1 | 30–80 % | 8–22 km/h | mag fallenden Druck |
| Zander | `zander` | Raubfische | 6 / 12–22 / 28 | 1 / 0,35 / 0,85 | 60–100 % | 10–28 km/h | mag fallenden Druck |
| Barsch | `barsch` | Raubfische | 5 / 12–22 / 27 | 0,85 / 0,9 / 0,05 | 0–70 % | 3–18 km/h | mag fallenden Druck |
| Wels | `wels` | Raubfische | 12 / 20–28 / 32 | 0,7 / 0,25 / 1 | 50–100 % | 5–25 km/h | mag fallenden Druck |
| Aal | `aal` | Raubfische | 10 / 16–25 / 30 | 0,6 / 0,1 / 1 | 60–100 % | 0–15 km/h | mag fallenden Druck |
| Rapfen | `rapfen` | Raubfische | 6 / 12–22 / 27 | 1 / 0,8 / 0,05 | 0–60 % | 0–15 km/h | mag fallenden Druck |
| Quappe | `quappe` | Raubfische | 0 / 2–10 / 16 | 0,6 / 0,1 / 1 | 50–100 % | 0–20 km/h | mag fallenden Druck |
| Kaulbarsch | `kaulbarsch` | Raubfische | 4 / 10–20 / 25 | 0,9 / 0,7 / 0,4 | 40–100 % | 3–18 km/h | mag stabilen Druck |
| Schwarzbarsch | `schwarzbarsch` | Raubfische | 12 / 18–26 / 30 | 1 / 0,6 / 0,2 | 30–90 % | 3–15 km/h | mag fallenden Druck |
| Bachforelle | `forelle` | Forellen und Salmoniden | 3 / 8–15 / 19 | 1 / 0,6 / 0,35 | 50–100 % | 3–18 km/h | mag fallenden Druck |
| Regenbogenforelle | `regenbogen` | Forellen und Salmoniden | 4 / 10–17 / 21 | 0,9 / 0,75 / 0,2 | 40–100 % | 5–20 km/h | mag fallenden Druck |
| Seeforelle | `seeforelle` | Forellen und Salmoniden | 3 / 6–13 / 17 | 1 / 0,55 / 0,2 | 50–100 % | 10–28 km/h | mag fallenden Druck |
| Bachsaibling | `saibling` | Forellen und Salmoniden | 2 / 7–14 / 18 | 0,9 / 0,6 / 0,2 | 40–100 % | 3–18 km/h | mag fallenden Druck |
| Äsche | `aesche` | Forellen und Salmoniden | 3 / 8–15 / 19 | 0,8 / 0,9 / 0,05 | 20–80 % | 0–12 km/h | mag stabilen Druck |
| Huchen | `huchen` | Forellen und Salmoniden | 1 / 5–12 / 16 | 1 / 0,5 / 0,3 | 50–100 % | 0–20 km/h | mag fallenden Druck |
| Maräne | `maraene` | Forellen und Salmoniden | 2 / 6–12 / 16 | 0,9 / 0,6 / 0,4 | 30–90 % | 3–18 km/h | mag stabilen Druck |
| Karpfen | `karpfen` | Friedfische | 10 / 18–26 / 30 | 0,9 / 0,55 / 0,85 | 20–80 % | 8–25 km/h | mag stabilen Druck |
| Schleie | `schleie` | Friedfische | 10 / 18–25 / 29 | 1 / 0,4 / 0,6 | 50–100 % | 0–8 km/h | mag stabilen Druck |
| Brasse | `brasse` | Friedfische | 8 / 15–24 / 28 | 0,9 / 0,55 / 0,8 | 40–100 % | 5–20 km/h | mag stabilen Druck |
| Güster | `guester` | Friedfische | 8 / 15–24 / 28 | 0,9 / 0,6 / 0,6 | 30–90 % | 3–15 km/h | mag stabilen Druck |
| Rotauge | `rotauge` | Friedfische | 5 / 12–22 / 27 | 0,9 / 0,8 / 0,3 | 20–90 % | 3–15 km/h | mag stabilen Druck |
| Rotfeder | `rotfeder` | Friedfische | 10 / 17–25 / 29 | 0,8 / 0,9 / 0,2 | 0–60 % | 0–8 km/h | mag stabilen Druck |
| Aland | `aland` | Friedfische | 4 / 10–20 / 25 | 0,9 / 0,8 / 0,3 | 20–80 % | 3–15 km/h | mag stabilen Druck |
| Döbel | `doebel` | Friedfische | 5 / 12–22 / 27 | 0,9 / 0,85 / 0,4 | 10–80 % | 0–15 km/h | mag stabilen Druck |
| Barbe | `barbe` | Friedfische | 8 / 14–22 / 26 | 1 / 0,5 / 0,85 | 40–100 % | 0–15 km/h | mag stabilen Druck |
| Nase | `nase` | Friedfische | 6 / 12–20 / 24 | 0,7 / 0,9 / 0,1 | 0–70 % | 0–15 km/h | mag stabilen Druck |
| Karausche | `karausche` | Friedfische | 10 / 18–26 / 30 | 0,9 / 0,6 / 0,5 | 20–80 % | 0–8 km/h | mag stabilen Druck |
| Giebel | `giebel` | Friedfische | 10 / 17–26 / 30 | 0,9 / 0,7 / 0,4 | 20–80 % | 0–12 km/h | mag stabilen Druck |
| Graskarpfen | `graskarpfen` | Friedfische | 14 / 20–28 / 32 | 0,8 / 0,8 / 0,5 | 0–60 % | 0–12 km/h | mag stabilen Druck |
| Hasel | `hasel` | Friedfische | 5 / 11–20 / 25 | 0,8 / 0,9 / 0,1 | 10–80 % | 0–12 km/h | mag stabilen Druck |
| Ukelei | `ukelei` | Friedfische | 10 / 16–24 / 28 | 0,8 / 0,95 / 0,05 | 0–60 % | 0–10 km/h | mag stabilen Druck |

**Kurzprofile (werden in der App als „Typisch für …“ angezeigt):**

- **Hecht:** Leicht bewölkt mit Sonnenlücken und Wind, der die Oberfläche kräuselt. Vor Gewittern oft aktiv, bei Sonne und Spiegelglätte zäh.
- **Zander:** Dämmerung, Nacht und trübes Licht. Wind mit Wellen und eingetrübtes Wasser helfen: Zander sehen bei wenig Licht besser als ihre Beute.
- **Barsch:** Tagaktiver Augenjäger. Sonne stört kaum, leichter Wind reicht. Nachts fast keine Aktivität.
- **Wels:** Nachts und bei warmem Wasser. Schwüles Wetter vor Gewittern gilt als beste Zeit.
- **Aal:** Dunkle, warme Nächte, gern nach Regen bei steigendem und leicht trübem Wasser.
- **Rapfen:** Jagt an der Oberfläche, vor allem morgens und abends. Ruhiges, klares Wetter macht die Jagd sichtbar.
- **Quappe:** Kältefreund: am aktivsten in langen Winternächten bei sehr kaltem Wasser.
- **Kaulbarsch:** Bodennah im Schwarm, gern bei trübem Licht.
- **Schwarzbarsch:** Warmes Wasser, Dämmerung, gern bewölkt. Steht an Kraut und Holz.
- **Bachforelle:** Bedeckter Himmel und leichter Nieselregen bringen Insekten und machen sie mutiger. Grelle Sonne macht sie scheu.
- **Regenbogenforelle:** Weniger scheu als die Bachforelle und auch tagsüber gut zu fangen.
- **Seeforelle:** Kaltes Wasser, Wind auf der Oberfläche, trübes Licht.
- **Bachsaibling:** Kaltes, sauerstoffreiches Wasser, bewölkte Tage.
- **Äsche:** Tagaktiv, steigt beim Insektenschlupf. Ruhiges Wetter mit wenig Wind ist ideal.
- **Huchen:** Winterfisch: kaltes Wasser, trübes Licht, oft bei Wetterumschwung.
- **Maräne:** Kaltes, tiefes Freiwasser, am besten in der Dämmerung.
- **Karpfen:** Warmes, stabiles Wetter. Warmer Wind aufs Ufer treibt Nahrung dorthin, die Karpfen folgen.
- **Schleie:** Warme, windstille Morgen am Krautrand. Bläschenteppiche verraten sie.
- **Brasse:** Schwarmfisch, gern bei bedecktem Himmel und leichtem Wind, abends und nachts.
- **Güster:** Ähnlich wie die Brasse, etwas tagaktiver.
- **Rotauge:** Fast immer zu fangen. Stabiles Wetter und leichter Wind sind ideal.
- **Rotfeder:** Sonnige, warme, ruhige Tage dicht unter der Oberfläche.
- **Aland:** Fließgewässer, oft nah an der Oberfläche. Mildes, stabiles Wetter.
- **Döbel:** Vorsichtiger Allesfresser an Strömungskanten. Beißt fast das ganze Jahr.
- **Barbe:** Bodenfisch in der Strömung. Dämmerung, Nacht und leicht trübes Wasser.
- **Nase:** Tagaktiv, weidet Algen von Steinen. Klares, ruhiges Wetter.
- **Karausche:** Warme, stille Kleingewässer, ruhiges Wetter.
- **Giebel:** Robust und wärmeliebend, ruhiges Wetter.
- **Graskarpfen:** Sehr warmes Wasser und sonnige Tage. Frisst Pflanzen nahe der Oberfläche.
- **Hasel:** Kleiner, tagaktiver Strömungsfisch.
- **Ukelei:** Oberflächenschwarm an sonnigen, ruhigen Tagen.

### Wie belastbar sind die Werte?
- **Gut belegt:** Wassertemperatur als Haupttreiber; Hecht als Augenjäger, dessen Beutefindung bei Trübung durch Lichtstreuung sinkt (Nilsson et al., Universität Lund); Zander bevorzugt schwaches Licht (in Aufzuchtversuchen wuchsen junge Zander bei wenig Licht besser) und lebt natürlicherweise in trüben Gewässern; Aal, Wels und Quappe nachtaktiv; Barsch, Äsche und Ukelei tagaktiv.
- **Erfahrungswissen von Anglern:** ideale Bewölkung und idealer Wind je Art (z. B. Hecht: bewölkt mit etwas Wind und Schauern, Sonne mit Windstille oft zäh), Reaktion auf Luftdruck, Mond.
- Deshalb: Werte als Startwerte behandeln und mit dem Mythen-Check an den eigenen Fängen prüfen. Langfristig können die Gewichte pro Nutzer nachgeschärft werden.

## 4. Hilfsmodelle

### Wassertemperatur (Schätzung)
Exponentielle Glättung der Tagesmittel der Lufttemperatur der letzten 14 Tage:
`W(t) = W(t−1) + (Luft(t) − W(t−1)) · (1 − e^(−1/τ))` plus Versatz.

| Typ | τ (Tage) | Versatz (°C) |
|---|---|---|
| Fluss | 4 | 0 |
| Bach | 3 | −0,5 |
| Kanal | 6 | +0,2 |
| Teich | 4 | +0,3 |
| See | 9 | +0,5 |
| Talsperre | 14 | +0,8 |

Startwert: erstes Tagesmittel + 1,5 °C. Anzeige immer mit „geschätzt, ±2 °C“. Phase 2: Wo eine Messstelle in der Nähe ist (Pegelonline), echte Wassertemperatur verwenden.

### Mondphase
Alter in Tagen = (Zeit − 6.1.2000 18:14 UTC) mod 29,530588853. Gruppen: Neumond (< 1,85 oder > 27,68), zunehmend, Vollmond (12,92–16,61), abnehmend. Beleuchtung = (1 − cos(2π·Alter/29,53)) / 2.

### Sonnenauf- und -untergang
Aus Breiten- und Längengrad des Gewässers (Formel im Prototyp) oder direkt aus Open-Meteo (`daily=sunrise,sunset`), was vorzuziehen ist.

## 5. Regeln für Sachsen (Schonzeiten, Mindestmaße)
Quelle: **Sächsische Fischereiverordnung (SächsFischVO) vom 22.04.2022, gültig ab 1.6.2022.** Als amtliches Werk frei verwendbar. In eine Datei `src/data/regeln-sachsen.ts` legen, mit Stand-Datum, und jährlich prüfen.

| Art | Schonzeit | Mindestmaß | Besonderheit |
|---|---|---|---|
| Aal | – | 50 cm | |
| Aland | – | 20 cm | |
| Äsche | 1. Jan. – 15. Juni | 35 cm | |
| Bachforelle | 1. Okt. – 30. Apr. | 28 cm | |
| Bachsaibling | 1. Okt. – 30. Apr. | 25 cm | |
| Barbe | 15. Apr. – 30. Juni | 50 cm | |
| Große Maräne | 1. Okt. – 31. Dez. | 30 cm | |
| Hecht | 1. Feb. – 30. Apr. | 50 cm | |
| Karausche | 1. Feb. – 30. Juni | 15 cm | |
| Karpfen | – | 40 cm | |
| Nase | ganzjährig | – | Elbe: 1. Jan. – 15. Juni, 40 cm |
| Quappe | ganzjährig | – | Elbe, Vereinigte Mulde, Weiße Elster: 1. Jan. – 31. März, 30 cm |
| Rapfen | 1. Jan. – 31. Mai | 40 cm | |
| Regenbogenforelle | 1. Okt. – 30. Apr. | 25 cm | Schonzeit nur in Fließgewässern |
| Rotfeder | – | 20 cm | nur in Fließgewässern |
| Schleie | – | 25 cm | |
| Seeforelle | 1. Okt. – 30. Apr. | 60 cm | |
| Zander | 1. Feb. – 31. Mai | 50 cm | |

Weitere Arten aus der Verordnung: Lachs und Meerforelle 1. Okt. – 30. Apr., 60 cm; Seesaibling 1. Okt. – 30. Apr., 28 cm.

Ganzjährig geschont u. a.: Bitterling, Elritze, Groppe, Schlammpeitzger, Schmerle, Schneider, Steinbeißer, Stör, Zährte, Zope, Neunaugen, Edelkrebs, Muscheln. Für Barsch, Wels, Döbel, Brasse, Rotauge, Güster, Giebel, Graskarpfen, Hasel, Ukelei, Kaulbarsch, Schwarzbarsch regelt die Verordnung nichts.

Weitere Regeln (§ 4–6): Vom 1. Feb. bis 30. Apr. ist das Angeln mit Raubfischködern verboten. Höchstens 2 Handangeln, beim Spinn- oder Fliegenfischen nur 1, ständig beaufsichtigen. Köderfische vorher waidgerecht töten, lebende Köderfische verboten. Keine Fangbegrenzung in der Verordnung.

Achtung: Ältere Fassungen (z. B. 2007) und manche Webseiten nennen andere Werte (z. B. Zander bis 30. April, Aal 40 cm). Maßgeblich ist die Fassung von 2022.

**Anzeige in der App:**
- *Zielfisch beim Start* (Live-Modus): **nur zwei Werte**, „Mindestmaß 50 cm“ und „Schonzeit 1. Feb. – 31. Mai“ (gewässerabhängig, z. B. Elbe), aktualisiert bei Wechsel von Art oder Gewässer. Keine allgemeinen Regeln, keine Verordnungstexte. Ist die Art gerade geschont, ist die Zeile rot und der Start-Button braucht einen zweiten Tipp („Verstanden, trotzdem starten“).
- *Während des Angelns:* Zeile „Mindestmaß Zander: 50 cm“ bzw. rot „ist geschont – Fänge sofort zurücksetzen“.
- *Beim Fang:* Hinweis **nur**, wenn der Fisch geschont oder untermaßig ist: „nicht erlaubt, sofort schonend zurücksetzen“, Haken „Zurückgesetzt“ wird automatisch gesetzt (bleibt änderbar). Zurückgesetzte Fische zählen trotzdem für Statistik und PB.
- *Heute:* roter Punkt am Chip einer geschonten Art, kompakte rote Regelzeile über dem Score.
- Allgemeine Regeln (2 Handangeln, Köderfische) und der Satz „Die Gewässerordnung deines Vereins oder Pächters kann strenger sein.“ einmal in den Einstellungen bzw. der Info-Seite, nicht bei jedem Start.

## 6. Wasser-Check und Köderfarbe

**Neu in Version 11:** Der Wasser-Check gilt **allgemein, nicht je Gewässer**. Er steht im Tab „Gewässer“ ganz unten, unter der Gewässersuche und „Deine Gewässer“, wird 2 Tage gemerkt und beim Angeln automatisch übernommen (im Live-Start Link „Wasser-Check“ bzw. „ändern“). Sobald eine Trübung gewählt ist, erscheinen sofort: Köderfarben, ein Absatz **Dekor** (z. B. stark trüb: grell oder ganz schwarz, größer, großer Schaufelschwanz), drei **Beispiel-Dekore von Nays (VNM)** als eigene Zeichnung mit Code und Kurzbeschreibung, Link zu naysbaits.com, und „So fischst du jetzt“ (Führung, Tiefe, Druckwelle). Zuordnung: klar C-01, C-14, C-05 · leicht trüb C-12, C-02, C-07 · stark trüb C-07, C-06, C-04 · Moorwasser C-06, C-13, C-07 · Dämmerung/Nacht zusätzlich C-04 vorne. Codes laut Hersteller, Zuordnung nach unseren Faustregeln, **keine Herstellerempfehlung**. Keine Produktfotos von Nays übernehmen (Urheberrecht), nur eigene Zeichnungen und Link; echte Bilder nur mit Erlaubnis von Nays. Das Foto zur Erkennung ist optional (eingeklappt).

**Ort in der App: Tab „Gewässer“**, Button „Wasser checken“ bei jedem Gewässer. Ergebnis wird **am Gewässer** gespeichert (`truebung: {wert, zeitpunkt}`) und beim Start einer Session übernommen, wenn es höchstens 2 Tage alt ist. Läuft gerade eine Session an diesem Gewässer, wird sie sofort aktualisiert. Im Tab „Angeln“ nur eine Textzeile, kein Button.
1. **Foto vom Wasser** (schräg von oben ins flache Uferwasser, ohne Himmelsspiegelung). Die App wertet den mittleren Bildbereich auf dem Gerät aus (kein Upload): Durchschnittsfarbe → Farbton, Sättigung, Helligkeit.
   - kaum Sättigung: hell → stark trüb (milchig), dunkel → klar
   - Farbton 15–55° (braun): hell → stark trüb (lehmig), dunkel → Moorwasser
   - Farbton 55–170° (grün): kräftig → stark trüb (Algen), schwach → leicht trüb
   - sonst (bläulich) → klar
   Das ist nur eine grobe Schätzung. Deshalb kann der Nutzer immer selbst wählen.
2. **Manuelle Wahl** über die Sichttiefe: Klar (über 1 m), Leicht trüb (30 cm – 1 m), Stark trüb (unter 30 cm), Moorwasser (tee- bis braunfarben).
3. **Empfehlung** (Faustregeln aus der Angelpraxis, als solche kennzeichnen):
   - Klar: Barsch-Dekor, Weißfisch/Silber, Transparent
   - Leicht trüb: Weiß/Perlmutt, Chartreuse, Firetiger
   - Stark trüb: Chartreuse, Gelb/Orange, Firetiger; Druckwelle und Rassel wichtiger als Farbe
   - Moorwasser: Gold/Kupfer, Gelb/Orange, Chartreuse
   - Dämmerung/Nacht: Schwarz/dunkle Silhouette und UV/Glow vorziehen
   - Immer: Rot verschwindet ab ca. 3 m Tiefe; Kontrast zum Grund wählen
4. **Passt jetzt aus deiner Köderbox:** Köder, deren Farbfamilie zu den empfohlenen Farben gehört, als Leiste mit Bildern.
5. **Persönlich:** ab 3 Fängen mit Köderfarbe bei gleicher Trübung: „Bei stark trübem Wasser kamen 7 von 9 Fängen auf Chartreuse.“ Sonst ab 2 Fängen der häufigste Köder. Immer mit dem Hinweis: „Zeigt, womit du gefangen hast, nicht welche Farbe besser ist: Was man oft fischt, fängt auch öfter.“
6. Die Trübung wird mit dem Angeltag gespeichert (`wetter.truebung`, dazu `wasserCheck: true`, wenn sie aus einem Wasser-Check stammt) und fließt in Mythen-Check und Köder-Auswertung ein. Beim Nachtragen gibt es ein Auswahlfeld „Wasser“.

**Erfolge → „Was bei dir fängt“:** je Trübung die häufigste Köderfarbe als Anteil („9 von 12 Fängen auf Chartreuse“) und der häufigste Köder, mit dem Hinweis oben.

## 7. Köderbox
- Panel „Meine Köderbox“ im Tab „Angeln“ unter dem Fangbuch (nicht im Live-Bereich). Raster mit freigestellten Köderbildern, Lieblingsköder zuerst (Stern), je Köder Farbfamilie und Anzahl Fänge.
- **Köder anlegen/bearbeiten** (Blatt von unten): Foto, Name (Vorschlag aus Typ + Farbe, wenn leer), Ködertyp (Gummifisch, Wobbler, Spinner, Blinker, Jig, Naturköder, Fliege, Sonstiges), Farbfamilie, Lieblingsköder. Beim Bearbeiten: Fänge, Arten, größter Fisch mit diesem Köder; Löschen mit zweitem Tipp.
- **Freistellen** (auf dem Gerät): Randfarbe des Fotos bestimmen; ist der Rand gleichmäßig (einfarbiger Untergrund), werden ähnliche Pixel transparent (weicher Übergang), dann auf das Motiv zugeschnitten und als quadratisches PNG (320 px) gespeichert. Klappt es nicht (unruhiger Hintergrund, zu wenig oder zu viel Motiv): quadratischer Zuschnitt und Hinweis „auf hellem, einfarbigem Untergrund fotografieren; auf dem iPhone geht auch ‚Motiv freistellen‘ in der Fotos-App“. Umschalter „Original / Freigestellt“. Später besser: KI-Freisteller im Browser (Lizenz prüfen) bzw. iOS Vision / Android ML Kit in der Store-Version.
- **Farberkennung**: auf den nicht transparenten Pixeln Farbton/Sättigung/Helligkeit zählen und einer Farbfamilie zuordnen (Natur/Barsch-Dekor, Weißfisch/Silber, Weiß/Perlmutt, Chartreuse, Gelb/Orange, Firetiger, Gold/Kupfer, Motoroil/Braun, Schwarz/Dunkel, Rot/Pink, Transparent). Anzeige „erkannt: …“, immer änderbar. Bei bunten Dekoren unsicher.
- Jeder Fang speichert `koederId`, `koeder` (Name) und `koederFarbe`; zuletzt benutzter Köder wird gemerkt.

## 8. Pegel (nur Fließgewässer)
- Nur für Gewässer vom Typ Fluss oder Bach. **Nur Hinweis, fließt nicht in den Score ein.**
- Anzeige unter „Heute“: Zeile in den Gründen („Pegel fällt nach erhöhtem Wasserstand“) und im Gewässer-Detail ein Kasten mit Wasserstand, Trend und Einordnung je Art:
  - fallend nach erhöhtem Pegel: gilt als gute Zeit, besonders für Raubfische an Buhnen und Strömungskanten
  - leicht steigend, trüb: bringt Aal, Zander, Wels, Barbe, Quappe oft in Ufernähe; für andere Arten eher unruhig
  - normal: keine Besonderheit
  - Hochwasser: Warnung, nicht ans Wasser
- Quellen: **Pegelonline** (Wasserstraßen- und Schifffahrtsverwaltung des Bundes, frei, REST-API) für die Elbe; **Landeshochwasserzentrum Sachsen** für die übrigen Flüsse (Nutzungsbedingungen vorher klären). Gewässer beim Anlegen der nächstgelegenen Messstelle zuordnen. Wo eine Messstelle Wassertemperatur liefert, ersetzt sie die Schätzung.

## 9. Persönlicher Bisswert (lernt aus deinen Daten)
- Aktiv ab **10 Angeltagen** mit dieser Art (Zielfisch oder Fang). Davor: Fortschritt „3 von 10“ und Button „Beispiel ansehen“ mit erfundenen Daten.
- Für das beste Zeitfenster werden die Bedingungen in Gruppen eingeteilt: Luftdruck (fallend/stabil/steigend), Licht (Dämmerung/Tag/Nacht), Bewölkung (klar/wechselnd/bedeckt). Später auch Trübung und Pegel.
- Je Faktor mit mindestens 3 passenden Angeltagen: Verhältnis = Fangquote (Fische/Stunde) in dieser Gruppe ÷ deine Gesamtfangquote, begrenzt auf 0,4–2,5.
- Persönlicher Faktor = geometrisches Mittel der Verhältnisse. Gewicht w = min(0,5; Angeltage/60).
  `persönlich = allgemein × (1 − w) + min(10; allgemein × Faktor) × w`
- Anzeige: Score = persönlicher Wert, darunter „Allgemein 7,2 · an deine Fänge angepasst +0,9“. Kasten „Das sagen deine Daten“ mit der stärksten Aussage, z. B. „Bei fallendem Luftdruck fängst du 2,1× so viele Zander pro Stunde wie im Schnitt (8 Angeltage)“, und bis zu 2 **ähnlichen Tagen** (mindestens 2 von 3 Bedingungen gleich, mit Fang): „Ähnlicher Tag: 12. Sep. · Elbe · 3 Zander in 4 h“.
- Nach jedem Angeltag die Frage „Hat die Vorhersage gestimmt?“ (Ja / Teilweise / Nein, +2 Punkte).
- **Lernen pro Gewässer** (Phase 1): erst ab **mindestens 10 Angeltagen an diesem Gewässer** (egal welche Art). Davor nichts anpassen, nur Fortschritt „4 von 10 Angeltagen an der Elbe“.
  - Ab 10 Tagen: Gewässer-Faktor = eigene Fangquote an diesem Gewässer ÷ eigene Gesamtfangquote, begrenzt auf 0,6–1,6, plus Korrektur aus dem Prognose-Feedback (Anteil „Nein“ bei hohem Bisswert senkt, Anteil „Ja“ bei mittlerem Bisswert hebt, je höchstens ±10 %).
  - Gewicht wie beim persönlichen Bisswert, aber eigene Zählung: w = min(0,4; Angeltage am Gewässer/50).
  - Gewässer-Faktor wirkt zusätzlich zum persönlichen Faktor; Ergebnis bleibt auf 0–10 begrenzt.
  - Anzeige: „An der Elbe fängst du 1,4× so gut wie im Schnitt (14 Angeltage)“ und im Score-Hinweis „angepasst an deine Fänge und dieses Gewässer“.
- Ehrlichkeit: Bei wenigen Daten nichts behaupten; Aussagen immer mit Anzahl Angeltage.

## 10. Fischartenliste
Vom Nutzer vorgegebene Liste (160 Einträge). Alle sind beim Fang und als Zielfisch wählbar. **Eine Vorhersage (Bisswert, Top 5) gibt es nur für die 31 Arten mit Profil** (Abschnitt Artenprofile). Schlüssel = Name in Kleinbuchstaben, Umlaute ausgeschrieben, Sonderzeichen als „-“ (z. B. `groppe-koppe`); die Profilarten behalten ihre Schlüssel (Brachse → `brasse`, Flussbarsch → `barsch`, Renke → `maraene`, Bachforelle → `forelle`, Regenbogenforelle → `regenbogen`, Äsche → `aesche`).

- **Süßwasser:** Aal, Aland, Afrikanischer Raubwels, Amur-Schläfergrundel, Arapaima, Bachforelle, Bachneunauge, Bachsaibling, Bachschmerle, Barbe, Bitterling, Blaubandbärbling, Brachse, Donau-Neunauge, Donaukaulbarsch, Dreistachliger Stichling, Döbel, Elritze, Elsässer Saibling, Flussbarsch, Flussgrundel, Flussneunauge, Forellenbarsch, Frauennerfling, Giebel, Goldfisch, Goldforelle, Goldorfe, Graskarpfen, Groppe (Koppe), Gründling, Güster, Hasel, Hecht, Huchen, Karausche, Karpfen, Kaulbarsch, Kessler-Grundel, Kilch, Lachs, Maifisch, Mairenke, Marmorataforelle, Marmorierte Grundel, Marmorkarpfen, Meerforelle, Moderlieschen, Nase, Neunstachliger Stichling, Nordseeschnäpel, Ostseeschnäpel, Perlfisch, Quappe, Rapfen, Regenbogenforelle, Renke, Rotauge, Rotfeder, Schlammpeitzger, Schleie, Schneider, Schrätzer, Schwarzbarsch, Schwarzer Amur, Schwarzmund-Grundel, Seeforelle, Seesaibling, Sonnenbarsch, Steinbeißer, Sterlet, Stint, Stör, Strömer, Tigerforelle, Ukelei, Wels, Wolgazander, Zander, Ziege, Zingel, Zobel, Zope, Zwergwels, Zährte, Äsche
- **Meer:** Aalmutter, Amberjack, Barrakuda, Barramundi, Blauleng, Bonito, Butterfisch, Dorade, Dornhai, Dorsch, Drachenkopf, Finte, Fleckhai, Flunder, Glattbutt, Glatthai, Goldmakrele, Heilbutt, Hering, Hornhecht, Hundshai, Katzenhai, Kliesche, Klippenbarsch, Knurrhahn (Grauer), Knurrhahn (Roter), Köhler, Leng, Lippfisch, Lumb, Makrele, Marlin, Meeraal, Meerneunauge, Meeräsche, Muräne, Nagelrochen, Petermännchen, Pollack, Rotbarbe, Rotbarsch, Sandaal, Sardine, Scheibenbauch, Schellfisch, Scholle, Schriftbarsch, Seehase, Seehecht, Seequappe (dreibärtelig), Seequappe (vierbärtelig), Seerüßling, Seeskorpion, Seeteufel, Sprotte, Steinbutt, Streifenbarbe, Streifenbarsch, Tarpun, Thunfisch, Tobiasfisch, Wittling, Wolfsbarsch
- **Krebse und Sonstiges:** Dohlenkrebs, Edelkrebs, Galizischer Sumpfkrebs, Hummer, Kamberkrebs, Roter amerikanischer Sumpfkrebs, Steinkrebs, Strandkrabbe, Taschenkrebs, Wollhandkrabbe, Sonstiges

Hinweis: Zwischen „Seeteufel“ und „Sonnenbarsch“ fehlte in den Bildschirmfotos ein Ausschnitt (möglicherweise z. B. Seezunge, Signalkrebs). Vom Nutzer bestätigen lassen.

## 11. Logo, Farben, Schrift
**Logo:** Wortmarke BISSFIBEL in Barlow Condensed ExtraBold (800). Das „I“ von FIBEL ist ein **gelbes Maßband** (`#F2C230`) mit cm-Strichen (jeder vierte lang), grauer Endkappe und rotem Marker in Posenrot. Das „I“ von BISS ist eine **senkrechte Fischgräte** in Flusswasser, der Kopf oben bildet den i-Punkt. „B“ und „SSF“ in Tiefwasser, „BEL“ in Flusswasser. Kein separates Zeichen davor. App-Symbol: abgerundetes Quadrat in Flusswasser mit heller Fischgräte, deren **Rückgrat das Maßband** ist, roter Marker darauf. Dateien im Paket unter `assets/` (SVG); **Text dort vor dem Einsatz in Pfade umwandeln**, damit die Schrift nicht nachgeladen werden muss. Die Score-Anzeige in der App bleibt eine Pegellatte.

**Farben „Wasser und Pose“** (als CSS-Variablen, Hell- und Dunkelmodus):
| Rolle | Hell | Dunkel |
|---|---|---|
| Hintergrund (Uferlicht / Nachtwasser) | `#EEF2EF` | `#0B1A1C` |
| Karten (Gischt) | `#F9FBF9` | `#13272A` |
| Text (Tiefwasser) | `#0E3B43` | `#E4ECE8` |
| Nebentext | `#4A5D57` | `#94A49D` |
| Linien | `#D2DCD6` | `#24383B` |
| Hauptfarbe (Flusswasser) | `#1F6F78` | `#6CB9B4` |
| Hinweisflächen (Flachwasser) | `#DCEBEA` | `#183330` |
| Akzent (Posenrot): Marker, Alarm | `#E8552B` | `#F26B3A` |
| Buttons mit Schrift | `#C8431E`, Schrift weiß | `#F26B3A`, Schrift `#0B1A1C` |
| Pokalgold: PBs, Abzeichen | `#B8862B` | `#E2B656` |
| Status gut / mittel / schwach | `#2E7D4F` / `#B7791F` / `#B23A3A` | `#5BBF84` / `#E0A84A` / `#E07070` |
Weiße Schrift auf dem hellen Posenrot `#E8552B` ist zu kontrastarm, deshalb das dunklere Button-Rot.

**Schrift:** Barlow Condensed (Logo, Zahlen, Überschriften), Public Sans (Text), IBM Plex Mono (Zahlenwerte in Listen). Alle über Google Fonts, in der App lokal einbinden (offline).

## 12. Datenmodell

```ts
type Gewaesser = { id: string; name: string; typ: 'fluss'|'bach'|'kanal'|'teich'|'see'|'talsperre';
  lat: number; lon: number; gewaessernummer?: string;
  truebung?: { wert: 'klar'|'leicht'|'trueb'|'braun'; zeitpunkt: number } };

type Koeder = { id: string; name: string; typ: string; farbe?: Farbfamilie;
  lieblingskoeder: boolean; fotoId?: string };   // freigestelltes PNG in IndexedDB

type Einstellungen = { wohnort: { name: string; lat: number; lon: number };
  umkreisKm: number; fischart: Fischart;
  topFische: Fischart[];   // max. 5, Reihenfolge = Reihenfolge der Chips
  topFischeGewaehlt: boolean };

type Artprofil = { name: string; gruppe: 'raub'|'salmo'|'fried';
  wasser: [number, number, number, number]; licht: [number, number, number];
  bewoelkung: [number, number]; wind: [number, number]; druck: 'front'|'stabil'; tipp: string };

type Angeltag = { id: string; datum: string; beginn: string; dauerH: number;
  gewaesserId: string; zielfisch: Fischart; live: boolean;
  bisse: number;            // Anzahl; im Live-Modus zusätzlich Zeitpunkte möglich
  fänge: Fang[];            // leer = Schneidertag
  wasserCheck?: boolean; prognoseFeedback?: 'ja'|'teils'|'nein';
  wetter: WetterSchnappschuss };

type Fang = { id: string; zeit: number; fischart: Fischart; laengeCm?: number;
  koeder?: string; koederId?: string; koederFarbe?: Farbfamilie;
  fotoId?: string;   // Verweis auf Foto in IndexedDB
  zurueckgesetzt?: boolean;
  score: number };                    // Bisswert zum Fangzeitpunkt (für „Alarm-Treffer“)

type LaufendeSession = { start: number; gewaesserId: string; zielfisch: Fischart;
  bisse: number[]; fänge: Fang[]; truebung?: 'klar'|'leicht'|'trueb'|'braun' };   // wird sofort gespeichert, übersteht App-Neustart

type WetterSchnappschuss = { regenWahrscheinlichkeit?: number; luftdruckTrend: 'fallend'|'stabil'|'steigend';
  luftdruckHpa: number; bewoelkung: 'klar'|'wechselnd'|'bedeckt'; windKmh: number;
  licht: 'daemmerung'|'tag'|'nacht'; mond: 'Neumond'|'zunehmend'|'Vollmond'|'abnehmend';
  wasserTempGeschaetzt: number; score: number;
  truebung?: 'klar'|'leicht'|'trueb'|'braun'; pegelTrend?: 'fallend'|'steigend'|'normal'|'hoch' };
```

Grenzen der Gruppen: Druck fallend < −2 hPa/12 h, steigend > +2; bewölkt > 70 %, klar < 30 %.
Für Einträge in der Vergangenheit holt die App das Wetter über die Archiv-/Vergangenheitsdaten von Open-Meteo.

## 13. Gamification

**Punkte** (werden aus Fangbuch und Köderbox berechnet, nicht gespeichert; nie für Fischmenge):
| Ereignis | Punkte |
|---|---|
| Angeltag mit Fang | 10 |
| Schneidertag | 15 |
| Live mitgeloggt (statt nachträglich) | +5 |
| Wasser-Check für den Angeltag | +3 |
| Prognose bewertet | +2 |
| Köder beim Fang eingetragen | +2 je Fang |
| Fangfoto | +2 je Fang |
| Köder mit Foto in der Köderbox | +2 je Köder |
| Erste gefangene Fischart | +25 |
| Fang in einem Alarm-Fenster (Score ≥ 7) | +20 (einmal pro Angeltag) |
| Neuer PB einer Art | +15 |

**Ränge** (bei ca. 35–40 Angeltagen pro Jahr):
| Rang | Name | ab Punkte | ca. Angeltage |
|---|---|---|---|
| 1 | Wurmbader | 0 | 0 |
| 2 | Stippfischer | 100 | 3 |
| 3 | Uferläufer | 250 | 7 |
| 4 | Petrijünger | 500 | 15 |
| 5 | Gewässerkenner | 900 | 30 (Ende 1. Saison) |
| 6 | Uferprofi | 1.500 | 55 |
| 7 | Fischflüsterer | 2.400 | 95 |
| 8 | Wetterversteher | 3.600 | 150 |
| 9 | Altmeister | 5.000 | 210 |
| 10 | Petri-Legende | 7.000 | 300 |

**Animationen** (Overlay, Tippen schließt, nach 4 s automatisch; Warteschlange, wenn mehrere gleichzeitig):
- *Neuer PB:* Pokal mit Strahlen, „Neuer PB“, Länge groß in Gold, Art und vorheriger PB, darunter ein **Maßband**, das bis zur Länge aufläuft.
- *Rangaufstieg:* Rangabzeichen mit Nummer, „Neuer Rang“, Rangname, Punktestand.
- Bei „Bewegung reduzieren“ nur Einblenden.

**Abzeichen:**
| Abzeichen | Bedingung |
|---|---|
| Erster Wurf | 1 Angeltag |
| Ehrlicher Angler | 5 Schneidertage |
| Frühaufsteher | 5 Angeltage in der Dämmerung |
| Nachteule | 5 Angeltage nachts |
| Artenkenner | 3 verschiedene Arten gefangen |
| Treffsicher | 3 Fänge im Alarm-Fenster |
| Bissanzeiger | 50 Bisse protokolliert |
| Fotobeweis | 10 Fänge mit Foto |
| Farbenlehre | 10 Köder fotografiert |
| Köderflüsterer | mit 5 verschiedenen Ködern gefangen |
| Stammgast | 10 Angeltage am selben Gewässer |
| Entdecker | 5 verschiedene Gewässer |
| Mythenjäger | 20 Angeltage, schaltet den Mythen-Check frei |

**Abzeichen in Stufen** (Phase 1): Jedes zählbare Abzeichen hat Bronze, Silber und Gold. Bronze ist der Wert aus der Tabelle oben, Silber etwa das Dreifache, Gold etwa das Zehnfache, zum Beispiel:
| Abzeichen | Bronze | Silber | Gold |
|---|---|---|---|
| Erster Wurf (Angeltage) | 1 | 25 | 100 |
| Ehrlicher Angler (Schneidertage) | 5 | 15 | 40 |
| Frühaufsteher / Nachteule | 5 | 15 | 40 |
| Artenkenner (Arten) | 3 | 8 | 15 |
| Treffsicher (Fänge im Alarm-Fenster) | 3 | 10 | 30 |
| Bissanzeiger (Bisse) | 50 | 200 | 750 |
| Fotobeweis (Fänge mit Foto) | 10 | 40 | 150 |
| Farbenlehre (Köderfotos) | 10 | 25 | 60 |
| Köderflüsterer (Köder mit Fang) | 5 | 12 | 25 |
| Stammgast (Angeltage an einem Gewässer) | 10 | 30 | 75 |
| Entdecker (Gewässer) | 5 | 12 | 25 |
| Wetterfest (Angeltage bei fallendem Druck und bedecktem Himmel) | 3 | 10 | 25 |
Mythenjäger bleibt einstufig. Anzeige: Medaille in Bronze/Silber/Gold, darunter Fortschritt zur nächsten Stufe („12 von 25“). Jede neue Stufe +10 Punkte und kurze Animation wie beim Rangaufstieg.

**Saisonziele** (Phase 1): Je Jahreszeit (Frühling März–Mai, Sommer Juni–Aug., Herbst Sep.–Nov., Winter Dez.–Feb.) drei Ziele, die sich am eigenen Vorjahr orientieren, sonst Startwerte: z. B. „10 Angeltage im Herbst“, „2 neue Gewässer“, „5 Wasser-Checks“. Nie Ziele für Fischmenge. Erreichtes Ziel +15 Punkte. Karte im Tab „Erfolge“ mit Fortschrittsbalken und Restzeit („noch 34 Tage“). Ziele in der Schonzeit der Zielart schlagen diese Art nicht vor.

**Jahresrückblick** (Phase 1): Ab 1. Dezember bzw. jederzeit für vergangene Jahre im Tab „Erfolge“. Seiten zum Durchwischen: Angeltage und Stunden am Wasser, Fänge und Schneidertage, neue PBs mit Foto, meistbesuchtes und bestes Gewässer (Fische pro Stunde), bester Köder und beste Farbe je Trübung, bester Monat, Rang am Jahresanfang und -ende, neue Abzeichen. Alle Zahlen nur aus eigenen Daten, mit Hinweis bei weniger als 5 Angeltagen. Als Bild speicherbar, ohne Ortsangaben und ohne GPS.

**PB-Verlauf je Art** (Phase 1): In der PB-Detailansicht eine Kurve der Rekordlänge über die Zeit (Stufenlinie, jeder neue PB ein Punkt mit Datum), darunter die Liste der bisherigen PBs mit Gewässer und Köder. Erst ab 2 PBs anzeigen.
**Bewusst nicht:** öffentliche Ranglisten, Punkte für Fangmenge, Teilen von Fangorten.

## 14. Mythen-Check

- Freigeschaltet ab 20 Angeltagen
- Je Faktor (Luftdruck-Trend, Tageszeit, Bewölkung, Wassertrübung, Mondgruppe): Fangquote = Summe Fische / Summe Stunden je Gruppe
- Balken je Gruppe, beste Gruppe hervorgehoben
- Aussage nur, wenn mindestens 2 Gruppen je ≥ 4 Angeltage haben:
  Verhältnis ≥ 1,5 „deutlich“, 1,2–1,5 „leichter Vorteil, kann Zufall sein“, sonst „kein klarer Effekt“
- Hinweis: einfacher Vergleich, keine strenge Statistik. Später optional: Konfidenzintervalle oder einfache Regression.
- Später zusätzlich **Bisse pro Stunde**: Bisse zeigen Aktivität auch dann, wenn kein Fisch hängen bleibt, und liefern so schneller genug Daten.

## 15. Fahrplan

**Phase 1 – Lokale App mit Live-Wetter**
Projekt aufsetzen, Rechenlogik aus dem Prototyp in getestete Module übernehmen, Open-Meteo anbinden, Ortssuche und Karte, Live-Modus mit Timer, Bissen und Fangfotos, Fangbuch mit IndexedDB, PBs, Regeln für Sachsen, Wasser-Check mit Köderfarbe, Pegel für Flüsse, persönlicher Bisswert, Gamification (inkl. Abzeichen-Stufen, Saisonziele, Jahresrückblick, PB-Verlauf), Lernen pro Gewässer ab 10 Angeltagen, Mythen-Check, Export/Import. Gamification-Extras dürfen am Ende von Phase 1 kommen.

**Phase 2 – Aufs Handy**
Online stellen (kostenloses Hosting), als PWA installierbar und offlinefähig, Einträge ohne Netz speichern und Wetter nachladen. Alarm als Push-Nachricht: Dafür braucht es einen kleinen Server-Dienst, der täglich prüft (z. B. Cloudflare Worker mit Zeitplan). Auf dem iPhone funktionieren Web-Push-Nachrichten nur, wenn die App zum Home-Bildschirm hinzugefügt wurde. Echte Wassertemperaturen von Pegelonline, wo vorhanden.

**Phase 3 – Optional**
App-Store-Version (z. B. mit Capacitor), Anfrage beim Landesverband Sächsischer Angler wegen Gewässerdaten, weitere Bundesländer.

## 16. Rechtliches und Datenquellen

- **Open-Meteo:** kostenlos für nicht-kommerzielle Nutzung, Quellenangabe in der App. Bei kommerzieller Nutzung ist ein Abo nötig.
- **OpenStreetMap:** Namensnennung „© OpenStreetMap-Mitwirkende“, Kachel-Nutzungsrichtlinie beachten.
- **ALLE ANGELN:** keine Nutzung (AGB verbieten automatisiertes Sammeln).
- **Angelatlas Sachsen:** nur verlinken.
- **Sächsische Fischereiverordnung 2022:** amtliches Werk, frei nutzbar; Quelle und Stand anzeigen.
- **Pegelonline (Bund):** frei nutzbar. **Landeshochwasserzentrum Sachsen:** Nutzung klären.
- **LfULG-Geodaten (Standgewässer, Gewässernetz):** mit Quellenangabe nutzbar, Bezug und Lizenz vor Phase 1 beim LfULG klären.
- **Name: „Bissfibel“** (Fibel = Lehrbuch für Einsteiger; die App bringt dir bei, wann und womit bei dir etwas beißt). Gewählt, weil es bereits zwei Angel-Apps mit „Beißindex“ im Namen gibt („Beißindex und Angelwetter“ von BLUELINDEN seit 2020, 4,5 Sterne; „Beissindex“ aus Rostock seit 2013). Der Wert 0–10 heißt deshalb in der App **„Bisswert“**, nicht Bissindex. Eine Websuche nach „Bissfibel“ ergab keine Treffer; **vor einer Veröffentlichung im DPMA-Register (register.dpma.de) und bei TMview prüfen** oder anwaltlich prüfen lassen.
- Hinweis in der App: Prognosen ohne Gewähr; Schonzeiten, Mindestmaße und Gewässerordnung sind verbindlich.

## 17. Entscheidungen (19. Oktober 2026)

- **Wohnort:** Zwickau, Umkreis meist bis 50 km.
- **Nutzung:** privat, ggf. für Freunde; nicht kommerziell. Veröffentlichung nur, wenn die App sehr gut ist (dann vorher Markenrecherche „Bissfibel“).
- **Fischartenliste:** wird mit den Verbreitungskarten Sachsens des LfULG abgeglichen (PDF „Vollbild_Verbreitungskarten_Sachsens_geschuetzt“). Krebse und Fluss-/Bachneunauge werden nicht angeboten (nicht beangelbar). Abgleich offen, bis die PDF vorliegt.
- **Code und Hosting:** GitHub-Repository `MRKS1989/Bissfibel`, Testversion über GitHub Pages ab Schritt 1.
- **Gewässerdaten:** Start mit OpenStreetMap (Overpass); LfULG-Daten später, sobald Bezug und Lizenz geklärt sind.
- **Wasser-Check:** eigenständige Zusatzfunktion als kurze Köder-Hilfe, **nicht an ein Gewässer gebunden** und nicht am Gewässer gespeichert. Die Angaben in Abschnitt 6 zu „Button bei jedem Gewässer“ und `Gewaesser.truebung` entfallen; eine beim Angeln gewählte Trübung darf weiter am Angeltag gespeichert werden.
- **Pegel:** in Phase 1 nur für die Elbe (Pegelonline).
