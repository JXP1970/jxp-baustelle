const BASE_URL = "/api";

async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Fehler ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getBauabschnitte: () => fetch(`${BASE_URL}/bauabschnitte`).then(handle),
  createBauabschnitt: (data) =>
    fetch(`${BASE_URL}/bauabschnitte`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),
  updateBauabschnitt: (id, data) =>
    fetch(`${BASE_URL}/bauabschnitte/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),
  deleteBauabschnitt: (id) =>
    fetch(`${BASE_URL}/bauabschnitte/${id}`, { method: "DELETE" }).then(handle),

  getEinsaetzeByDatum: (datum) =>
    fetch(`${BASE_URL}/einsaetze?datum=${encodeURIComponent(datum)}`).then(handle),
  saveEinsatz: (data) =>
    fetch(`${BASE_URL}/einsaetze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),
  deleteEinsatz: (id) =>
    fetch(`${BASE_URL}/einsaetze/${id}`, { method: "DELETE" }).then(handle),

  getAuswertung: (von, bis) =>
    fetch(`${BASE_URL}/einsaetze/auswertung?von=${von}&bis=${bis}`).then(handle),

  getFotos: (einsatzId) => fetch(`${BASE_URL}/einsaetze/${einsatzId}/fotos`).then(handle),
  uploadFotos: (einsatzId, files) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("fotos", file));
    return fetch(`${BASE_URL}/einsaetze/${einsatzId}/fotos`, {
      method: "POST",
      body: formData,
    }).then(handle);
  },
  deleteFoto: (id) => fetch(`${BASE_URL}/fotos/${id}`, { method: "DELETE" }).then(handle),
};
