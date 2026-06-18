import { Fragment, useEffect, useMemo, useState } from "react";
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
  const [expanded, setExpanded] = useState({});
  const [fotosByEinsatz, setFotosByEinsatz] = useState({});
  const [fotoError, setFotoError] = useState({});

  useEffect(() => {
    api.getBauabschnitte().then(setBauabschnitte).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    setStatus("");
    setExpanded({});
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
      [bauabschnittId]: {
        anzahl_arbeiter: "",
        stunden: "",
        notiz: "",
        ...prev[bauabschnittId],
        [field]: value,
      },
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
      setExpanded((prev) => ({ ...prev, [bauabschnittId]: false }));
    } catch (e) {
      setError(e.message);
    }
  }

  async function fotosLaden(einsatzId) {
    try {
      const fotos = await api.getFotos(einsatzId);
      setFotosByEinsatz((prev) => ({ ...prev, [einsatzId]: fotos }));
      setEinsaetze((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          if (next[key].id === einsatzId) {
            next[key] = { ...next[key], foto_anzahl: fotos.length };
          }
        }
        return next;
      });
    } catch (e) {
      setFotoError((prev) => ({ ...prev, [einsatzId]: e.message }));
    }
  }

  function toggleFotos(bauabschnittId) {
    const einsatz = einsaetze[bauabschnittId];
    if (!einsatz) return;
    const wirdGeoeffnet = !expanded[bauabschnittId];
    setExpanded((prev) => ({ ...prev, [bauabschnittId]: wirdGeoeffnet }));
    if (wirdGeoeffnet && !fotosByEinsatz[einsatz.id]) {
      fotosLaden(einsatz.id);
    }
  }

  async function fotosHochladen(bauabschnittId, fileList) {
    const einsatz = einsaetze[bauabschnittId];
    if (!einsatz || !fileList || fileList.length === 0) return;
    setFotoError((prev) => ({ ...prev, [einsatz.id]: "" }));
    try {
      await api.uploadFotos(einsatz.id, fileList);
      await fotosLaden(einsatz.id);
    } catch (e) {
      setFotoError((prev) => ({ ...prev, [einsatz.id]: e.message }));
    }
  }

  async function fotoLoeschen(bauabschnittId, fotoId) {
    const einsatz = einsaetze[bauabschnittId];
    if (!einsatz) return;
    try {
      await api.deleteFoto(fotoId);
      await fotosLaden(einsatz.id);
    } catch (e) {
      setFotoError((prev) => ({ ...prev, [einsatz.id]: e.message }));
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
              <th>Fotos</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {bauabschnitte.map((b) => {
              const f = form[b.id] || { anzahl_arbeiter: "", stunden: "", notiz: "" };
              const anzahl = Number(f.anzahl_arbeiter || 0);
              const stunden = Number(f.stunden || 0);
              const mannstunden = anzahl * stunden;
              const einsatz = einsaetze[b.id];
              const hatEintrag = Boolean(einsatz);
              const istOffen = Boolean(expanded[b.id]);
              const fotos = einsatz ? fotosByEinsatz[einsatz.id] : null;

              return (
                <Fragment key={b.id}>
                  <tr>
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
                    <td>
                      {hatEintrag ? (
                        <button className="secondary" onClick={() => toggleFotos(b.id)}>
                          📷 {einsatz.foto_anzahl || 0}
                        </button>
                      ) : (
                        <span className="hint">erst speichern</span>
                      )}
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
                  {istOffen && hatEintrag && (
                    <tr className="foto-row">
                      <td colSpan={7}>
                        <div className="foto-panel">
                          <label className="foto-upload-btn">
                            Foto aufnehmen / hochladen
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              multiple
                              onChange={(e) => {
                                fotosHochladen(b.id, e.target.files);
                                e.target.value = "";
                              }}
                            />
                          </label>
                          {fotoError[einsatz.id] && <p className="error">{fotoError[einsatz.id]}</p>}
                          <div className="foto-grid">
                            {(fotos || []).map((foto) => (
                              <div className="foto-thumb" key={foto.id}>
                                <a href={foto.url} target="_blank" rel="noreferrer">
                                  <img src={foto.url} alt="Beweisfoto" />
                                </a>
                                <button className="danger" onClick={() => fotoLoeschen(b.id, foto.id)}>
                                  ×
                                </button>
                              </div>
                            ))}
                            {fotos && fotos.length === 0 && (
                              <span className="hint">Noch keine Fotos für diesen Tag.</span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
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
              <td colSpan={3}></td>
            </tr>
          </tfoot>
        </table>
      )}
    </section>
  );
}
