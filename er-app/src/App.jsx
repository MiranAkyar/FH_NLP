import { useState, useRef, useEffect, useCallback } from "react";

// ── ER-Diagram helpers (unchanged from visualizer) ──────────────────────────

function formatCard(c) {
  if (!c) return "?";
  return c === "1_fallback" ? "1" : c;
}

function layoutEntities(entities = []) {
  const cols = Math.max(1, Math.ceil(Math.sqrt(entities.length)));
  const spacingX = 220, spacingY = 160;
  return entities.map((e, i) => ({
    ...e,
    x: 80 + (i % cols) * spacingX,
    y: 80 + Math.floor(i / cols) * spacingY,
  }));
}

function Arrow({ from, to, label, cardFrom, cardTo, nodes }) {
  const src = nodes.find((n) => n.id === from);
  const dst = nodes.find((n) => n.id === to);
  if (!src || !dst) return null;
  const EW = 140, EH = 44;
  const sx = src.x + EW / 2, sy = src.y + EH / 2;
  const dx = dst.x + EW / 2, dy = dst.y + EH / 2;
  const mx = (sx + dx) / 2, my = (sy + dy) / 2;
  const angle = Math.atan2(dy - sy, dx - sx);
  const lx = mx - Math.sin(angle) * 18;
  const ly = my + Math.cos(angle) * 18;
  const len = Math.sqrt((dx - sx) ** 2 + (dy - sy) ** 2) || 1;
  const ux = (dx - sx) / len, uy = (dy - sy) / len;

  // Direction-aware offset: up=50, down=40+attrs, horizontal=90
  const srcAttrCount = src.attributes?.length ?? 0;
  const dstAttrCount = dst.attributes?.length ?? 0;
  const offFrom = uy < -0.5 ? 50 : uy > 0.5 ? 60 + srcAttrCount * 22 : 90;
  const offTo   = uy < -0.5 ? 50 : uy > 0.5 ? 60 + dstAttrCount * 22 : 90;

  return (
    <g>
      <line x1={sx} y1={sy} x2={dx} y2={dy} stroke="#4a9eff" strokeWidth="1.5" strokeOpacity="0.6" markerEnd="url(#arrow)" />
      <rect x={lx - 32} y={ly - 11} width={64} height={22} rx={4} fill="#0f1923" stroke="#4a9eff" strokeWidth="1" strokeOpacity="0.5" />
      <text x={lx} y={ly + 4} textAnchor="middle" fill="#a0cfff" fontSize="10" fontFamily="'JetBrains Mono', monospace">{label}</text>
      <text x={sx + ux * offFrom} y={sy + uy * offFrom - 8} textAnchor="middle" fill="#ff9f4a" fontSize="11" fontWeight="bold" fontFamily="'JetBrains Mono', monospace">{formatCard(cardFrom)}</text>
      <text x={dx - ux * offTo}   y={dy - uy * offTo   - 8} textAnchor="middle" fill="#ff9f4a" fontSize="11" fontWeight="bold" fontFamily="'JetBrains Mono', monospace">{formatCard(cardTo)}</text>
    </g>
  );
}

function EntityNode({ node, selected, onMouseDown, onClick }) {
  const EW = 140, EH = 44;
  const hasAttrs = node.attributes && node.attributes.length > 0;
  return (
    <g transform={`translate(${node.x},${node.y})`} style={{ cursor: "grab" }} onMouseDown={onMouseDown} onClick={onClick}>
      <rect x={0} y={0} width={EW} height={EH} rx={6}
        fill={selected ? "#1a3a5c" : "#0d2035"}
        stroke={selected ? "#4a9eff" : "#2a5080"}
        strokeWidth={selected ? 2 : 1.5}
        style={{ filter: selected ? "drop-shadow(0 0 8px #4a9eff88)" : "none" }} />
      <text x={EW / 2} y={EH / 2 + 5} textAnchor="middle" fill="#e0f0ff" fontSize="13" fontWeight="600" fontFamily="'Space Grotesk', sans-serif">{node.type}</text>
      <text x={6} y={12} fill="#2a5080" fontSize="9" fontFamily="'JetBrains Mono', monospace">{node.id}</text>
      {hasAttrs && (
        <>
          <rect x={0} y={EH} width={EW} height={node.attributes.length * 22 + 8} rx={6} fill="#0a1a2e" stroke="#2a5080" strokeWidth="1.5" />
          {node.attributes.map((attr, i) => (
            <text key={i} x={EW / 2} y={EH + 18 + i * 22} textAnchor="middle" fill="#7ab8e0" fontSize="11" fontFamily="'JetBrains Mono', monospace">◇ {attr}</text>
          ))}
        </>
      )}
    </g>
  );
}

