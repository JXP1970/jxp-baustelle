const express = require("express");
const fs = require("fs");
const path = require("path");
const db = require("../db");
const { uploadsDir } = require("../upload");

const router = express.Router();

router.delete("/:id", (req, res) => {
  const foto = db.prepare("SELECT * FROM fotos WHERE id = ?").get(req.params.id);
  if (!foto) {
    return res.status(404).json({ error: "Foto nicht gefunden" });
  }
  db.prepare("DELETE FROM fotos WHERE id = ?").run(req.params.id);
  fs.unlink(path.join(uploadsDir, foto.dateiname), () => {});
  res.status(204).end();
});

module.exports = router;
