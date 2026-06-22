# Baustelle Controlling - Auto-Sync über WLAN

## Installation & Start

### 1. Node.js installieren
Falls nicht vorhanden: https://nodejs.org/ (empfohlen: LTS-Version)

### 2. Dependencies installieren
```bash
cd /path/to/jxp-baustelle
npm install
```

### 3. Server starten
```bash
npm start
```

Du solltest eine Ausgabe sehen wie:
```
🏗️  Baustelle Controlling - Auto-Sync Server

📱 Öffne im Browser: http://192.168.1.100:3000
💻 Oder auf localhost: http://localhost:3000

⚠️  Handy und Desktop müssen im gleichen WLAN sein!
```

## So funktioniert's

### Desktop (Server)
1. Server startet auf dem Desktop
2. Daten werden lokal in `data.json` gespeichert
3. Fotos werden in `fotos/` Ordner gespeichert

### Handy/Tablet
1. Öffne im Browser: `http://192.168.1.100:3000` (oder die IP-Adresse deines Desktops)
2. Im Header siehst du: **"🔗 Server verbunden"** wenn die Verbindung aktiv ist
3. Beim Speichern werden Daten automatisch synchronisiert
4. Fotos werden automatisch zum Server hochgeladen

## Auto-Sync Features

✅ **Echtzeit-Synchronisierung**: Beim Speichern werden Daten sofort zum Server geschickt  
✅ **Automatisches Laden**: Alle 5 Sekunden wird überprüft, ob neue Daten vom Server da sind  
✅ **Offline-Modus**: Funktioniert auch ohne Server (lokal im Browser)  
✅ **Foto-Upload**: Bilder werden automatisch zum Server synchronisiert  
✅ **Backup-Export**: ZIP-Export funktioniert auch mit dem Server  

## Troubleshooting

### "⚠️ Lokal (kein Server)" erscheint
- Server läuft nicht, oder
- Handy und Desktop sind nicht im gleichen WLAN

**Lösung:**
1. Desktop-IP notieren: Schau in die Console-Ausgabe beim Start
2. Server auf Desktop: `npm start` ausführen
3. Handy im Browser: `http://192.168.x.x:3000` öffnen

### Verbindung abbricht
- Das ist normal wenn Desktop schläft
- App funktioniert trotzdem lokal
- Beim erneuten Verbinden wird synchronisiert

### Fotos werden nicht synchronisiert
- Überprüfe ob der Server läuft
- Überprüfe WLAN-Verbindung
- Versuche Seite zu neuladen

## Datenstruktur

```
jxp-baustelle/
├── baustelle-controlling.html  (App)
├── server.js                   (Sync-Server)
├── package.json               (Dependencies)
├── data.json                  (Gespeicherte Daten)
└── fotos/                     (Speicher für Bilder)
    ├── 1_1.jpg
    ├── 1_2.jpg
    └── ...
```

## Tips

- **Mehrere Geräte**: Oben links siehst du den Status
  - 🔗 Server verbunden
  - ⚠️ Lokal (kein Server)
  
- **Schnellerer Sync**: Änder die `setInterval(syncFromServer, 5000);` Zahl in ms (zB 2000 = 2 Sekunden)

- **Server im Hintergrund**: Du kannst das Terminal minimieren, der Server läuft weiter

---

**Viel Erfolg auf der Baustelle! 🏗️**