function ERCanvas({ model }) {
  const [nodes, setNodes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef();
  const panStart = useRef(null);

  useEffect(() => {
    if (model?.entities) {
      setNodes(layoutEntities(model.entities));
      setPan({ x: 0, y: 0 });
      setZoom(1);
    }
  }, [model]);

  const handleMouseDown = (id, e) => {
    e.stopPropagation();
    const r = svgRef.current.getBoundingClientRect();
    const node = nodes.find((n) => n.id === id);
    setDragging(id); setSelected(id);
    setOffset({ x: (e.clientX - r.left) / zoom - pan.x / zoom - node.x, y: (e.clientY - r.top) / zoom - pan.y / zoom - node.y });
  };

  useEffect(() => {
    const onMove = (e) => {
      if (dragging) {
        const r = svgRef.current.getBoundingClientRect();
        setNodes((prev) => prev.map((n) => n.id === dragging ? { ...n, x: (e.clientX - r.left) / zoom - pan.x / zoom - offset.x, y: (e.clientY - r.top) / zoom - pan.y / zoom - offset.y } : n));
      } else if (panStart.current) {
        setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
      }
    };
    const onUp = () => { setDragging(null); panStart.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [dragging, offset, zoom, pan]);

  if (!model?.entities?.length) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#2a5080", fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
        ← Text eingeben und Pipeline starten
      </div>
    );
  }

  return (
    <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 5, zIndex: 10 }}>
        {[["−", -0.2], ["+", 0.2]].map(([l, d]) => (
          <button key={l} onClick={() => setZoom((z) => Math.min(3, Math.max(0.3, z + d)))}
            style={{ background: "#0d2035", border: "1px solid #2a5080", color: "#4a9eff", width: 28, height: 28, borderRadius: 5, fontSize: 15, cursor: "pointer" }}>{l}</button>
        ))}
        <button onClick={() => { setPan({ x: 0, y: 0 }); setZoom(1); }}
          style={{ background: "#0d2035", border: "1px solid #2a5080", color: "#7ab8e0", padding: "0 8px", height: 28, borderRadius: 5, fontSize: 11, cursor: "pointer" }}>Reset</button>
      </div>
      <svg ref={svgRef} width="100%" height="100%"
        onMouseDown={(e) => { if (e.target === svgRef.current || e.target.tagName === "svg") { panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }; setSelected(null); } }}
        onWheel={(e) => { e.preventDefault(); setZoom((z) => Math.min(3, Math.max(0.3, z - e.deltaY * 0.001))); }}>
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#4a9eff" fillOpacity="0.8" />
          </marker>
        </defs>
        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
          {(model.relations || []).map((r, i) => (
            <Arrow key={i} from={r.subject} to={r.object} label={r.predicate} cardFrom={r.cardinality?.subject} cardTo={r.cardinality?.object} nodes={nodes} />
          ))}
          {nodes.map((node) => (
            <EntityNode key={node.id} node={node} selected={selected === node.id}
              onMouseDown={(e) => handleMouseDown(node.id, e)} onClick={() => setSelected(node.id)} />
          ))}
        </g>
      </svg>
      <div style={{ position: "absolute", bottom: 8, left: 10, fontSize: 10, color: "#1a4060", fontFamily: "'JetBrains Mono', monospace" }}>
        drag · scroll=zoom · klick=details
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────

const PLACEHOLDER = `Beschreibe dein Datenbankschema auf Deutsch oder Englisch.

Beispiel:
Ein Kunde kann mehrere Geräte besitzen. 
Jedes Gerät hat einen Gerätetyp und besteht aus mehreren Bauteilen. 
Bauteile haben eine Bezeichnung und einen Einkaufspreis. 
Alle Daten werden in einem Lager verwaltet.`;

