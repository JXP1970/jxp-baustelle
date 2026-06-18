import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { api } from "../api";

function heute() {
  return new Date().toISOString().slice(0, 10);
}

function vorTagen(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function escapeCsvWert(wert) {
  const str = String(wert ?? "");
  if (str.includes(";") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export default function Auswertung() {
  const [von, setVon] = useState(vorTagen(6));
  const [bis, setBis] = useState(heute());
  const [daten, setDaten] = useState(null);
  const [error, setError] = useState("");

  function laden() {
    setError("");
    api.getAuswertung(von, bis).then(setDaten).catch((e) => setError(e.message));
  }

  useEffect(laden, []);

  const maxProTag = daten ? Math.max(1, ...daten.proTag.map((t) => t.mannstunden)) : 1;
  const maxProBauabschnitt = daten
    ? Math.max(1, ...daten.proBauabschnitt.map((b) => b.mannstunden))
    : 1;

  function exportCsv() {
    if (!daten) return;
    const headers = ["Datum", "Bauabschnitt", "Anzahl Arbeiter", "Stunden", "Mannstunden"];
    const zeilen = daten.eintraege.map((e) => [
      e.datum,
      e.bauabschnitt_name,
      e.anzahl_arbeiter,
      e.stunden,
      e.mannstunden.toFixed(2),
    ]);
    const csv = [headers, ...zeilen].map((r) => r.map(escapeCsvWert).join(";")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Auswertung_${von}_bis_${bis}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportPdf() {
    if (!daten) return;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Baustelle Controlling - Auswertung", 14, 16);
    doc.setFontSize(10);
    doc.text(`Zeitraum: ${von} bis ${bis}`, 14, 23);
    doc.text(`Gesamt Mannstunden: ${daten.gesamtMannstunden.toFixed(2)}`, 14, 29);

    autoTable(doc, {
      startY: 35,
      head: [["Tag", "Mannstunden"]],
      body: daten.proTag.map((t) => [t.datum, t.mannstunden.toFixed(2)]),
    });

    let y = doc.lastAutoTable.finalY + 10;
    doc.text("Mannstunden pro Bauabschnitt", 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [["Bauabschnitt", "Mannstunden", "Erfasste Tage"]],
      body: daten.proBauabschnitt.map((b) => [b.bauabschnitt_name, b.mannstunden.toFixed(2), b.arbeitstage]),
    });

    y = doc.lastAutoTable.finalY + 10;
    doc.text("Alle Einträge", 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [["Datum", "Bauabschnitt", "Anzahl Arbeiter", "Stunden", "Mannstunden"]],
      body: daten.eintraege.map((e) => [
        e.datum,
        e.bauabschnitt_name,
        e.anzahl_arbeiter,
        e.stunden,
        e.mannstunden.toFixed(2),
      ]),
    });

    doc.save(`Auswertung_${von}_bis_${bis}.pdf`);
  }

  return (
    <section>
      <h2>Auswertung der Leistung</h2>

      <form
        className="form-inline"
        onSubmit={(e) => {
          e.preventDefault();
          laden();
        }}
      >
        <label>
          Von: <input type="date" value={von} onChange={(e) => setVon(e.target.value)} />
        </label>
        <label>
          Bis: <input type="date" value={bis} onChange={(e) => setBis(e.target.value)} />
        </label>
        <button type="submit">Aktualisieren</button>
      </form>

      {error && <p className="error">{error}</p>}

      {daten && (
        <>
          <div className="export-buttons">
            <button type="button" onClick={exportPdf}>
              Als PDF exportieren
            </button>
            <button type="button" onClick={exportCsv}>
              Als CSV exportieren (Excel)
            </button>
          </div>

          <p className="summary">
            Gesamt im Zeitraum: <strong>{daten.gesamtMannstunden.toFixed(2)} Mannstunden</strong>
          </p>

          <h3>Mannstunden pro Tag</h3>
          {daten.proTag.length === 0 ? (
            <p className="empty">Keine Einträge im gewählten Zeitraum.</p>
          ) : (
            <table className="data-table chart-table">
              <tbody>
                {daten.proTag.map((t) => (
                  <tr key={t.datum}>
                    <td className="chart-label">{t.datum}</td>
                    <td className="chart-cell">
                      <div className="bar" style={{ width: `${(t.mannstunden / maxProTag) * 100}%` }} />
                      <span>{t.mannstunden.toFixed(2)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h3>Mannstunden pro Bauabschnitt</h3>
          {daten.proBauabschnitt.length === 0 ? (
            <p className="empty">Keine Einträge im gewählten Zeitraum.</p>
          ) : (
            <table className="data-table chart-table">
              <thead>
                <tr>
                  <th>Bauabschnitt</th>
                  <th>Mannstunden</th>
                  <th>Erfasste Tage</th>
                </tr>
              </thead>
              <tbody>
                {daten.proBauabschnitt
                  .slice()
                  .sort((a, b) => b.mannstunden - a.mannstunden)
                  .map((b) => (
                    <tr key={b.bauabschnitt_id}>
                      <td>{b.bauabschnitt_name}</td>
                      <td className="chart-cell">
                        <div
                          className="bar"
                          style={{ width: `${(b.mannstunden / maxProBauabschnitt) * 100}%` }}
                        />
                        <span>{b.mannstunden.toFixed(2)}</span>
                      </td>
                      <td>{b.arbeitstage}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          <h3>Alle Einträge</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Bauabschnitt</th>
                <th>Anzahl Arbeiter</th>
                <th>Stunden</th>
                <th>Mannstunden</th>
              </tr>
            </thead>
            <tbody>
              {daten.eintraege.map((e, i) => (
                <tr key={i}>
                  <td>{e.datum}</td>
                  <td>{e.bauabschnitt_name}</td>
                  <td>{e.anzahl_arbeiter}</td>
                  <td>{e.stunden}</td>
                  <td>{e.mannstunden.toFixed(2)}</td>
                </tr>
              ))}
              {daten.eintraege.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty">
                    Keine Einträge im gewählten Zeitraum.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
