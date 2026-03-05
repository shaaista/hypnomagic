import "./App.css";
import { useState } from "react";
import Iridescence from "./components/Iridescence";

const PAGES = [
  { label: "Blue", id: 0 },
  { label: "Purplish Blue", id: 1 },
  { label: "Silver V1", id: 2 },
  { label: "Silver V2", id: 3 },
];

function App() {
  const [page, setPage] = useState(0);

  return (
    <div className="pages-wrapper">
      {/* Blue */}
      <div className={`page ${page === 0 ? "page--active" : "page--hidden"}`}>
        <Iridescence color={[0.4, 0.8, 1]} mouseReact amplitude={0.1} speed={1} />
      </div>

      {/* Purplish Blue */}
      <div className={`page ${page === 1 ? "page--active" : "page--hidden"}`}>
        <Iridescence color={[0.7, 0.4, 1]} mouseReact amplitude={0.1} speed={1} />
      </div>

      {/* Silver V1 */}
      <div className={`page ${page === 2 ? "page--active" : "page--hidden"}`}>
        <Iridescence
          color={[0.9, 0.92, 0.95]}
          palette={[
            [0.65, 0.67, 0.70],
            [0.88, 0.90, 0.93],
            [0.97, 0.97, 0.98],
            [0.75, 0.77, 0.80],
          ]}
          mouseReact
          amplitude={0.1}
          speed={1}
        />
      </div>

      {/* Silver V2 */}
      <div className={`page ${page === 3 ? "page--active" : "page--hidden"}`}>
        <Iridescence color={[0.97, 0.98, 0.99]} mouseReact amplitude={0.1} speed={1} />
      </div>

      {/* Dropdown */}
      <div className="theme-dropdown-wrapper">
        <select
          className="theme-dropdown"
          value={page}
          onChange={(e) => setPage(Number(e.target.value))}
        >
          {PAGES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default App;
