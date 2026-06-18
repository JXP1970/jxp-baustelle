import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

function heute() {
  return new Date().toISOString().slice(0, 10);
}

export default function Erfassung() {
  const [datum, setDatum] = useState(heute());
  const [bauabschnitte, setBauabschnitte] = useState([]);
  const [einsaetze, setEinsaetze] = useState({});
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    api.getBauabschnitte().then(setBauabschnitte).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    setStatus("");
    api
      .getEinsaetzeByDatum(datum)
      .then((rows) => {
        const map = {};
        const f = {};
        for (const row of rows) {
          map[row.bauabschnitt_id] = row;
          f[row.bauabschnitt_id] = {
            anzahl_arbeiter: String(row.anzahl_arbeiter),
            stunden: String(row.stunden),
            notiz: row.notiz || "",
          };
        }
        setEinsaetze(map);
        setForm(f);
      })
      .catch((e) => setError(e.message));
  }, [datum]);

  function updateForm(bauabschnittId, field, value) {
    setForm((prev) => ({
      ...prev,
      [bauabschnittId]: { ...prev[bauabschnittId], [field]: value },
    }));
  }

  async function speichern(bauabschnittId) {
    setError("");
    const f = form[bauabschnittId] || {};
    const anzahl = Number(f.anzahl_arbeiter || 0);
    const stunden = Number(f.stunden || 0);
    try {
      const row = await api.saveEinsatz({
        datum,
        bauabschnitt_id: bauabschnittId,
        anzahl_arbeiter: anzahl,
        stunden,
        notiz: f.notiz || "",
      });
      setEinsaetze((prev) => ({ ...prev, [bauabschnittId]: row }));
      setStatus(`Gespeichert: ${row.bauabschnitt_name}`);
    } catch (e) {
      setError(e.message);
    }
  }

  async function eintragLoeschen(bauabschnittId) {
    const existing = einsaetze[bauabschnittId];
    if (!existing) return;
    try {
      await api.deleteEinsatz(existing.id);
      setEinsaetze((prev) => {
        const next = { ...prev };
        delete next[bauabschnittId];
        return next;
      });
      setForm((prev) => ({ ...prev, [bauabschnittId]: { anzahl_arbeiter: "", stunden: "", notiz: "" } }));
    } catch (e) {
      setError(e.message);
    }
  }

  const tagesMannstunden = useMemo(() => {
    return Object.values(einsaetze).reduce((sum, e) => sum + e.anzahl_arbeiter * e.stunden, 0);
  }, [einsaetze]);

  return (
    <section>
      <h2>Tageserfassung</h2>
      <div className="form-inline">
        <label>
          Datum:{" "}
          <input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
        </label>
      </div>

      {error && <p className="error">{error}</p>}
      {status && <p className="status">{status}</p>}

      {bauabschnitte.length === 0 ? (
        <p className="empty">
          Noch keine Bauabschnitte angelegt. Bitte zuerst unter "Bauabschnitte" einen Bauabschnitt
          anlegen.
        </p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Bauabschnitt</th>
              <th>Anzahl Arbeiter</th>
              <th>Stunden / Arbeiter</th>
              <th>Mannstunden</th>
              <th>Notiz</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {bauabschnitte.map((b) => {
              const f = form[b.id] || { anzahl_arbeiter: "", stunden: "", notiz: "" };
              const anzahl = Number(f.anzahl_arbeiter || 0);
              const stunden = Number(f.stunden || 0);
              const mannstunden = anzahl * stunden;
              const hatEintrag = Boolean(einsaetze[b.id]);
              return (
                <tr key={b.id}>
                  <td>{b.name}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      value={f.anzahl_arbeiter}
                      onChange={(e) => updateForm(b.id, "anzahl_arbeiter", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      value={f.stunden}
                      onChange={(e) => updateForm(b.id, "stunden", e.target.value)}
                    />
                  </td>
                  <td className="mannstunden">{mannstunden.toFixed(2)}</td>
                  <td>
                    <input
                      placeholder="Notiz (optional)"
                      value={f.notiz}
                      onChange={(e) => updateForm(b.id, "notiz", e.target.value)}
                    />
                  </td>
                  <td className="actions">
                    <button onClick={() => speichern(b.id)}>Speichern</button>
                    {hatEintrag && (
                      <button className="danger" onClick={() => eintragLoeschen(b.id)}>
                        Löschen
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}>
                <strong>Gesamt Mannstunden am {datum}</strong>
              </td>
              <td className="mannstunden">
                <strong>{tagesMannstunden.toFixed(2)}</strong>
              </td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      )}
    </section>
  );
}
