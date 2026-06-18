# jxp-baustelle

Baustellen Controlling: Arbeiter pro Bauabschnitt und Tag erfassen, Leistung (Mannstunden) automatisch berechnen und auswerten.

## Funktionen

- **Bauabschnitte verwalten**: Bauabschnitte der Baustelle anlegen, bearbeiten, löschen.
- **Tageserfassung**: Für jeden Bauabschnitt die Anzahl der eingesetzten Arbeiter und die geleisteten Stunden eintragen. Die Mannstunden (Leistung) werden automatisch berechnet.
- **Auswertung**: Mannstunden je Tag und je Bauabschnitt über einen wählbaren Zeitraum, inkl. Gesamtsumme und Einzeleinträgen.

Single-User-App ohne Login, gedacht für den Einsatz im Kontrollzentrum sowie mobil vor Ort (responsives Design).

## Architektur

- `backend/`: Node.js + Express, Datenhaltung in SQLite (`better-sqlite3`). REST-API unter `/api`.
- `frontend/`: React + Vite SPA.

## Lokale Entwicklung

```bash
# Backend (Port 3001)
cd backend
npm install
npm run dev

# Frontend (Port 5173, proxied API-Requests an Backend)
cd frontend
npm install
npm run dev
```

Frontend öffnen unter http://localhost:5173.

## Produktion

```bash
cd frontend && npm install && npm run build
cd ../backend && npm install && npm start
```

Das Backend liefert dann unter http://localhost:3001 sowohl die API als auch das gebaute Frontend aus.
