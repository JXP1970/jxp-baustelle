# 🚀 Schnellstart - Baustelle Controlling

## Jeden Tag: In 3 Schritten starten

### 1️⃣ Desktop: Server starten
Terminal im Ordner `jxp-baustelle` öffnen und tippen:
```bash
npm start
```
→ Terminal **offen lassen!** Notiere die angezeigte IP (z.B. `192.168.0.104`)

### 2️⃣ Desktop: Browser öffnen
```
http://localhost:3000
```

### 3️⃣ Handy: Browser öffnen
⚠️ In die **Adressleiste OBEN** tippen (NICHT Google-Suche!):
```
http://192.168.0.104:3000
```

✅ Fertig! Header zeigt **"🔗 Server verbunden"**

---

## ⚠️ Die 3 häufigsten Fehler

| Fehler | Richtig |
|--------|---------|
| ❌ `https://...` | ✅ `http://...` (OHNE **s**!) |
| ❌ In Google-Suche getippt | ✅ In Adressleiste OBEN tippen |
| ❌ Server nicht gestartet | ✅ `npm start` läuft im Terminal |

---

## 📂 So komme ich zum Ordner (Terminal)

**Einfachster Trick:**
- **Windows:** Ordner im Explorer öffnen → in Adressleiste `cmd` tippen → Enter
- **Mac:** Rechtsklick auf Ordner → "Neues Terminal beim Ordner"
- **Linux:** Rechtsklick im Ordner → "Im Terminal öffnen"

**Oder manuell:**
```bash
cd ~/Desktop/jxp-baustelle      # Mac/Linux (Desktop)
cd %USERPROFILE%\Desktop\jxp-baustelle   # Windows (Desktop)
```

---

## ✅ Checkliste vor dem Start

- [ ] Handy & Desktop im **gleichen WLAN**
- [ ] Terminal mit `npm start` läuft (nicht schließen!)
- [ ] IP-Adresse aus dem Terminal notiert
- [ ] Handy: `http://` (ohne s) + IP + `:3000`

---

## 🛑 Server beenden

Im Terminal: `Strg + C` (Windows/Linux) oder `Cmd + C` (Mac)

---

**Tipp:** Lege dir die IP-Adresse als Lesezeichen im Handy-Browser an,
dann musst du sie nicht jedes Mal neu eintippen! 📌
