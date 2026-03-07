import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn, ZoomOut, Maximize2, X, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { getDwgViewerContent } from "../../admin/api/gasApi";

// ── Coordinate transform ───────────────────────────────────────────────────────

/**
 * Oblicza funkcję mapującą współrzędne modelu (mm z ATTEXT) na współrzędne SVG.
 * Obsługuje dwa tryby:
 *   1. _meta.scale + originX/Y + svgHeight  — prosta skala + Y-flip
 *   2. _meta.calibration [p1, p2]           — dwa punkty kalibracyjne
 *
 * Zwraca funkcję: (modelX, modelY) => { svgX, svgY }
 */
function buildTransform(meta, elements) {
  if (!meta) return null;

  // Tryb kalibracyjny — dwa znane punkty
  if (meta.calibration?.length >= 2) {
    const [c1, c2] = meta.calibration;
    const el1 = elements[c1.tag];
    const el2 = elements[c2.tag];
    if (!el1 || !el2) return null;

    const dx = el2.X - el1.X;
    const dy = el2.Y - el1.Y;
    const dsvgX = c2.svgX - c1.svgX;
    const dsvgY = c2.svgY - c1.svgY;

    if (Math.abs(dx) < 1 || Math.abs(dy) < 1) return null;

    const scaleX = dsvgX / dx;
    const scaleY = dsvgY / dy; // może być ujemna przy Y-flip
    const offX = c1.svgX - el1.X * scaleX;
    const offY = c1.svgY - el1.Y * scaleY;

    return (modelX, modelY) => ({
      svgX: modelX * scaleX + offX,
      svgY: modelY * scaleY + offY,
    });
  }

  // Tryb scale + origin
  const { scale, originX, originY, svgHeight, flipY = true } = meta;
  if (!scale || scale <= 0) return null;

  return (modelX, modelY) => {
    const svgX = (modelX - (originX ?? 0)) / scale;
    const rawY = (modelY - (originY ?? 0)) / scale;
    const svgY = flipY ? (svgHeight ?? 0) - rawY : rawY;
    return { svgX, svgY };
  };
}

// ── SVG overlay injection ──────────────────────────────────────────────────────

const DOT_COLORS = {
  "Włączniki LOXONE":         "#f97316",
  "Czujniki obecności LOXONE": "#8b5cf6",
  "Oświetlenie 230V":          "#eab308",
  "Oświetlenie 12V":           "#eab308",
  default:                     "#3b82f6",
};

function dotColor(typ) {
  return DOT_COLORS[typ] || DOT_COLORS.default;
}

/**
 * Wstrzykuje interaktywne kółka + etykiety do elementu SVG na podstawie
 * współrzędnych z JSON (tryb koordynatowy).
 * Zwraca cleanup — usuwa wstrzyknięte elementy.
 */
