const express = require("express");
const fs = require("fs");
const path = require("path");
const db = require("../db");
const { upload, uploadsDir } = require("../upload");

const router = express.Router();

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const FOTO_ANZAHL_SUBQUERY = "(SELECT COUNT(*) FROM fotos f WHERE f.einsatz_id = e.id) AS foto_anzahl";

function withMannstunden(row) {
  return { ...row, mannstunden: row.anzahl_arbeiter * row.stunden };
}

router.get("/", (req, res) => {
  const { datum, von, bis } = req.query;

  let rows;
  if (datum) {
    rows = db
      .prepare(
        `SELECT e.*, b.name AS bauabschnitt_name, ${FOTO_ANZAHL_SUBQUERY}
         FROM einsaetze e
         JOIN bauabschnitte b ON b.id = e.bauabschnitt_id
         WHERE e.datum = ?
         ORDER BY b.name`
      )
      .all(datum);
  } else if (von && bis) {
    rows = db
      .prepare(
        `SELECT e.*, b.name AS bauabschnitt_name, ${FOTO_ANZAHL_SUBQUERY}
         FROM einsaetze e
         JOIN bauabschnitte b ON b.id = e.bauabschnitt_id
         WHERE e.datum BETWEEN ? AND ?
         ORDER BY e.datum, b.name`
      )
      .all(von, bis);
  } else {
    rows = db
      .prepare(
        `SELECT e.*, b.name AS bauabschnitt_name, ${FOTO_ANZAHL_SUBQUERY}
         FROM einsaetze e
         JOIN bauabschnitte b ON b.id = e.bauabschnitt_id
         ORDER BY e.datum DESC, b.name`
      )
      .all();
  }

  res.json(rows.map(withMannstunden));
});

router.post("/", (req, res) => {
  const { datum, bauabschnitt_id, anzahl_arbeiter, stunden, notiz } = req.body;

  if (!datum || !DATE_RE.test(datum)) {
    return res.status(400).json({ error: "Gültiges Datum (YYYY-MM-DD) ist erforderlich" });
  }
  if (!bauabschnitt_id) {
    return res.status(400).json({ error: "Bauabschnitt ist erforderlich" });
  }
  const anzahl = Number(anzahl_arbeiter);
  const std = Number(stunden);
  if (!Number.isFinite(anzahl) || anzahl < 0) {
    return res.status(400).json({ error: "Anzahl Arbeiter muss eine positive Zahl sein" });
  }
  if (!Number.isFinite(std) || std < 0) {
    return res.status(400).json({ error: "Stunden müssen eine positive Zahl sein" });
  }

  const bauabschnitt = db.prepare("SELECT id FROM bauabschnitte WHERE id = ?").get(bauabschnitt_id);
  if (!bauabschnitt) {
    return res.status(404).json({ error: "Bauabschnitt nicht gefunden" });
  }

  db.prepare(
    `INSERT INTO einsaetze (datum, bauabschnitt_id, anzahl_arbeiter, stunden, notiz)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(datum, bauabschnitt_id)
     DO UPDATE SET anzahl_arbeiter = excluded.anzahl_arbeiter,
                   stunden = excluded.stunden,
                   notiz = excluded.notiz`
  ).run(datum, bauabschnitt_id, anzahl, std, notiz || null);

  const row = db
    .prepare(
      `SELECT e.*, b.name AS bauabschnitt_name, ${FOTO_ANZAHL_SUBQUERY}
       FROM einsaetze e
       JOIN bauabschnitte b ON b.id = e.bauabschnitt_id
       WHERE e.datum = ? AND e.bauabschnitt_id = ?`
    )
    .get(datum, bauabschnitt_id);

  res.status(201).json(withMannstunden(row));
});

router.delete("/:id", (req, res) => {
  const fotos = db.prepare("SELECT dateiname FROM fotos WHERE einsatz_id = ?").all(req.params.id);
  const result = db.prepare("DELETE FROM einsaetze WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Eintrag nicht gefunden" });
  }
  fotos.forEach((f) => fs.unlink(path.join(uploadsDir, f.dateiname), () => {}));
  res.status(204).end();
});

router.get("/:einsatzId/fotos", (req, res) => {
  const einsatz = db.prepare("SELECT id FROM einsaetze WHERE id = ?").get(req.params.einsatzId);
  if (!einsatz) {
    return res.status(404).json({ error: "Eintrag nicht gefunden" });
  }
  const fotos = db
    .prepare("SELECT * FROM fotos WHERE einsatz_id = ? ORDER BY erstellt_am")
    .all(req.params.einsatzId);
  res.json(fotos.map((f) => ({ ...f, url: `/uploads/${f.dateiname}` })));
});

router.post("/:einsatzId/fotos", upload.array("fotos", 10), (req, res) => {
  const einsatz = db.prepare("SELECT id FROM einsaetze WHERE id = ?").get(req.params.einsatzId);
  if (!einsatz) {
    (req.files || []).forEach((f) => fs.unlink(f.path, () => {}));
    return res.status(404).json({ error: "Eintrag nicht gefunden" });
  }
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "Keine Datei hochgeladen" });
  }

  const insert = db.prepare("INSERT INTO fotos (einsatz_id, dateiname) VALUES (?, ?)");
  const inserted = req.files.map((f) => {
    const result = insert.run(req.params.einsatzId, f.filename);
    return db.prepare("SELECT * FROM fotos WHERE id = ?").get(result.lastInsertRowid);
  });

  res.status(201).json(inserted.map((f) => ({ ...f, url: `/uploads/${f.dateiname}` })));
});

router.get("/auswertung", (req, res) => {
  const { von, bis } = req.query;
  if (!von || !bis || !DATE_RE.test(von) || !DATE_RE.test(bis)) {
    return res.status(400).json({ error: "Parameter von und bis (YYYY-MM-DD) sind erforderlich" });
  }

  const rows = db
    .prepare(
      `SELECT e.datum, e.bauabschnitt_id, b.name AS bauabschnitt_name,
              e.anzahl_arbeiter, e.stunden
       FROM einsaetze e
       JOIN bauabschnitte b ON b.id = e.bauabschnitt_id
       WHERE e.datum BETWEEN ? AND ?
       ORDER BY e.datum, b.name`
    )
    .all(von, bis);

  const eintraege = rows.map(withMannstunden);

  const proTag = {};
  const proBauabschnitt = {};

  for (const e of eintraege) {
    proTag[e.datum] = (proTag[e.datum] || 0) + e.mannstunden;
    if (!proBauabschnitt[e.bauabschnitt_id]) {
      proBauabschnitt[e.bauabschnitt_id] = {
        bauabschnitt_id: e.bauabschnitt_id,
        bauabschnitt_name: e.bauabschnitt_name,
        mannstunden: 0,
        arbeitstage: 0,
      };
    }
    proBauabschnitt[e.bauabschnitt_id].mannstunden += e.mannstunden;
    proBauabschnitt[e.bauabschnitt_id].arbeitstage += 1;
  }

  const gesamtMannstunden = eintraege.reduce((sum, e) => sum + e.mannstunden, 0);

  res.json({
    eintraege,
    proTag: Object.entries(proTag).map(([datum, mannstunden]) => ({ datum, mannstunden })),
    proBauabschnitt: Object.values(proBauabschnitt),
    gesamtMannstunden,
  });
});

module.exports = router;
