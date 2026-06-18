import { useEffect, useState } from "react";
import { api } from "../api";

export default function Bauabschnitte() {
  const [liste, setListe] = useState([]);
  const [name, setName] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");

  function laden() {
    api.getBauabschnitte().then(setListe).catch((e) => setError(e.message));
  }

  useEffect(laden, []);

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      if (editId) {
        await api.updateBauabschnitt(editId, { name, beschreibung });
      } else {
        await api.createBauabschnitt({ name, beschreibung });
      }
      setName("");
      setBeschreibung("");
      setEditId(null);
      laden();
    } catch (e) {
      setError(e.message);
    }
  }

  function bearbeiten(b) {
    setEditId(b.id);
    setName(b.name);
    setBeschreibung(b.beschreibung || "");
  }

  async function loeschen(id) {
    if (!confirm("Bauabschnitt wirklich löschen? Zugehörige Einsätze werden mit gelöscht.")) return;
    try {
      await api.deleteBauabschnitt(id);
      laden();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section>
      <h2>Bauabschnitte verwalten</h2>
      {error && <p className="error">{error}</p>}

      <form className="form-inline" onSubmit={submit}>
        <input
          placeholder="Name (z.B. Abschnitt A - Rohbau)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          placeholder="Beschreibung (optional)"
          value={beschreibung}
          onChange={(e) => setBeschreibung(e.target.value)}
        />
        <button type="submit">{editId ? "Speichern" : "Hinzufügen"}</button>
        {editId && (
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setEditId(null);
              setName("");
              setBeschreibung("");
            }}
          >
            Abbrechen
          </button>
        )}
      </form>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Beschreibung</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {liste.map((b) => (
            <tr key={b.id}>
              <td>{b.name}</td>
              <td>{b.beschreibung}</td>
              <td className="actions">
                <button onClick={() => bearbeiten(b)}>Bearbeiten</button>
                <button className="danger" onClick={() => loeschen(b.id)}>
                  Löschen
                </button>
              </td>
            </tr>
          ))}
          {liste.length === 0 && (
            <tr>
              <td colSpan={3} className="empty">
                Noch keine Bauabschnitte angelegt.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
