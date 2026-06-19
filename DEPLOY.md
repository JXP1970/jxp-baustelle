# App online stellen (ohne Installation auf dem PC)

Diese Anleitung stellt die Baustellen-Controlling-App ins Internet, damit du sie
auf Handy und PC über einen festen Link öffnen und per WhatsApp teilen kannst.
Du brauchst dafür **nichts** auf deinem Computer zu installieren – alles läuft im
Browser. Datenbank und Beweisfotos bleiben dauerhaft gespeichert.

Wir nutzen **Render.com**. Die App läuft dort als ein einziger Dienst.

## Schritt für Schritt

1. Gehe auf **https://render.com** und klicke oben rechts auf **"Get Started"**.
   Melde dich am einfachsten mit deinem **GitHub-Konto** an (Button
   "GitHub"). Bestätige, dass Render auf dein Repository
   `jxp1970/jxp-baustelle` zugreifen darf.

2. Im Render-Dashboard oben rechts auf **"New +"** klicken und
   **"Blueprint"** auswählen.

3. Wähle das Repository **`jxp1970/jxp-baustelle`** aus der Liste aus.
   Render findet automatisch die Datei `render.yaml` in deinem Projekt.

4. Bei "Branch" den Branch **`claude/construction-worker-tracking-sbygcb`**
   auswählen (oder den Branch, auf dem dein Code liegt).

5. Render zeigt dir den geplanten Dienst **"baustelle-controlling"** an.
   Klicke auf **"Apply"** bzw. **"Create"**.

6. Jetzt baut Render die App (dauert ca. 2–5 Minuten). Wenn oben der Status
   auf **"Live"** (grün) springt, ist die App online.

7. Oben auf der Dienst-Seite steht deine feste Internet-Adresse, z. B.
   `https://baustelle-controlling.onrender.com`. **Das ist dein Link** –
   den kannst du auf dem Handy öffnen, als Lesezeichen speichern und per
   WhatsApp verschicken.

## Kosten / dauerhafter Speicher

Damit deine **Beweisfotos und Daten nicht verloren gehen**, ist in der
Konfiguration ein dauerhafter Speicher ("Disk") eingestellt. Render verlangt
dafür den günstigsten kostenpflichtigen Plan (**"Starter", aktuell ca. 7 USD /
Monat**). Das ist der Preis dafür, dass die App rund um die Uhr erreichbar ist
und nie Daten verliert.

**Kostenlos testen (ohne Garantie auf Datenerhalt):** Wenn du es erst gratis
ausprobieren willst, kannst du in der Datei `render.yaml` die Zeile
`plan: starter` durch `plan: free` ersetzen und den `disk:`-Block (die letzten
vier Zeilen) löschen. Achtung: Auf dem Gratis-Plan schläft die App nach
Inaktivität ein und **kann hochgeladene Fotos und erfasste Daten bei Neustarts
verlieren** – nur zum Ausprobieren geeignet, nicht für echte Beweisfotos.

## Updates

Wenn am Code etwas geändert und auf GitHub gepusht wird, baut Render die App
automatisch neu. Du musst nichts weiter tun.
