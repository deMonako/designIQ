import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn, ZoomOut, Maximize2, X, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { getDwgViewerContent } from "../../admin/api/gasApi";

// ── Coordinate transform ───────────────────────────────────────────────────────

function buildTransform(meta, elements) {
  if (!meta) return null;

  if (meta.calibration?.length >= 2) {
    const [c1, c2] = meta.calibration;
    const el1 = elements[c1.tag], el2 = elements[c2.tag];
    if (!el1 || !el2) return null;
    const dx = el2.X - el1.X, dy = el2.Y - el1.Y;
    if (Math.abs(dx) < 1 || Math.abs(dy) < 1) return null;
    const sx = (c2.svgX - c1.svgX) / dx, sy = (c2.svgY - c1.svgY) / dy;
    const ox = c1.svgX - el1.X * sx, oy = c1.svgY - el1.Y * sy;
    return (mx, my) => ({ svgX: mx * sx + ox, svgY: my * sy + oy });
  }

  const { scale, originX, originY, svgHeight, flipY = true } = meta;
  if (!scale || scale <= 0) return null;
  return (mx, my) => ({
    svgX: (mx - (originX ?? 0)) / scale,
    svgY: flipY ? (svgHeight ?? 0) - (my - (originY ?? 0)) / scale
                : (my - (originY ?? 0)) / scale,
  });
}

// ── Kolory ────────────────────────────────────────────────────────────────────

const BASE_COLORS = {
  "Włączniki LOXONE":           "#f97316",
  "Czujniki obecności LOXONE":  "#8b5cf6",
  "Oświetlenie 230V":           "#eab308",
  "Oświetlenie 12V":            "#f59e0b",
  "Oświetlenie LED":            "#f59e0b",
  "Rolety":                     "#10b981",
  "Ogrzewanie":                 "#ef4444",
  "Klimatyzacja":               "#06b6d4",
  "Audio/Video":                "#ec4899",
  "Alarm":                      "#dc2626",
};
const AUTO_PALETTE = [
  "#3b82f6","#14b8a6","#a855f7","#f43f5e","#84cc16",
  "#fb923c","#38bdf8","#e879f9","#4ade80","#fbbf24",
];
const colorCache = new Map();
function dotColor(typ) {
  if (!typ) return "#64748b";
  if (BASE_COLORS[typ]) return BASE_COLORS[typ];
  if (colorCache.has(typ)) return colorCache.get(typ);
  const c = AUTO_PALETTE[colorCache.size % AUTO_PALETTE.length];
  colorCache.set(typ, c); return c;
}

// ── Parsowanie viewBox z SVG string (client-side) ─────────────────────────────

