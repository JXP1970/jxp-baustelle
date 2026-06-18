const path = require("path");
const Database = require("better-sqlite3");

const dbPath = path.join(__dirname, "baustelle.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

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
`);

module.exports = db;