// ⚠️  Passe diese URL an deinen laufenden FastAPI-Server an
const API_BASE = "http://localhost:8000";

export default function ERPipelineApp() {
  const [inputText, setInputText] = useState("");
  const [outputJson, setOutputJson] = useState("");
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activePanel, setActivePanel] = useState("json");
  const [jsonError, setJsonError] = useState(null);
  const [homonymMode, setHomonymMode] = useState("none");
  const [synonymClust, setSynonymClust] = useState(false);
  const [mergeRel, setMergeRel] = useState(false);
  const [collapseWeak, setCollapseWeak] = useState(false);

  // ── Call your pipeline backend ──────────────────────────────────────────
  const runPipeline = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError(null);
    setJsonError(null);

    try {
      const res = await fetch(`${API_BASE}/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          homonym_resolution: homonymMode,
          synonym_clustering: synonymClust,
          merge_relations: mergeRel,
          collapse_weak_entities: collapseWeak,
        }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}: ${await res.text()}`);
      const data = await res.json();
      const pretty = JSON.stringify(data, null, 2);
      setOutputJson(pretty);
      setModel(data);
      setActivePanel("diagram");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Allow manual JSON editing in output field ───────────────────────────
  const handleJsonEdit = (text) => {
    setOutputJson(text);
    try {
      const parsed = JSON.parse(text);
      setModel(parsed);
      setJsonError(null);
    } catch (e) {
      setJsonError(e.message);
    }
  };

  const S = styles;

  return (
    <div style={S.root}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* ── LEFT COLUMN: Input + Output ────────────────────────────────── */}
      <div style={S.leftCol}>

        {/* Header */}
        <div style={S.header}>
          <span style={S.logo}>ER Pipeline</span>
          <span style={S.subtitle}>Text → Extraktion → Diagramm</span>
        </div>

        {/* Text Input */}
        <div style={S.section}>
          <div style={S.sectionLabel}>
            <span style={S.badge}>01</span> Eingabe
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={PLACEHOLDER}
            style={S.textarea}
            onKeyDown={(e) => { if (e.ctrlKey && e.key === "Enter") runPipeline(); }}
          />
          <button
            onClick={runPipeline}
            disabled={loading || !inputText.trim()}
            style={{ ...S.runBtn, opacity: loading || !inputText.trim() ? 0.5 : 1 }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={S.spinner} /> Extraktion läuft…
              </span>
            ) : "▶  Pipeline starten  (Ctrl+Enter)"}
          </button>
          {error && <div style={S.errorBox}>⚠ {error}</div>}
        </div>


        {/* Pipeline Options */}
        <div style={S.section}>
          <div style={S.sectionLabel}>
            <span style={S.badge}>ops</span> Pipeline Optionen
          </div>
          <div style={{ fontSize: 11, color: '#7ab8e0', marginBottom: 5, fontWeight: 600 }}>Homonym Resolution</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[["none","Keine"],["rule-based","Rule-based"],["context_embedding","Context Embedding"],["full","Full"]].map(([val, lbl]) => (
              <label key={val} onClick={() => setHomonymMode(val)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: homonymMode === val ? '#c8e0f0' : '#4a7090' }}>
                <span style={{ width: 13, height: 13, borderRadius: '50%', flexShrink: 0, border: '2px solid ' + (homonymMode === val ? '#4a9eff' : '#2a5080'), background: homonymMode === val ? '#4a9eff' : 'transparent', display: 'inline-block' }} />
                {lbl}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
            {[[synonymClust, setSynonymClust, 'Synonym Clustering'],[mergeRel, setMergeRel, 'Merge Relations'],[collapseWeak, setCollapseWeak, 'Collapse Weak Entities']].map(([val, setter, lbl]) => (
              <label key={lbl} onClick={() => setter(!val)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: val ? '#c8e0f0' : '#4a7090' }}>
                <span style={{ width: 13, height: 13, borderRadius: 3, flexShrink: 0, border: '2px solid ' + (val ? '#4a9eff' : '#2a5080'), background: val ? '#4a9eff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {val && <span style={{ color: '#060e18', fontSize: 9, fontWeight: 900 }}>v</span>}
                </span>
                {lbl}
              </label>
            ))}
          </div>
        </div>

        {/* JSON Output */}
        <div style={{ ...S.section, flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={S.sectionLabel}>
              <span style={S.badge}>02</span> JSON Output
              {outputJson && <span style={{ color: "#3a9a3a", marginLeft: 8, fontSize: 11 }}>● live</span>}
            </div>
            {outputJson && (
              <button onClick={() => navigator.clipboard.writeText(outputJson)}
                style={S.smallBtn}>Kopieren</button>
            )}
          </div>
          <textarea
            value={outputJson}
            onChange={(e) => handleJsonEdit(e.target.value)}
            placeholder='{\n  "entities": [],\n  "relations": []\n}'
            style={{ ...S.textarea, flex: 1, color: "#7ab8e0", border: `1px solid ${jsonError ? "#ff4a4a" : "#1a3050"}` }}
          />
          {jsonError && <div style={S.errorBox}>⚠ JSON: {jsonError}</div>}
        </div>
      </div>

      {/* ── RIGHT COLUMN: Diagram ───────────────────────────────────────── */}
      <div style={S.rightCol}>
        <div style={S.diagramHeader}>
          <span style={{ ...S.badge, marginRight: 8 }}>03</span>
          <span style={{ color: "#7ab8e0", fontSize: 13, fontWeight: 600 }}>Diagramm</span>
          {model && (
            <span style={{ marginLeft: "auto", color: "#3a6080", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
              {model.entities?.length ?? 0} Entitäten · {model.relations?.length ?? 0} Relationen
            </span>
          )}
        </div>
        <ERCanvas model={model} />
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  root: {
    display: "flex",
    height: "100vh",
    width: "100vw",
    background: "#060e18",
    color: "#c8e0f0",
    fontFamily: "'Space Grotesk', sans-serif",
    overflow: "hidden",
    boxSizing: "border-box",
  },
  leftCol: {
    width: 380,
    flexShrink: 0,
    background: "#080f1a",
    borderRight: "1px solid #1a3050",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    padding: "16px 20px 12px",
    borderBottom: "1px solid #1a3050",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  logo: { fontSize: 20, fontWeight: 700, color: "#4a9eff", letterSpacing: "-0.5px" },
  subtitle: { fontSize: 11, color: "#3a6080" },
  section: { padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8, borderBottom: "1px solid #0d1e30" },
  sectionLabel: { display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#7ab8e0", fontWeight: 600 },
  badge: { background: "#0d2035", border: "1px solid #2a5080", color: "#4a9eff", fontSize: 10, padding: "1px 6px", borderRadius: 3, fontFamily: "'JetBrains Mono', monospace" },
  textarea: {
    background: "#060e18",
    color: "#c8e0f0",
    border: "1px solid #1a3050",
    borderRadius: 6,
    padding: "10px 12px",
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    resize: "none",
    outline: "none",
    minHeight: 120,
    lineHeight: 1.6,
  },
  runBtn: {
    background: "linear-gradient(135deg, #1a6fd4, #0e4fa0)",
    color: "#e0f0ff",
    border: "none",
    borderRadius: 6,
    padding: "10px",
    fontWeight: 700,
    fontSize: 13,
    fontFamily: "'Space Grotesk', sans-serif",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    transition: "opacity 0.2s",
  },
  smallBtn: {
    background: "transparent",
    border: "1px solid #1a3050",
    color: "#3a6080",
    borderRadius: 4,
    padding: "3px 8px",
    fontSize: 11,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  errorBox: { color: "#ff6060", fontSize: 11, fontFamily: "'JetBrains Mono', monospace", background: "#1a0a0a", borderRadius: 4, padding: "6px 10px" },
  spinner: {
    width: 12, height: 12,
    border: "2px solid #4a9eff44",
    borderTop: "2px solid #4a9eff",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.8s linear infinite",
  },
  rightCol: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "#060e18",
    overflow: "hidden",
  },
  diagramHeader: {
    padding: "12px 16px",
    borderBottom: "1px solid #1a3050",
    display: "flex",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
  },
};
