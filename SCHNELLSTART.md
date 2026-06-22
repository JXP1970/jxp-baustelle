# 🏗️ Baustelle Controlling – Anleitung (Starten & Updaten)

> Für Windows mit Git. Der App-Ordner liegt auf dem Desktop unter `jxp-baustelle`.

---

## ▶️ App starten (jeden Tag)

### 1. Eingabeaufforderung im App-Ordner öffnen
- **Einfachster Weg:** Ordner `jxp-baustelle` im Explorer öffnen → oben in die
  Adressleiste `cmd` tippen → Enter
- **Oder manuell:** Eingabeaufforderung öffnen und eingeben:
  ```cmd
  cd %USERPROFILE%\Desktop\jxp-baustelle
  ```

### 2. Server starten
```cmd
npm start
```
→ Es erscheint eine Adresse, z.B. `http://192.168.0.104:3000`
→ **Fenster offen lassen!** (Server läuft, solange das Fenster offen ist)

### 3. Im Browser öffnen
- **Desktop:** `http://localhost:3000`
- **Handy** (gleiches WLAN!): in die **Adressleiste OBEN** (nicht Google-Suche):
  ```
  http://192.168.0.104:3000
  ```
  ⚠️ `http://` (ohne „s"!) und die IP aus Schritt 2

### 4. Prüfen
Oben im Header steht **🔗 Server verbunden** → alles synchronisiert automatisch.

### ⏹️ Server beenden
Im Eingabeaufforderungs-Fenster: **`Strg + C`**

---

## ⬆️ App updaten (wenn es eine neue Version gibt)

### 1. Server stoppen
Im Server-Fenster: **`Strg + C`**

### 2. Neue Version holen
```cmd
cd %USERPROFILE%\Desktop\jxp-baustelle
git pull origin claude/dreamy-ritchie-asann5
```

### 3. (Nur falls nötig) neue Pakete installieren
Wenn das Update neue Funktionen für den Server bringt:
```cmd
npm install
```
(Schadet nie, kann man immer ausführen.)

### 4. Server neu starten
```cmd
npm start
```

### 5. Browser neu laden (wichtig!)
- **Desktop:** `Strg + F5`
- **Handy:** Tab/App komplett schließen und neu öffnen

### 6. Version prüfen
Oben im Header steht die Versionsnummer (z.B. `v2.3`). Wenn sich die Nummer
nach dem Update erhöht hat, läuft die neue Version. ✅

---

## 🆘 Wenn etwas klemmt

| Problem | Lösung |
|--------|--------|
| `npm` oder `git` „nicht gefunden" | Node.js / Git installieren (siehe README) |
| Handy zeigt „⚠️ Lokal (kein Server)" | Gleiches WLAN? Server läuft? IP & `http://` korrekt? |
| Alte Version trotz Update | `Strg + F5` am Desktop, App am Handy komplett schließen |
| Adresse vergessen | Steht im Server-Fenster nach `npm start` |
| Daten weg? | Liegen in `data.json` + Ordner `fotos` im App-Ordner |

---

## 💡 Tipps

- **Lesezeichen:** Adresse `http://192.168.0.104:3000` im Handy-Browser als
  Lesezeichen speichern – dann nie wieder tippen.
- **Daten sichern:** In „Auswertung" → 💾 „Daten sichern (ZIP)" für ein Backup.
- **WLAN:** Handy und Desktop müssen immer im **selben WLAN** sein.

---

**Viel Erfolg auf der Baustelle! 🏗️**
