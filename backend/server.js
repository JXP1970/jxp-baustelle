const path = require("path");
const express = require("express");
const cors = require("cors");

const { uploadsDir } = require("./upload");
const bauabschnitteRouter = require("./routes/bauabschnitte");
const einsaetzeRouter = require("./routes/einsaetze");
const fotosRouter = require("./routes/fotos");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(uploadsDir));
app.use("/api/bauabschnitte", bauabschnitteRouter);
app.use("/api/einsaetze", einsaetzeRouter);
app.use("/api/fotos", fotosRouter);

const frontendDist = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(frontendDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/uploads/")) return next();
  res.sendFile(path.join(frontendDist, "index.html"), (err) => {
    if (err) next();
  });
});

app.use((err, req, res, next) => {
  res.status(400).json({ error: err.message || "Fehler beim Verarbeiten der Anfrage" });
});

app.listen(PORT, () => {
  console.log(`Backend läuft auf http://localhost:${PORT}`);
});
