import "./App.css";
import { useState, useRef } from "react";
import Iridescence from "./components/Iridescence";
import IridescenceBlend from "./components/IridescenceBlend";

const PAGES = [
  { label: "Blue", id: 0 },
  { label: "Purplish Blue", id: 1 },
  { label: "Silver V1", id: 2 },
  { label: "Silver V2", id: 3 },
  { label: "Split", id: 4 },
  { label: "Blend", id: 5 },
];

const DEFAULT_TOP = 62;
const DEFAULT_BOT = 38;
const CENTER_MIN = 0.40;
const CENTER_MAX = 0.60;
const SIDE_SHIFT = 18;

function App() {
  const [page, setPage] = useState(0);
  const [prevPage, setPrevPage] = useState<number | null>(null);
  const splitRef = useRef<HTMLDivElement>(null);

  function changePage(next: number) {
    setPrevPage(page);
    setPage(next);
    // Clear prevPage after fade completes so it unmounts
    setTimeout(() => setPrevPage(null), 650);
  }

  function handleSplitMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = splitRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    let top: number;
    let bot: number;
    if (x >= CENTER_MIN && x <= CENTER_MAX) {
      top = DEFAULT_TOP;
      bot = DEFAULT_BOT;
    } else if (x < CENTER_MIN) {
      top = DEFAULT_TOP + SIDE_SHIFT;
      bot = DEFAULT_BOT + SIDE_SHIFT;
    } else {
      top = DEFAULT_TOP - SIDE_SHIFT;
      bot = DEFAULT_BOT - SIDE_SHIFT;
    }
    el.style.setProperty("--top", `${top}%`);
    el.style.setProperty("--bot", `${bot}%`);
  }

  function handleSplitMouseLeave() {
    const el = splitRef.current;
    if (!el) return;
    el.style.setProperty("--top", `${DEFAULT_TOP}%`);
    el.style.setProperty("--bot", `${DEFAULT_BOT}%`);
  }

  const silverV1 = (
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
  );

  const pages: Record<number, React.ReactNode> = {
    5: (
      <IridescenceBlend
        color1={[0.97, 0.98, 0.99]}
        color2={[0.9, 0.92, 0.95]}
        blendMin={0.4}
        blendMax={0.6}
        mouseReact
        amplitude={0.1}
        speed={1}
      />
    ),
    0: <Iridescence color={[0.4, 0.8, 1]} mouseReact amplitude={0.1} speed={1} />,
    1: <Iridescence color={[0.7, 0.4, 1]} mouseReact amplitude={0.1} speed={1} />,
    2: silverV1,
    3: <Iridescence color={[0.97, 0.98, 0.99]} mouseReact amplitude={0.1} speed={1} />,
    4: (
      <div
        ref={splitRef}
        className="split-gallery"
        onMouseMove={handleSplitMouseMove}
        onMouseLeave={handleSplitMouseLeave}
      >
        <div className="split-panel split-panel--first">
          <Iridescence color={[0.97, 0.98, 0.99]} mouseReact amplitude={0.1} speed={1} />
        </div>
        <div className="split-panel split-panel--last">
          {silverV1}
        </div>
      </div>
    ),
  };

  return (
    <div className="pages-wrapper">
      {/* Render only prev (fading out) and current (fading in) */}
      {prevPage !== null && prevPage !== page && (
        <div key={`prev-${prevPage}`} className="page page--fading">
          {pages[prevPage]}
        </div>
      )}
      <div key={`page-${page}`} className="page page--active">
        {pages[page]}
      </div>

      <div className="theme-dropdown-wrapper">
        <select
          className="theme-dropdown"
          value={page}
          onChange={(e) => changePage(Number(e.target.value))}
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
