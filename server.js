"use strict";
const express = require("express");
const fs = require("fs");
const path = require("path");
const os = require("os");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data.json");
const FOTOS_DIR = path.join(__dirname, "fotos");

if (!fs.existsSync(FOTOS_DIR)) fs.mkdirSync(FOTOS_DIR, { recursive: true });

function getLocalIP() {
  for (const nets of Object.values(os.networkInterfaces())) {
    for (const net of nets) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return "localhost";
}

function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (e) {}
  return { bauabschnitte: [], einsaetze: [], nextBaId: 1, nextEinsatzId: 1, lastModified: 0 };
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

function fotoFile(einsatzId) {
  return path.join(FOTOS_DIR, `${einsatzId}.json`);
}

function readFotos(einsatzId) {
  try {
    const f = fotoFile(einsatzId);
    if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, "utf8"));
  } catch (e) {}
  return [];
}

function writeFotos(einsatzId, fotos) {
  fs.writeFileSync(fotoFile(einsatzId), JSON.stringify(fotos), "utf8");
}

app.use(express.json({ limit: "25mb" }));

// Serve the HTML app
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "baustelle-controlling.html")));

// Server info – client uses this to detect server mode and get display IP
app.get("/api/info", (req, res) => res.json({ ip: getLocalIP(), port: PORT }));

// Structured data (bauabschnitte + einsaetze)
app.get("/api/data", (req, res) => res.json(readData()));

app.post("/api/data", (req, res) => {
  const data = { ...req.body, lastModified: Date.now() };
  writeData(data);
  res.json({ ok: true, lastModified: data.lastModified });
});

// Photos per einsatz
app.get("/api/fotos/:id", (req, res) => res.json(readFotos(req.params.id)));

app.post("/api/fotos/:id", (req, res) => {
  const fotos = readFotos(req.params.id);
  const foto = { id: Date.now(), dataUrl: req.body.dataUrl };
  fotos.push(foto);
  writeFotos(req.params.id, fotos);
  res.json({ ok: true, id: foto.id });
});

app.delete("/api/fotos/:einsatzId/:fotoId", (req, res) => {
  const fotos = readFotos(req.params.einsatzId).filter(
    (f) => String(f.id) !== req.params.fotoId
  );
  writeFotos(req.params.einsatzId, fotos);
  res.json({ ok: true });
});

app.delete("/api/fotos/:id", (req, res) => {
  const f = fotoFile(req.params.id);
  if (fs.existsSync(f)) fs.unlinkSync(f);
  res.json({ ok: true });
});

// ZIP backup – all data.json + fotos/
app.get("/api/backup", (req, res) => {
  try {
    const archiver = require("archiver");
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="baustelle-backup-${date}.zip"`);
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);
    if (fs.existsSync(DATA_FILE)) archive.file(DATA_FILE, { name: "data.json" });
    if (fs.existsSync(FOTOS_DIR)) archive.directory(FOTOS_DIR, "fotos");
    archive.finalize();
  } catch (e) {
    res.status(500).json({ error: "Backup fehlgeschlagen: " + e.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  const ip = getLocalIP();
  console.log("\n🏗️  Baustelle Controlling – Server gestartet!\n");
  console.log(`   Desktop:     http://localhost:${PORT}`);
  console.log(`   Handy/iPad:  http://${ip}:${PORT}  ← gleiches WLAN!\n`);
  console.log("   Server stoppen: Strg + C\n");
});
