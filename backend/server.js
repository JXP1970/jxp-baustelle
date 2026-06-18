const path = require("path");
const express = require("express");
const cors = require("cors");

const bauabschnitteRouter = require("./routes/bauabschnitte");
const einsaetzeRouter = require("./routes/einsaetze");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api/bauabschnitte", bauabschnitteRouter);
app.use("/api/einsaetze", einsaetzeRouter);

const frontendDist = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(frontendDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(frontendDist, "index.html"), (err) => {
    if (err) next();
  });
});

app.listen(PORT, () => {
  console.log(`Backend läuft auf http://localhost:${PORT}`);
});
