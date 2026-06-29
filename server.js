const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Caching abschalten, damit immer die neueste App-Version geladen wird
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

const DATA_FILE = path.join(__dirname, 'data.json');
const FOTOS_DIR = path.join(__dirname, 'fotos');
const BACKUP_DIR = path.join(__dirname, 'backups');

// Stelle sicher, dass Verzeichnisse existieren
if (!fs.existsSync(FOTOS_DIR)) {
  fs.mkdirSync(FOTOS_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// Zusammenführen (Merge) statt Überschreiben
//
// WICHTIG: Diese Logik ist identisch zur Client-Seite in
// baustelle-controlling.html. Jeder Datensatz hat eine global eindeutige `id`
// und ein `updatedAt` (Zeitstempel). Beim Zusammenführen gilt:
//   - Datensätze, die nur auf einer Seite existieren, bleiben IMMER erhalten
//     (so geht nichts mehr verloren).
//   - Bei Datensätzen mit gleicher id gewinnt der mit dem neueren updatedAt.
//   - Löschungen werden als "Grabstein" (deleted:true) mitgeführt, damit sie
//     sich verbreiten, statt dass der Eintrag wieder auftaucht.
// ---------------------------------------------------------------------------
function mergeListe(localArr, serverArr) {
  const map = new Map();
  function add(rec) {
    if (!rec || rec.id == null) return;
    const key = String(rec.id);
    const ex = map.get(key);
    if (!ex) { map.set(key, rec); return; }
    const ru = Number(rec.updatedAt || 0);
    const eu = Number(ex.updatedAt || 0);
    if (ru >= eu) map.set(key, rec);
  }
  (Array.isArray(localArr) ? localArr : []).forEach(add);
  (Array.isArray(serverArr) ? serverArr : []).forEach(add);
  return Array.from(map.values()).sort((a, b) => Number(a.id) - Number(b.id));
}

function mergeState(a, b) {
  a = a || {};
  b = b || {};
  return {
    bauabschnitte: mergeListe(a.bauabschnitte, b.bauabschnitte),
    einsaetze: mergeListe(a.einsaetze, b.einsaetze),
    nextBaId: Math.max(Number(a.nextBaId) || 1, Number(b.nextBaId) || 1),
    nextEinsatzId: Math.max(Number(a.nextEinsatzId) || 1, Number(b.nextEinsatzId) || 1),
  };
}

function canonState(s) {
  s = s || {};
  const ba = (Array.isArray(s.bauabschnitte) ? s.bauabschnitte : []).slice().sort((a, b) => Number(a.id) - Number(b.id));
  const ein = (Array.isArray(s.einsaetze) ? s.einsaetze : []).slice().sort((a, b) => Number(a.id) - Number(b.id));
  return JSON.stringify({
    bauabschnitte: ba,
    einsaetze: ein,
    nextBaId: Number(s.nextBaId) || 1,
    nextEinsatzId: Number(s.nextEinsatzId) || 1,
  });
}

// Lade Daten oder initialisiere leere Daten
function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
      console.warn('Fehler beim Laden von data.json, starte mit leeren Daten');
    }
  }
  return { bauabschnitte: [], einsaetze: [], nextBaId: 1, nextEinsatzId: 1, lastSync: new Date().toISOString() };
}

// Sicherheitskopie von data.json anlegen, BEVOR neu geschrieben wird.
// So ist selbst im schlimmsten Fall jeder Stand wiederherstellbar.
function backupData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return;
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.copyFileSync(DATA_FILE, path.join(BACKUP_DIR, `data_${stamp}.json`));
    // Auf die letzten 100 Backups begrenzen
    const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.startsWith('data_')).sort();
    while (files.length > 100) {
      const f = files.shift();
      try { fs.unlinkSync(path.join(BACKUP_DIR, f)); } catch (e) {}
    }
  } catch (e) {
    console.warn('Backup fehlgeschlagen:', e.message);
  }
}

// Speichere Daten (mit vorheriger Sicherheitskopie)
function saveData(data) {
  data.lastSync = new Date().toISOString();
  backupData();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Hole Daten vom Server
app.get('/api/sync', (req, res) => {
  res.json(loadData());
});

// Speichere Daten vom Client – ZUSAMMENFÜHREN statt überschreiben
app.post('/api/sync', (req, res) => {
  try {
    const incoming = req.body || {};
    const current = loadData();
    const merged = mergeState(current, incoming);
    // Nur schreiben (und Backup anlegen), wenn sich wirklich etwas geändert hat
    if (canonState(merged) !== canonState(current)) {
      saveData(merged);
    }
    const out = loadData();
    res.json({ success: true, lastSync: out.lastSync });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Speichere Foto
app.post('/api/foto', (req, res) => {
  try {
    const { einsatzId, fotoId, dataUrl } = req.body;

    if (!dataUrl) {
      return res.status(400).json({ error: 'dataUrl erforderlich' });
    }

    const fileName = `${einsatzId}_${fotoId}.jpg`;
    const filePath = path.join(FOTOS_DIR, fileName);
    const base64Data = dataUrl.split(',')[1];

    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    res.json({ success: true, fileName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Hole alle Fotos
app.get('/api/fotos', (req, res) => {
  try {
    const files = fs.readdirSync(FOTOS_DIR);
    const fotos = files.map((fileName) => {
      const filePath = path.join(FOTOS_DIR, fileName);
      const data = fs.readFileSync(filePath);
      const base64 = data.toString('base64');
      const [einsatzId, fotoId] = fileName.replace('.jpg', '').split('_');
      return {
        fileName,
        einsatzId: Number(einsatzId),
        fotoId: Number(fotoId),
        dataUrl: `data:image/jpeg;base64,${base64}`
      };
    });
    res.json(fotos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lösche Foto
app.delete('/api/foto/:fileName', (req, res) => {
  try {
    const filePath = path.join(FOTOS_DIR, req.params.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serviere die HTML-Datei
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'baustelle-controlling.html'));
});

// Serviere statische Dateien (ohne Caching)
app.use(express.static(__dirname, { etag: false, lastModified: false, maxAge: 0 }));

const server = app.listen(PORT, () => {
  const ip = Object.values(os.networkInterfaces())
    .flat()
    .find((addr) => addr.family === 'IPv4' && !addr.internal)?.address || 'localhost';

  console.log(`\n🏗️  Baustelle Controlling - Auto-Sync Server\n`);
  console.log(`📱 Öffne im Browser: http://${ip}:${PORT}`);
  console.log(`💻 Oder auf localhost: http://localhost:${PORT}`);
  console.log(`\n⚠️  Handy und Desktop müssen im gleichen WLAN sein!\n`);
});

// Für Tests exportieren (hat im laufenden Server keine Auswirkung)
module.exports = { mergeState, mergeListe, canonState };
