const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const dataDir = process.env.DATA_DIR || __dirname;
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "baustelle.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS bauabschnitte (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    beschreibung TEXT,
    erstellt_am TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS einsaetze (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    datum TEXT NOT NULL,
    bauabschnitt_id INTEGER NOT NULL REFERENCES bauabschnitte(id) ON DELETE CASCADE,
    anzahl_arbeiter INTEGER NOT NULL,
    stunden REAL NOT NULL,
    notiz TEXT,
    UNIQUE(datum, bauabschnitt_id)
  );

  CREATE TABLE IF NOT EXISTS fotos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    einsatz_id INTEGER NOT NULL REFERENCES einsaetze(id) ON DELETE CASCADE,
    dateiname TEXT NOT NULL,
    erstellt_am TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = db;
