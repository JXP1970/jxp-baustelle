import { NavLink, Route, Routes, Navigate } from "react-router-dom";
import Erfassung from "./pages/Erfassung";
import Bauabschnitte from "./pages/Bauabschnitte";
import Auswertung from "./pages/Auswertung";

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>🏗️ Baustelle Controlling</h1>
        <nav>
          <NavLink to="/" end>
            Tageserfassung
          </NavLink>
          <NavLink to="/bauabschnitte">Bauabschnitte</NavLink>
          <NavLink to="/auswertung">Auswertung</NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Erfassung />} />
          <Route path="/bauabschnitte" element={<Bauabschnitte />} />
          <Route path="/auswertung" element={<Auswertung />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
