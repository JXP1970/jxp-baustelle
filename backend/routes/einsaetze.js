const express = require("express");
const db = require("../db");

const router = express.Router();

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function withMannstunden(row) {
  return { ...row, mannstunden: row.anzahl_arbeiter * row.stunden };
}

router.get("/", (req, res) => {
  const { datum, von, bis } = req.query;

  let rows;
  if (datum) {
    rows = db
      .prepare(
        `SELECT e.*, b.name AS bauabschnitt_name
         FROM einsaetze e
         JOIN bauabschnitte b ON b.id = e.bauabschnitt_id
         WHERE e.datum = ?
         ORDER BY b.name`
      )
      .all(datum);
  } else if (von && bis) {
    rows = db
      .prepare(
        `SELECT e.*, b.name AS bauabschnitt_name
         FROM einsaetze e
         JOIN bauabschnitte b ON b.id = e.bauabschnitt_id
         WHERE e.datum BETWEEN ? AND ?
         ORDER BY e.datum, b.name`
      )
      .all(von, bis);
  } else {
    rows = db
      .prepare(
        `SELECT e.*, b.name AS bauabschnitt_name
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
      `SELECT e.*, b.name AS bauabschnitt_name
       FROM einsaetze e
       JOIN bauabschnitte b ON b.id = e.bauabschnitt_id
       WHERE e.datum = ? AND e.bauabschnitt_id = ?`
    )
    .get(datum, bauabschnitt_id);

  res.status(201).json(withMannstunden(row));
});

router.delete("/:id", (req, res) => {
  const result = db.prepare("DELETE FROM einsaetze WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Eintrag nicht gefunden" });
  }
  res.status(204).end();
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