function parseSvgViewBox(svgStr) {
  const m = svgStr.match(/viewBox\s*=\s*["']\s*([-\d.\s,]+)\s*["']/i);
  if (!m) return null;
  const parts = m[1].trim().split(/[\s,]+/).map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return null;
  return { vx: parts[0], vy: parts[1], vw: parts[2], vh: parts[3] };
}

// ── Overlay circles wstrzykiwane do SVG overlay ───────────────────────────────

function injectOverlay(overlayEl, elements, meta, onSelect) {
  const transform = buildTransform(meta, elements);
  if (!transform) return () => {};

  const NS = "http://www.w3.org/2000/svg";
  const group = document.createElementNS(NS, "g");
  group.setAttribute("id", "__overlay__");
  const listeners = [];

  Object.entries(elements).forEach(([key, el]) => {
    if (el.X == null || el.Y == null) return;
    const { svgX, svgY } = transform(el.X, el.Y);
    if (!isFinite(svgX) || !isFinite(svgY)) return;
    const color = dotColor(el.typ);

    const ring = document.createElementNS(NS, "circle");
    ring.setAttribute("cx", svgX); ring.setAttribute("cy", svgY);
    ring.setAttribute("r", "5"); ring.setAttribute("fill", color);
    ring.setAttribute("fill-opacity", "0.2");
    ring.setAttribute("stroke", color); ring.setAttribute("stroke-width", "1");
    ring.style.pointerEvents = "none";

    const dot = document.createElementNS(NS, "circle");
    dot.setAttribute("cx", svgX); dot.setAttribute("cy", svgY);
    dot.setAttribute("r", "3"); dot.setAttribute("fill", color);
    dot.setAttribute("stroke", "white"); dot.setAttribute("stroke-width", "0.8");
    dot.style.pointerEvents = "none";

    const label = document.createElementNS(NS, "text");
    label.setAttribute("x", svgX + 4.5); label.setAttribute("y", svgY - 4);
    label.setAttribute("font-size", "4.5"); label.setAttribute("fill", color);
    label.setAttribute("font-family", "sans-serif"); label.setAttribute("font-weight", "600");
    label.setAttribute("paint-order", "stroke");
    label.setAttribute("stroke", "white"); label.setAttribute("stroke-width", "1.5");
    label.setAttribute("stroke-linejoin", "round");
    label.textContent = el.tag ?? key;
    label.style.pointerEvents = "none";

    const hit = document.createElementNS(NS, "circle");
    hit.setAttribute("cx", svgX); hit.setAttribute("cy", svgY);
    hit.setAttribute("r", "9"); hit.setAttribute("fill", "transparent");
    hit.style.cursor = "pointer";

    const onClick = (e) => {
      e.stopPropagation();
      onSelect({ tag: el.tag ?? key, attrib: el, clientX: e.clientX, clientY: e.clientY });
    };
    const onEnter = () => { ring.setAttribute("r", "8"); ring.setAttribute("fill-opacity", "0.35"); };
    const onLeave = () => { ring.setAttribute("r", "5"); ring.setAttribute("fill-opacity", "0.2"); };
    hit.addEventListener("click", onClick);
    hit.addEventListener("mouseenter", onEnter);
    hit.addEventListener("mouseleave", onLeave);
    listeners.push({ hit, onClick, onEnter, onLeave });

    const g = document.createElementNS(NS, "g");
    g.appendChild(ring); g.appendChild(dot); g.appendChild(label); g.appendChild(hit);
    group.appendChild(g);
  });

  overlayEl.appendChild(group);
  return () => {
    listeners.forEach(({ hit, onClick, onEnter, onLeave }) => {
      hit.removeEventListener("click", onClick);
      hit.removeEventListener("mouseenter", onEnter);
      hit.removeEventListener("mouseleave", onLeave);
    });
    group.remove();
  };
}

// ── Panel atrybutów ────────────────────────────────────────────────────────────

const HIDDEN_KEYS = new Set(["X","Y","_blockName","tag"]);
const KEY_LABELS = {
  typ:"Typ urządzenia", rola:"Rola", kondygnacja:"Kondygnacja",
  pomieszczenie:"Pomieszczenie", przewód:"Przewód", wysokość:"Wys. montażu",
  wariant:"Wariant", kolor:"Kolor", uwagi:"Uwagi",
};

function AttribPanel({ tag, attrib, pos, onClose, containerRef }) {
  if (!attrib || !pos) return null;
  const entries = Object.entries(attrib).filter(
    ([k,v]) => !HIDDEN_KEYS.has(k) && !k.startsWith("_") && v != null && v !== ""
  );
  const panelW = 290, panelH = Math.min(entries.length * 32 + 80, 380);
  let left = pos.x + 16, top = pos.y - 28;
  if (containerRef?.current) {
    const r = containerRef.current.getBoundingClientRect();
    if (left + panelW > r.width  - 8) left = pos.x - panelW - 16;
    if (top  + panelH > r.height - 8) top  = r.height - panelH - 8;
    if (top  < 8) top  = 8;
    if (left < 8) left = 8;
  }
  const color = dotColor(attrib.typ);
  return (
    <AnimatePresence>
      <motion.div key="panel"
        initial={{ opacity:0, scale:0.93, y:-4 }} animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.93 }} transition={{ duration:0.12 }}
        style={{ position:"absolute", left, top, width:panelW, zIndex:50 }}
        className="bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden pointer-events-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100"
          style={{ background: color + "18" }}>
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
          <span className="text-xs font-bold text-slate-800 flex-1 truncate">{tag}</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 flex-shrink-0 p-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="px-3 py-2 max-h-72 overflow-y-auto">
          {entries.map(([k,v]) => (
            <div key={k} className="flex gap-2 py-1 border-b border-slate-50 last:border-0 text-xs">
              <span className="text-slate-400 w-28 flex-shrink-0">{KEY_LABELS[k] ?? k}</span>
              <span className="text-slate-800 font-medium break-words min-w-0">{String(v)}</span>
            </div>
          ))}
          {!entries.length && <p className="text-xs text-slate-400 py-2">Brak atrybutów</p>}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Legenda ───────────────────────────────────────────────────────────────────

function Legend({ elements }) {
  const types = {};
  Object.values(elements).forEach(el => { if (el.typ && !types[el.typ]) types[el.typ] = dotColor(el.typ); });
  const entries = Object.entries(types);
  if (!entries.length) return null;
  return (
    <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur border border-slate-200 rounded-lg px-2.5 py-2 shadow-sm z-40 max-w-[240px]">
      {entries.map(([typ, color]) => (
        <div key={typ} className="flex items-center gap-1.5 text-[10px] text-slate-600 py-0.5">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
          <span className="truncate">{typ}</span>
        </div>
      ))}
    </div>
  );
}

// ── Toolbar ───────────────────────────────────────────────────────────────────

function Toolbar({ scalePct, onZoomIn, onZoomOut, onReset, onFullscreen, isFullscreen }) {
  return (
    <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur border border-slate-200 rounded-lg p-1 shadow-sm z-40">
      <button onClick={onZoomIn}  className="p-1.5 rounded hover:bg-slate-100 text-slate-600"><ZoomIn  className="w-4 h-4" /></button>
      <button onClick={onZoomOut} className="p-1.5 rounded hover:bg-slate-100 text-slate-600"><ZoomOut className="w-4 h-4" /></button>
      <div className="w-px h-5 bg-slate-200 mx-0.5" />
      <button onClick={onReset} className="p-1.5 rounded hover:bg-slate-100 text-slate-600 text-[10px] font-mono w-8 text-center">{scalePct}%</button>
      <div className="w-px h-5 bg-slate-200 mx-0.5" />
      <button onClick={onFullscreen} className="p-1.5 rounded hover:bg-slate-100 text-slate-600">
        <Maximize2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DwgViewer({ projectCode, height = 520, clientMode = false }) {
  const [loadState, setLoadState] = useState("idle");  // idle|loading|rasterizing|ok|empty|error
  const [svgContent, setSvgContent] = useState("");
  const [meta, setMeta]     = useState(null);
  const [elements, setElements] = useState({});
  const [selected, setSelected] = useState(null);
  const [scalePct, setScalePct] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);
  const wrapRef      = useRef(null);   // pan/zoom div
  const imgRef       = useRef(null);   // <img> — SVG rasterized to GPU bitmap
  const overlayRef   = useRef(null);   // <svg> — circles overlay
  const blobUrlRef   = useRef(null);   // Object URL for SVG blob

  // Pan/zoom in refs — zero React re-renders during movement
  const tRef       = useRef({ scale: 1, panX: 0, panY: 0 });
  const dragRef    = useRef(null);
  const hasDragRef = useRef(false);
  const rafRef     = useRef(null);

  // Direct DOM transform — no React state involved
  const flushTransform = useCallback(() => {
    if (!wrapRef.current) return;
    const { scale, panX, panY } = tRef.current;
    wrapRef.current.style.transform = `translate(${panX}px,${panY}px) scale(${scale})`;
  }, []);

  // ── Load data ─────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!projectCode) return;
    setLoadState("loading");
    colorCache.clear();
    try {
      const res = await getDwgViewerContent(projectCode);
      if (!res?.svg) { setLoadState("empty"); return; }
      const { _meta, ...elems } = res.attribs ?? {};
      setSvgContent(res.svg);
      setMeta(_meta ?? null);
      setElements(elems);
      // "rasterizing" state shown while browser decodes SVG image
      setLoadState("rasterizing");
      tRef.current = { scale: 1, panX: 0, panY: 0 };
      setScalePct(100);
      setSelected(null);
    } catch {
      setLoadState("error");
    }
  }, [projectCode]);

  useEffect(() => { load(); }, [load]);

  // ── Rasterize SVG → img + inject overlay ─────────────────────────────────
  useEffect(() => {
    if (loadState !== "rasterizing" || !svgContent) return;

    // Parse the viewBox from SVG string so overlay SVG aligns perfectly
    const vb = parseSvgViewBox(svgContent) ?? { vx: 0, vy: 0, vw: meta?.svgWidth ?? 800, vh: meta?.svgHeight ?? 600 };

    // Convert SVG text → Blob URL → <img> — browser rasterizes to GPU texture
    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    blobUrlRef.current = url;

    const img = imgRef.current;
    if (!img) return;

    const onLoad = () => {
      setLoadState("ok");

      // Inject circles into overlay SVG
      const overlay = overlayRef.current;
      if (overlay && meta) {
        overlay.setAttribute("viewBox", `${vb.vx} ${vb.vy} ${vb.vw} ${vb.vh}`);
        injectOverlay(overlay, elements, meta, ({ tag, attrib, clientX, clientY }) => {
          if (hasDragRef.current) return;
          const rect = containerRef.current?.getBoundingClientRect();
          setSelected({
            tag, attrib,
            pos: rect ? { x: clientX - rect.left, y: clientY - rect.top } : { x: 120, y: 80 },
          });
        });
      }
    };

    const onError = () => setLoadState("ok"); // show even if img decode fails

    img.addEventListener("load", onLoad, { once: true });
    img.addEventListener("error", onError, { once: true });
    img.src = url;

    return () => {
      img.removeEventListener("load", onLoad);
      img.removeEventListener("error", onError);
      img.src = "";
      // Cleanup overlay circles
      const overlay = overlayRef.current;
      if (overlay) overlay.innerHTML = "";
      // Revoke old blob URL
      if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadState, svgContent, meta, elements]);

  // ── Pan — attach to window, disable overlay pointer-events during drag ────
  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    // Don't start pan if clicking a hit circle (let click propagate normally)
    if (e.target.tagName === "circle" || e.target.closest?.("circle")) {
      // Still need to track for drag detection (user might drag starting from circle)
      hasDragRef.current = false;
    }
    e.preventDefault();
    hasDragRef.current = false;
    const { panX, panY } = tRef.current;
    dragRef.current = { mx: e.clientX, my: e.clientY, px: panX, py: panY };

    // Disable pointer-events on overlay during drag — eliminates circle hit-testing lag
    if (overlayRef.current) overlayRef.current.style.pointerEvents = "none";

    const onMove = (ev) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.mx;
      const dy = ev.clientY - dragRef.current.my;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) hasDragRef.current = true;
      tRef.current.panX = dragRef.current.px + dx;
      tRef.current.panY = dragRef.current.py + dy;
      // rAF throttle — one DOM write per animation frame
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        flushTransform();
      });
    };

    const onUp = () => {
      dragRef.current = null;
      if (overlayRef.current) overlayRef.current.style.pointerEvents = "";
      if (wrapRef.current) wrapRef.current.style.cursor = "grab";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };

    if (wrapRef.current) wrapRef.current.style.cursor = "grabbing";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  }, [flushTransform]);

  // ── Zoom ──────────────────────────────────────────────────────────────────
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    tRef.current.scale = Math.min(Math.max(tRef.current.scale * (e.deltaY < 0 ? 1.12 : 0.9), 0.1), 15);
    flushTransform();
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setScalePct(Math.round(tRef.current.scale * 100));
    });
  }, [flushTransform]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // ── Click-to-deselect on empty area ──────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e) => {
      if (hasDragRef.current) return;
      if (!e.target.closest?.("circle") && !e.target.closest?.("[data-panel]")) {
        setSelected(null);
      }
    };
    el.addEventListener("click", handler);
    return () => el.removeEventListener("click", handler);
  }, []);

  const handleReset = useCallback(() => {
    tRef.current = { scale: 1, panX: 0, panY: 0 };
    flushTransform();
    setScalePct(100);
    setSelected(null);
  }, [flushTransform]);

  // ── Render ────────────────────────────────────────────────────────────────
  const containerStyle = isFullscreen
    ? { position:"fixed", inset:0, zIndex:9999, background:"#f1f5f9", borderRadius:0 }
    : { position:"relative", height, borderRadius:16, overflow:"hidden", border:"1px solid #e2e8f0", background:"#f1f5f9" };

  const isLoading = loadState === "loading" || loadState === "rasterizing";
  const showCanvas = loadState === "ok" || loadState === "rasterizing";

  return (
    <div style={containerStyle} ref={containerRef} onMouseDown={onMouseDown}>

      {/* Loading */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400 z-10 bg-slate-50/80">
          <Loader2 className="w-7 h-7 animate-spin" />
          <span className="text-sm">
            {loadState === "rasterizing" ? "Renderowanie rzutu…" : "Ładowanie rzutu…"}
          </span>
        </div>
      )}

      {/* Error */}
      {loadState === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <span className="text-sm text-slate-500">Nie udało się załadować pliku</span>
          <button onClick={load} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50">
            <RefreshCw className="w-3.5 h-3.5" /> Spróbuj ponownie
          </button>
        </div>
      )}

      {/* Empty */}
      {loadState === "empty" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-8 text-center">
          <span className="text-2xl">📐</span>
          {clientMode ? (
            <><span className="text-sm font-medium text-slate-600">Projekt automatyki będzie dostępny wkrótce</span>
            <span className="text-xs text-slate-400">Trwają prace nad dokumentacją Twojej instalacji</span></>
          ) : (
            <><span className="text-sm font-medium text-slate-600">Brak pliku projekt.svg</span>
            <span className="text-xs text-slate-400">Umieść <code className="bg-slate-100 px-1 rounded">projekt.svg</code> i <code className="bg-slate-100 px-1 rounded">projekt.json</code> w folderze projektu na Drive</span></>
          )}
        </div>
      )}

      {/* Canvas — visible during rasterizing + ok so SVG img has time to decode */}
      {showCanvas && (
        <>
          {/*
            wrapRef: single div transformed for pan+zoom.
            - will-change: transform   → browser creates GPU compositor layer
            - translateZ(0)            → forces GPU layer even on older engines
            Pan is moving a GPU texture → zero CPU repaint, buttery smooth.
          */}
          <div
            ref={wrapRef}
            style={{
              position: "absolute", top: 0, left: 0,
              width: "100%", height: "100%",
              transform: "translateZ(0) translate(0px,0px) scale(1)",
              transformOrigin: "center center",
              willChange: "transform",
              cursor: "grab",
              userSelect: "none",
            }}
          >
            {/*
              <img> renders SVG as a GPU-rasterized bitmap.
              The browser decodes the SVG once on load → after that pan/zoom
              is GPU compositing, no CPU involved at all.
              pointer-events: none — img never receives mouse events.
            */}
            <img
              ref={imgRef}
              alt=""
              draggable={false}
              style={{
                width: "100%", height: "100%",
                display: "block",
                pointerEvents: "none",
                userSelect: "none",
              }}
            />

            {/*
              Overlay SVG — only the interactive circles, no CAD paths.
              Positioned absolute to fill exactly the same area as the img.
              viewBox matches original SVG viewBox → circle positions align.
              During drag: pointer-events disabled (see onMouseDown).
            */}
            <svg
              ref={overlayRef}
              preserveAspectRatio="xMidYMid meet"
              style={{
                position: "absolute", top: 0, left: 0,
                width: "100%", height: "100%",
                overflow: "visible",
              }}
            />
          </div>

          <Toolbar
            scalePct={scalePct}
            onZoomIn={()  => { tRef.current.scale = Math.min(tRef.current.scale*1.2,15); flushTransform(); setScalePct(Math.round(tRef.current.scale*100)); }}
            onZoomOut={()  => { tRef.current.scale = Math.max(tRef.current.scale/1.2,0.1); flushTransform(); setScalePct(Math.round(tRef.current.scale*100)); }}
            onReset={handleReset}
            onFullscreen={() => setIsFullscreen(f => !f)}
            isFullscreen={isFullscreen}
          />

          {isFullscreen && (
            <button onClick={() => setIsFullscreen(false)}
              className="absolute top-3 left-3 p-1.5 rounded-lg bg-white/90 border border-slate-200 shadow-sm text-slate-600 hover:text-slate-800 z-40">
              <X className="w-4 h-4" />
            </button>
          )}

          {Object.keys(elements).length > 0 && <Legend elements={elements} />}

          <div data-panel>
            <AttribPanel
              tag={selected?.tag}
              attrib={selected?.attrib}
              pos={selected?.pos}
              onClose={() => setSelected(null)}
              containerRef={containerRef}
            />
          </div>
        </>
      )}
    </div>
  );
}