function injectOverlay(svgEl, elements, meta, onSelect) {
  const transform = buildTransform(meta, elements);
  if (!transform) return () => {};

  const NS = "http://www.w3.org/2000/svg";
  const group = document.createElementNS(NS, "g");
  group.setAttribute("id", "__dwg_overlay__");

  const injected = [];

  Object.values(elements).forEach(el => {
    if (el.X == null || el.Y == null) return;
    const { svgX, svgY } = transform(el.X, el.Y);
    if (!isFinite(svgX) || !isFinite(svgY)) return;

    const color = dotColor(el.typ);

    // Outer ring (hover indicator)
    const ring = document.createElementNS(NS, "circle");
    ring.setAttribute("cx", svgX);
    ring.setAttribute("cy", svgY);
    ring.setAttribute("r", "5");
    ring.setAttribute("fill", color);
    ring.setAttribute("fill-opacity", "0.2");
    ring.setAttribute("stroke", color);
    ring.setAttribute("stroke-width", "1");

    // Inner dot
    const dot = document.createElementNS(NS, "circle");
    dot.setAttribute("cx", svgX);
    dot.setAttribute("cy", svgY);
    dot.setAttribute("r", "3");
    dot.setAttribute("fill", color);
    dot.setAttribute("stroke", "white");
    dot.setAttribute("stroke-width", "0.8");
    dot.style.cursor = "pointer";

    // Label
    const label = document.createElementNS(NS, "text");
    label.setAttribute("x", svgX + 4.5);
    label.setAttribute("y", svgY - 4);
    label.setAttribute("font-size", "4.5");
    label.setAttribute("fill", color);
    label.setAttribute("font-family", "sans-serif");
    label.setAttribute("font-weight", "600");
    label.textContent = el.tag;
    label.style.pointerEvents = "none";

    // Clickable area (bigger than dot)
    const hit = document.createElementNS(NS, "circle");
    hit.setAttribute("cx", svgX);
    hit.setAttribute("cy", svgY);
    hit.setAttribute("r", "7");
    hit.setAttribute("fill", "transparent");
    hit.style.cursor = "pointer";

    const handleClick = (e) => {
      e.stopPropagation();
      const rect = svgEl.getBoundingClientRect();
      const ctm  = svgEl.getScreenCTM();
      let px = e.clientX - rect.left;
      let py = e.clientY - rect.top;
      onSelect({ tag: el.tag, attrib: el, pos: { x: px, y: py } });
    };

    const handleEnter = () => {
      ring.setAttribute("r", "8");
      ring.setAttribute("fill-opacity", "0.35");
    };
    const handleLeave = () => {
      ring.setAttribute("r", "5");
      ring.setAttribute("fill-opacity", "0.2");
    };

    hit.addEventListener("click", handleClick);
    hit.addEventListener("mouseenter", handleEnter);
    hit.addEventListener("mouseleave", handleLeave);

    injected.push({ hit, handleClick, handleEnter, handleLeave });

    group.appendChild(ring);
    group.appendChild(dot);
    group.appendChild(label);
    group.appendChild(hit);
  });

  svgEl.appendChild(group);

  return () => {
    injected.forEach(({ hit, handleClick, handleEnter, handleLeave }) => {
      hit.removeEventListener("click", handleClick);
      hit.removeEventListener("mouseenter", handleEnter);
      hit.removeEventListener("mouseleave", handleLeave);
    });
    group.remove();
  };
}

// ── Panel atrybutów ────────────────────────────────────────────────────────────

// Klucze których nie pokazujemy w panelu (metadane pozycyjne)
const HIDDEN_KEYS = new Set(["X", "Y", "_blockName"]);

// Przyjazne nazwy kolumn
const KEY_LABELS = {
  tag:          "Oznaczenie",
  typ:          "Typ urządzenia",
  rola:         "Rola",
  kondygnacja:  "Kondygnacja",
  pomieszczenie:"Pomieszczenie",
  przewód:      "Przewód",
  wysokość:     "Wys. montażu",
  wariant:      "Wariant",
  kolor:        "Kolor",
  uwagi:        "Uwagi",
};

