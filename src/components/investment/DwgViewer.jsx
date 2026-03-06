import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn, ZoomOut, Maximize2, X, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { getDwgViewerContent } from "../../admin/api/gasApi";

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Zbiera wszystkie grupy <g id="..."> z dokumentu SVG */
function collectGroups(svgEl) {
  const groups = {};
  svgEl.querySelectorAll("g[id]").forEach(g => {
    groups[g.id] = g;
  });
  return groups;
}

/** Zwraca bounding box grupy SVG względem viewportu SVG */
function getGroupCenter(g, svgEl) {
  try {
    const bbox  = g.getBBox();
    const pt    = svgEl.createSVGPoint();
    pt.x = bbox.x + bbox.width / 2;
    pt.y = bbox.y + bbox.height / 2;
    const ctm = g.getScreenCTM();
    if (!ctm) return null;
    const screen = pt.matrixTransform(ctm);
    const rect   = svgEl.getBoundingClientRect();
    return { x: screen.x - rect.left, y: screen.y - rect.top };
  } catch {
    return null;
  }
}

// ── Panel atrybutów ────────────────────────────────────────────────────────────

function AttribPanel({ attrib, pos, onClose, containerRef }) {
  if (!attrib) return null;

  // Skróć listę kluczy — pomiń puste wartości
  const entries = Object.entries(attrib).filter(([, v]) => v != null && v !== "");

  // Pozycja panelu: domyślnie obok kursora, z klampowaniem do kontenera
  const panelW = 260;
  const panelH = Math.min(entries.length * 28 + 64, 320);
  let left = (pos?.x ?? 0) + 12;
  let top  = (pos?.y ?? 0) - 20;
  if (containerRef?.current) {
    const rect = containerRef.current.getBoundingClientRect();
    if (left + panelW > rect.width  - 8) left = (pos?.x ?? 0) - panelW - 12;
    if (top  + panelH > rect.height - 8) top  = rect.height - panelH - 8;
    if (top < 8) top = 8;
    if (left < 8) left = 8;
  }

  return (
    <AnimatePresence>
      <motion.div
        key="panel"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.15 }}
        style={{ position: "absolute", left, top, width: panelW, zIndex: 50 }}
        className="bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden pointer-events-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
          <span className="text-xs font-semibold text-slate-700 truncate">
            {attrib._blockName ?? attrib.tag ?? "Blok"}
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 ml-2 flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {/* Attributes */}
        <div className="px-3 py-2 max-h-64 overflow-y-auto space-y-1">
          {entries
            .filter(([k]) => !k.startsWith("_"))
            .map(([k, v]) => (
              <div key={k} className="flex gap-2 text-xs">
                <span className="text-slate-400 w-24 flex-shrink-0 truncate">{k}</span>
                <span className="text-slate-800 font-medium break-all">{String(v)}</span>
              </div>
            ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Toolbar ────────────────────────────────────────────────────────────────────

function Toolbar({ scale, onZoomIn, onZoomOut, onReset, onFullscreen, isFullscreen }) {
  return (
    <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur border border-slate-200 rounded-lg p-1 shadow-sm z-40">
      <button onClick={onZoomIn} title="Przybliż" className="p-1.5 rounded hover:bg-slate-100 text-slate-600">
        <ZoomIn className="w-4 h-4" />
      </button>
      <button onClick={onZoomOut} title="Oddal" className="p-1.5 rounded hover:bg-slate-100 text-slate-600">
        <ZoomOut className="w-4 h-4" />
      </button>
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

// ── Main component ─────────────────────────────────────────────────────────────

/**
 * DwgViewer — interaktywny podgląd rysunku automatyki.
 *
 * Oczekiwana zawartość folderu projektu na Drive:
 *   projekt.svg  — rzut z NanoCAD (export/plot → SVG)
 *   projekt.json — atrybuty bloków (export ATTEXT → CSV → JSON)
 *
 * Format projekt.json:
 * {
 *   "HANDLE_LUB_NAZWA_BLOKU": {
 *     "_blockName": "KM1",          // opcjonalne – nazwa bloku
 *     "tag":        "KM1",          // oznaczenie na schemacie
 *     "opis":       "Stycznik główny",
 *     "prąd":       "16A",
 *     "napięcie":   "230V"
 *     // ... dowolne dodatkowe pola z ATTEXT
 *   }
 * }
 *
 * Bloki w SVG muszą mieć id odpowiadające kluczom w JSON
 * (AutoCAD/NanoCAD eksportuje id jako handle lub nazwę bloku).
 */
export default function DwgViewer({ projectCode, height = 520 }) {
  const [state, setState]         = useState("idle"); // idle | loading | ok | error | empty
  const [svgContent, setSvgContent] = useState("");
  const [attribs, setAttribs]     = useState({});     // { id: { ...attrs } }
  const [selected, setSelected]   = useState(null);   // { id, attrib, pos }
  const [scale, setScale]         = useState(1);
  const [pan, setPan]             = useState({ x: 0, y: 0 });
  const [dragging, setDragging]   = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);
  const svgWrapRef   = useRef(null);
  const dragStart    = useRef(null);

  // ── Load data ──────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!projectCode) return;
    setState("loading");
    try {
      const res = await getDwgViewerContent(projectCode);
      if (!res?.svg) { setState("empty"); return; }
      setSvgContent(res.svg);
      setAttribs(res.attribs ?? {});
      setState("ok");
      setScale(1);
      setPan({ x: 0, y: 0 });
    } catch {
      setState("error");
    }
  }, [projectCode]);

  useEffect(() => { load(); }, [load]);

  // ── Inject SVG and wire up click handlers ──────────────────────────────────
  useEffect(() => {
    if (state !== "ok" || !svgWrapRef.current) return;
    const wrap = svgWrapRef.current;
    wrap.innerHTML = svgContent;
    const svgEl = wrap.querySelector("svg");
    if (!svgEl) return;

    // Fit to container
    svgEl.style.width  = "100%";
    svgEl.style.height = "100%";
    svgEl.removeAttribute("width");
    svgEl.removeAttribute("height");
    if (!svgEl.getAttribute("viewBox")) {
      const bbox = svgEl.getBBox?.();
      if (bbox) svgEl.setAttribute("viewBox", `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
    }

    const groups = collectGroups(svgEl);

    // Highlight groups that have attrib data
    Object.keys(attribs).forEach(id => {
      const g = groups[id];
      if (!g) return;
      g.style.cursor = "pointer";
      g.querySelectorAll("*").forEach(el => {
        el.setAttribute("data-orig-stroke", el.getAttribute("stroke") ?? "");
        el.setAttribute("data-orig-fill",   el.getAttribute("fill")   ?? "");
      });
    });

    // Click handler
    const handleClick = (e) => {
      const g = e.target.closest("g[id]");
      if (!g || !attribs[g.id]) { setSelected(null); return; }
      const center = getGroupCenter(g, svgEl);
      setSelected({ id: g.id, attrib: attribs[g.id], pos: center });

      // Highlight
      Object.keys(attribs).forEach(id => {
        const el = groups[id];
        if (!el) return;
        el.querySelectorAll("[stroke]").forEach(child => {
          child.setAttribute("stroke", id === g.id ? "#3b82f6" : (child.getAttribute("data-orig-stroke") || ""));
        });
        el.querySelectorAll("[fill]:not([fill='none'])").forEach(child => {
          child.setAttribute("fill", id === g.id ? "#dbeafe" : (child.getAttribute("data-orig-fill") || ""));
        });
      });
    };

    svgEl.addEventListener("click", handleClick);
    return () => svgEl.removeEventListener("click", handleClick);
  }, [state, svgContent, attribs]);

  // ── Pan & zoom ─────────────────────────────────────────────────────────────
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.1 : 0.91;
    setScale(s => Math.min(Math.max(s * delta, 0.2), 8));
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
    setPan({
      x: dragStart.current.px + (e.clientX - dragStart.current.mx),
      y: dragStart.current.py + (e.clientY - dragStart.current.my),
    });
  };
  const onMouseUp = () => { setDragging(false); dragStart.current = null; };

  // ── Render ─────────────────────────────────────────────────────────────────
  const containerStyle = isFullscreen
    ? { position: "fixed", inset: 0, zIndex: 9999, background: "#f8fafc", borderRadius: 0 }
    : { position: "relative", height, borderRadius: 16, overflow: "hidden", border: "1px solid #e2e8f0", background: "#f8fafc" };

  return (
    <div style={containerStyle} ref={containerRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* Loading */}
      {state === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin" />
          <span className="text-sm">Ładowanie rzutu…</span>
        </div>
      )}

      {/* Error */}
      {state === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <span className="text-sm text-slate-500">Nie udało się załadować pliku</span>
          <button onClick={load} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50">
            <RefreshCw className="w-3.5 h-3.5" /> Spróbuj ponownie
          </button>
        </div>
      )}

      {/* Empty — brak pliku na Drive */}
      {state === "empty" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400 px-8 text-center">
          <span className="text-2xl">📐</span>
          <span className="text-sm font-medium text-slate-600">Brak pliku projekt.svg</span>
          <span className="text-xs text-slate-400">
            Umieść pliki <code className="bg-slate-100 px-1 rounded">projekt.svg</code> i{" "}
            <code className="bg-slate-100 px-1 rounded">projekt.json</code> w folderze projektu na Drive
          </span>
        </div>
      )}

      {/* SVG canvas */}
      {state === "ok" && (
        <>
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
            onZoomIn={()  => setScale(s => Math.min(s * 1.2, 8))}
            onZoomOut={()  => setScale(s => Math.max(s / 1.2, 0.2))}
            onReset={()   => { setScale(1); setPan({ x: 0, y: 0 }); setSelected(null); }}
            onFullscreen={() => setIsFullscreen(f => !f)}
            isFullscreen={isFullscreen}
          />

          {/* Close fullscreen overlay */}
          {isFullscreen && (
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-3 left-3 p-1.5 rounded-lg bg-white/90 border border-slate-200 shadow-sm text-slate-600 hover:text-slate-800 z-40"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Legenda — liczba bloków z atrybutami */}
          {Object.keys(attribs).length > 0 && (
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur border border-slate-200 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-500 z-40 shadow-sm">
              {Object.keys(attribs).length} bloków z danymi · kliknij aby zobaczyć
            </div>
          )}

          {/* Attrib panel */}
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
