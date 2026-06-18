const express = require("express");
const fs = require("fs");
const path = require("path");
const db = require("../db");
const { uploadsDir } = require("../upload");

const router = express.Router();

router.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM bauabschnitte ORDER BY name").all();
  res.json(rows);
});

router.post("/", (req, res) => {
  const { name, beschreibung } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Name ist erforderlich" });
  }
  const result = db
    .prepare("INSERT INTO bauabschnitte (name, beschreibung) VALUES (?, ?)")
    .run(name.trim(), beschreibung || null);
  const row = db.prepare("SELECT * FROM bauabschnitte WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.put("/:id", (req, res) => {
  const { name, beschreibung } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Name ist erforderlich" });
  }
  const result = db
    .prepare("UPDATE bauabschnitte SET name = ?, beschreibung = ? WHERE id = ?")
    .run(name.trim(), beschreibung || null, req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Bauabschnitt nicht gefunden" });
  }
  const row = db.prepare("SELECT * FROM bauabschnitte WHERE id = ?").get(req.params.id);
  res.json(row);
});

router.delete("/:id", (req, res) => {
  const fotos = db
    .prepare(
      `SELECT f.dateiname FROM fotos f
       JOIN einsaetze e ON e.id = f.einsatz_id
       WHERE e.bauabschnitt_id = ?`
    )
    .all(req.params.id);

  const result = db.prepare("DELETE FROM bauabschnitte WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Bauabschnitt nicht gefunden" });
  }

  fotos.forEach((f) => fs.unlink(path.join(uploadsDir, f.dateiname), () => {}));
  res.status(204).end();
});

module.exports = router;