function AttribPanel({ attrib, pos, onClose, containerRef }) {
  if (!attrib) return null;

  const entries = Object.entries(attrib).filter(
    ([k, v]) => !HIDDEN_KEYS.has(k) && !k.startsWith("_") && v != null && v !== ""
  );

  const panelW = 280;
  const panelH = Math.min(entries.length * 30 + 72, 360);
  let left = (pos?.x ?? 0) + 14;
  let top  = (pos?.y ?? 0) - 24;
  if (containerRef?.current) {
    const rect = containerRef.current.getBoundingClientRect();
    if (left + panelW > rect.width  - 8) left = (pos?.x ?? 0) - panelW - 14;
    if (top  + panelH > rect.height - 8) top  = rect.height - panelH - 8;
    if (top < 8)  top  = 8;
    if (left < 8) left = 8;
  }

  const tag = attrib.tag ?? attrib._blockName ?? "Element";
  const color = dotColor(attrib.typ);

  return (
    <AnimatePresence>
      <motion.div
        key="panel"
        initial={{ opacity: 0, scale: 0.92, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.15 }}
        style={{ position: "absolute", left, top, width: panelW, zIndex: 50 }}
        className="bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden pointer-events-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100"
          style={{ background: color + "18" }}>
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
          <span className="text-xs font-bold text-slate-800 flex-1 truncate">{tag}</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 flex-shrink-0 p-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {/* Attributes */}
        <div className="px-3 py-2 max-h-72 overflow-y-auto">
          {entries.map(([k, v]) => (
            <div key={k} className="flex gap-2 py-1 border-b border-slate-50 last:border-0 text-xs">
              <span className="text-slate-400 w-28 flex-shrink-0">{KEY_LABELS[k] ?? k}</span>
              <span className="text-slate-800 font-medium break-words min-w-0">{String(v)}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Legenda typów ──────────────────────────────────────────────────────────────

function Legend({ elements }) {
  const types = {};
  Object.values(elements).forEach(el => {
    if (el.typ && !types[el.typ]) types[el.typ] = dotColor(el.typ);
  });
  if (Object.keys(types).length === 0) return null;

  return (
    <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur border border-slate-200 rounded-lg px-2.5 py-2 shadow-sm z-40 max-w-[220px]">
      {Object.entries(types).map(([typ, color]) => (
        <div key={typ} className="flex items-center gap-1.5 text-[10px] text-slate-600 py-0.5">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
          <span className="truncate">{typ}</span>
        </div>
      ))}
    </div>
  );
}

// ── Toolbar ────────────────────────────────────────────────────────────────────

function Toolbar({ scale, onZoomIn, onZoomOut, onReset, onFullscreen, isFullscreen }) {
  return (
    <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur border border-slate-200 rounded-lg p-1 shadow-sm z-40">
      <button onClick={onZoomIn}  title="Przybliż" className="p-1.5 rounded hover:bg-slate-100 text-slate-600"><ZoomIn  className="w-4 h-4" /></button>
      <button onClick={onZoomOut} title="Oddal"     className="p-1.5 rounded hover:bg-slate-100 text-slate-600"><ZoomOut className="w-4 h-4" /></button>
      <div className="w-px h-5 bg-slate-200 mx-0.5" />
      <button onClick={onReset} title="Dopasuj" className="p-1.5 rounded hover:bg-slate-100 text-slate-600 text-[10px] font-mono w-8 text-center">
        {Math.round(scale * 100)}%
      </button>
      <div className="w-px h-5 bg-slate-200 mx-0.5" />
      <button onClick={onFullscreen} title={isFullscreen ? "Wyjdź" : "Pełny ekran"} className="p-1.5 rounded hover:bg-slate-100 text-slate-600">
        <Maximize2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function DwgViewer({ projectCode, height = 520, clientMode = false }) {
  const [state, setState]           = useState("idle");
  const [svgContent, setSvgContent] = useState("");
  const [meta, setMeta]             = useState(null);   // _meta z JSON
  const [elements, setElements]     = useState({});     // elementy z atrybutami i X,Y
  const [selected, setSelected]     = useState(null);
  const [scale, setScale]           = useState(1);
  const [pan, setPan]               = useState({ x: 0, y: 0 });
  const [dragging, setDragging]     = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);
  const svgWrapRef   = useRef(null);
  const dragStart    = useRef(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!projectCode) return;
    setState("loading");
    try {
      const res = await getDwgViewerContent(projectCode);
      if (!res?.svg) { setState("empty"); return; }

      const attribs = res.attribs ?? {};
      const { _meta, ...elems } = attribs;

      setSvgContent(res.svg);
      setMeta(_meta ?? null);
      setElements(elems);
      setState("ok");
      setScale(1);
      setPan({ x: 0, y: 0 });
      setSelected(null);
    } catch {
      setState("error");
    }
  }, [projectCode]);

  useEffect(() => { load(); }, [load]);

  // ── Inject SVG + overlay ───────────────────────────────────────────────────
  useEffect(() => {
    if (state !== "ok" || !svgWrapRef.current) return;
    const wrap = svgWrapRef.current;
    wrap.innerHTML = svgContent;
    const svgEl = wrap.querySelector("svg");
    if (!svgEl) return;

    // Fit SVG do kontenera
    svgEl.style.width  = "100%";
    svgEl.style.height = "100%";
    svgEl.removeAttribute("width");
    svgEl.removeAttribute("height");

    // Auto viewBox z bounding boxa (naprawia skalę po imporcie DXF)
    const applyViewBox = () => {
      try {
        const bbox = svgEl.getBBox();
        if (bbox?.width > 0 && bbox?.height > 0) {
          const pad = Math.max(bbox.width, bbox.height) * 0.02;
          svgEl.setAttribute("viewBox",
            `${bbox.x - pad} ${bbox.y - pad} ${bbox.width + pad * 2} ${bbox.height + pad * 2}`
          );
        }
      } catch { /* getBBox niedostępne */ }
    };

    // ── Tryb koordynatowy (JSON ma X, Y + _meta) ──
    const hasCoords = meta && Object.values(elements).some(e => e.X != null);
    let cleanupOverlay = () => {};

    if (hasCoords) {
      // Nakładka wstrzyknięta do SVG (po ustaleniu viewBox)
      requestAnimationFrame(() => {
        applyViewBox();
        cleanupOverlay = injectOverlay(svgEl, elements, meta, (sel) => {
          setSelected(sel);
        });
      });

      // Klik w pusty obszar SVG odznacza
      const clearClick = (e) => {
        if (!e.target.closest("circle[style*='cursor']")) setSelected(null);
      };
      svgEl.addEventListener("click", clearClick);
      return () => {
        cleanupOverlay();
        svgEl.removeEventListener("click", clearClick);
      };
    }

    // ── Tryb ID-based (fallback — bloki mają id pasujące do kluczy JSON) ──
    requestAnimationFrame(applyViewBox);

    const groups = {};
    svgEl.querySelectorAll("g[id]").forEach(g => { groups[g.id] = g; });

    Object.keys(elements).forEach(id => {
      const g = groups[id];
      if (!g) return;
      g.style.cursor = "pointer";
      g.querySelectorAll("*").forEach(el => {
        el.setAttribute("data-orig-stroke", el.getAttribute("stroke") ?? "");
        el.setAttribute("data-orig-fill",   el.getAttribute("fill")   ?? "");
      });
    });

    const handleClick = (e) => {
      const g = e.target.closest("g[id]");
      if (!g || !elements[g.id]) { setSelected(null); return; }
      try {
        const bbox = g.getBBox();
        const pt   = svgEl.createSVGPoint();
        pt.x = bbox.x + bbox.width / 2;
        pt.y = bbox.y + bbox.height / 2;
        const ctm    = g.getScreenCTM();
        const screen = ctm ? pt.matrixTransform(ctm) : pt;
        const rect   = svgEl.getBoundingClientRect();
        setSelected({ tag: g.id, attrib: elements[g.id], pos: { x: screen.x - rect.left, y: screen.y - rect.top } });
      } catch {
        setSelected({ tag: g.id, attrib: elements[g.id], pos: { x: 100, y: 100 } });
      }

      Object.keys(elements).forEach(id => {
        const el = groups[id];
        if (!el) return;
        el.querySelectorAll("[stroke]").forEach(c => c.setAttribute("stroke", id === g.id ? "#3b82f6" : (c.getAttribute("data-orig-stroke") || "")));
        el.querySelectorAll("[fill]:not([fill='none'])").forEach(c => c.setAttribute("fill",   id === g.id ? "#dbeafe" : (c.getAttribute("data-orig-fill")   || "")));
      });
    };

    svgEl.addEventListener("click", handleClick);
    return () => svgEl.removeEventListener("click", handleClick);
  }, [state, svgContent, meta, elements]);

  // ── Pan & zoom ─────────────────────────────────────────────────────────────
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setScale(s => Math.min(Math.max(s * (e.deltaY < 0 ? 1.12 : 0.9), 0.15), 12));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
    setDragging(true);
  };
  const onMouseMove = (e) => {
    if (!dragging || !dragStart.current) return;
    setPan({ x: dragStart.current.px + (e.clientX - dragStart.current.mx), y: dragStart.current.py + (e.clientY - dragStart.current.my) });
  };
  const onMouseUp = () => { setDragging(false); dragStart.current = null; };

  // ── Render ─────────────────────────────────────────────────────────────────
  const containerStyle = isFullscreen
    ? { position: "fixed", inset: 0, zIndex: 9999, background: "#f1f5f9", borderRadius: 0 }
    : { position: "relative", height, borderRadius: 16, overflow: "hidden", border: "1px solid #e2e8f0", background: "#f1f5f9" };

  const elemCount = Object.keys(elements).length;

  return (
    <div style={containerStyle} ref={containerRef}
      onMouseDown={onMouseDown} onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}    onMouseLeave={onMouseUp}
    >
      {state === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin" />
          <span className="text-sm">Ładowanie rzutu…</span>
        </div>
      )}

      {state === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <span className="text-sm text-slate-500">Nie udało się załadować pliku</span>
          <button onClick={load} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50">
            <RefreshCw className="w-3.5 h-3.5" /> Spróbuj ponownie
          </button>
        </div>
      )}

      {state === "empty" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-8 text-center">
          <span className="text-2xl">📐</span>
          {clientMode ? (
            <>
              <span className="text-sm font-medium text-slate-600">Projekt automatyki będzie dostępny wkrótce</span>
              <span className="text-xs text-slate-400">Trwają prace nad dokumentacją Twojej instalacji</span>
            </>
          ) : (
            <>
              <span className="text-sm font-medium text-slate-600">Brak pliku projekt.svg</span>
              <span className="text-xs text-slate-400">
                Umieść <code className="bg-slate-100 px-1 rounded">projekt.svg</code> i{" "}
                <code className="bg-slate-100 px-1 rounded">projekt.json</code> w folderze projektu na Drive
              </span>
            </>
          )}
        </div>
      )}

      {state === "ok" && (
        <>
          {/* SVG canvas */}
          <div
            ref={svgWrapRef}
            style={{
              width: "100%", height: "100%",
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transformOrigin: "center center",
              cursor: dragging ? "grabbing" : "grab",
              userSelect: "none",
            }}
          />

          <Toolbar
            scale={scale}
            onZoomIn={()  => setScale(s => Math.min(s * 1.2, 12))}
            onZoomOut={()  => setScale(s => Math.max(s / 1.2, 0.15))}
            onReset={()   => { setScale(1); setPan({ x: 0, y: 0 }); setSelected(null); }}
            onFullscreen={() => setIsFullscreen(f => !f)}
            isFullscreen={isFullscreen}
          />

          {isFullscreen && (
            <button onClick={() => setIsFullscreen(false)}
              className="absolute top-3 left-3 p-1.5 rounded-lg bg-white/90 border border-slate-200 shadow-sm text-slate-600 hover:text-slate-800 z-40">
              <X className="w-4 h-4" />
            </button>
          )}

          {elemCount > 0 && <Legend elements={elements} />}

          <AttribPanel
            attrib={selected?.attrib}
            pos={selected?.pos}
            onClose={() => setSelected(null)}
            containerRef={containerRef}
          />
        </>
      )}
    </div>
  );
}
