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

// Stelle sicher, dass Verzeichnisse existieren
if (!fs.existsSync(FOTOS_DIR)) {
  fs.mkdirSync(FOTOS_DIR, { recursive: true });
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

// Speichere Daten
function saveData(data) {
  data.lastSync = new Date().toISOString();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Hole Daten vom Server
app.get('/api/sync', (req, res) => {
  const data = loadData();
  res.json(data);
});

// Speichere Daten vom Client
app.post('/api/sync', (req, res) => {
  try {
    const { bauabschnitte, einsaetze, nextBaId, nextEinsatzId } = req.body;

    const data = {
      bauabschnitte: bauabschnitte || [],
      einsaetze: einsaetze || [],
      nextBaId: nextBaId || 1,
      nextEinsatzId: nextEinsatzId || 1,
      lastSync: new Date().toISOString()
    };

    saveData(data);
    res.json({ success: true, lastSync: data.lastSync });
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
    const fotos = files.map(fileName => {
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
    .find(addr => addr.family === 'IPv4' && !addr.internal)?.address || 'localhost';

  console.log(`\n🏗️  Baustelle Controlling - Auto-Sync Server\n`);
  console.log(`📱 Öffne im Browser: http://${ip}:${PORT}`);
  console.log(`💻 Oder auf localhost: http://localhost:${PORT}`);
  console.log(`\n⚠️  Handy und Desktop müssen im gleichen WLAN sein!\n`);
});
