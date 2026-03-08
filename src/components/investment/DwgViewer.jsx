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
    console.log(
      "%c[DwgViewer · kalibracja]%c\n" +
      "  punkt1: tag=%s  X=%s Y=%s  →  svgX=%s svgY=%s\n" +
      "  punkt2: tag=%s  X=%s Y=%s  →  svgX=%s svgY=%s\n" +
      "  skala:  sx=%s  sy=%s   offset: ox=%s  oy=%s",
      "color:#8b5cf6;font-weight:bold", "color:#475569",
      c1.tag, el1.X, el1.Y, c1.svgX, c1.svgY,
      c2.tag, el2.X, el2.Y, c2.svgX, c2.svgY,
      sx.toFixed(4), sy.toFixed(4), ox.toFixed(2), oy.toFixed(2)
    );
    return (mx, my) => ({ svgX: mx * sx + ox, svgY: my * sy + oy });
  }

  const { scale, originX, originY, svgHeight, flipY = true } = meta;
  if (!scale || scale <= 0) return null;
  console.log(
    "%c[DwgViewer · skala generyczna]%c scale=%s originX=%s originY=%s svgHeight=%s flipY=%s",
    "color:#8b5cf6;font-weight:bold", "color:#475569",
    scale, originX, originY, svgHeight, flipY
  );
  return (mx, my) => ({
    svgX: (mx - (originX ?? 0)) / scale,
    svgY: flipY
      ? (svgHeight ?? 0) - (my - (originY ?? 0)) / scale
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
  colorCache.set(typ, c);
  return c;
}

// ── Rasteryzacja SVG → Canvas (eliminuje lag pana) ────────────────────────────
//
// Canvas to pojedyncza tekstura GPU. Pan = przesunięcie tekstury na GPU.
// Zero repaintu SVG podczas przesuwania. Kosztem jednorazowego renderowania.

async function rasterizeSvg(svgEl, svgW, svgH) {
  // Rasteryzuj z 3× rozdzielczością viewBox — Chrome renderuje SVG wektorowo
  // do podanego rozmiaru, więc każdy zoom <3× zachowuje ostrość.
  // preserveAspectRatio=none → canvas wypełniony 1:1 z viewBox (brak letterbox).
  const K  = 3;
  const cw = Math.min(Math.ceil(svgW * K), 6000);
  const ch = Math.min(Math.ceil(svgH * K), 6000);

  // preserveAspectRatio=none — canvas wypełniony 1:1 z viewBox (bez wewnętrznego letterbox).
  // Bez tego SVG domyślnie stosuje xMidYMid meet, co powoduje przesunięcie elementów
  // w kierunku środka (widoczne przy narożnych punktach rzutu).
  svgEl.setAttribute("width",  cw);
  svgEl.setAttribute("height", ch);
  svgEl.setAttribute("preserveAspectRatio", "none");

  const serializer = new XMLSerializer();
  let svgStr = serializer.serializeToString(svgEl);
  if (!svgStr.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svgStr = svgStr.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
  const url  = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width  = cw;
      canvas.height = ch;
      // CSS ustawia mountView po obliczeniu letterbox — tu tylko display:block
      canvas.style.cssText = "display:block;";
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#f1f5f9";
      ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(img, 0, 0, cw, ch);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("SVG rasterization failed"));
    };
    img.src = url;
  });
}

// ── Budowanie nakładki SVG (oddzielna warstwa interaktywna) ───────────────────
//
// Oddzielny element SVG z kółkami – nie wpływa na repaint canvasa.

function buildOverlay(svgW, svgH, vbX, vbY, elements, meta, onSelectFn) {
  const NS      = "http://www.w3.org/2000/svg";
  const svgEl   = document.createElementNS(NS, "svg");
  // viewBox + preserveAspectRatio=none → koordynaty nakładki mapują się 1:1 z canvasem.
  // Bez "none" przeglądarka stosuje domyślnie xMidYMid meet, co przy nawet 1px różnicy
  // proporcji (po Math.round dispW/dispH) dodaje wewnętrzny letterbox i przesuwa kropki.
  svgEl.setAttribute("viewBox", `${vbX} ${vbY} ${svgW} ${svgH}`);
  svgEl.setAttribute("preserveAspectRatio", "none");
  // CSS (position/size) ustawia mountView po obliczeniu letterbox

  // SVG root musi mieć pointer-events: auto (domyślne), żeby routować eventy do dzieci.
  // Blokujemy tylko konkretne elementy rysunkowe; circle.hit pozostaje klikalny.
  const styleEl = document.createElementNS(NS, "style");
  styleEl.textContent = [
    "g > circle:not(.hit), g > text { pointer-events: none; }",
    "circle.hit { pointer-events: auto; cursor: pointer; }",
    // Efekt hover: skalowanie wokół własnego środka (transform-box: fill-box)
    "g[data-typ] { transform-box: fill-box; transform-origin: center; transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1); }",
    "g[data-typ]:hover { transform: scale(1.9); }",
  ].join(" ");
  svgEl.appendChild(styleEl);

  const transform = buildTransform(meta, elements);
  const listeners = [];

  if (transform) {
    // Diagnostyka: wypisz pierwsze kilka elementów (rzeczywiste → SVG coords)
    const diagEntries = Object.entries(elements).filter(([,e]) => e.X != null).slice(0, 4);
    if (diagEntries.length) {
      console.log(
        "%c[DwgViewer · overlay · viewBox]%c vbX=%s vbY=%s svgW=%s svgH=%s",
        "color:#10b981;font-weight:bold", "color:#475569",
        vbX, vbY, svgW, svgH
      );
      diagEntries.forEach(([key, el]) => {
        const { svgX, svgY } = transform(el.X, el.Y);
        // Oblicz gdzie kropka pojawi się w pikselach wrappera (bez pan/zoom)
        const pxX = (svgX - vbX) / svgW;  // ułamek 0–1 szerokości overlay
        const pxY = (svgY - vbY) / svgH;  // ułamek 0–1 wysokości overlay
        console.log(
          `  ${key}: realXY=(${el.X}, ${el.Y})  →  svgXY=(${svgX.toFixed(1)}, ${svgY.toFixed(1)})  ` +
          `→  overlay_frac=(${(pxX*100).toFixed(1)}%, ${(pxY*100).toFixed(1)}%)`
        );
      });
    }

    Object.entries(elements).forEach(([key, el]) => {
      if (el.X == null || el.Y == null) return;
      const { svgX, svgY } = transform(el.X, el.Y);
      if (!isFinite(svgX) || !isFinite(svgY)) return;

      const color = dotColor(el.typ);

      const ring = document.createElementNS(NS, "circle");
      ring.setAttribute("cx", svgX); ring.setAttribute("cy", svgY);
      ring.setAttribute("r", "2.5"); ring.setAttribute("fill", color);
      ring.setAttribute("fill-opacity", "0.25");
      ring.setAttribute("stroke", color); ring.setAttribute("stroke-width", "0.6");

      const dot = document.createElementNS(NS, "circle");
      dot.setAttribute("cx", svgX); dot.setAttribute("cy", svgY);
      dot.setAttribute("r", "1.5"); dot.setAttribute("fill", color);
      dot.setAttribute("stroke", "white"); dot.setAttribute("stroke-width", "0.5");

      const label = document.createElementNS(NS, "text");
      label.setAttribute("x", svgX + 2.5); label.setAttribute("y", svgY - 2.5);
      label.setAttribute("font-size", "3.5"); label.setAttribute("fill", color);
      label.setAttribute("font-family", "sans-serif"); label.setAttribute("font-weight", "600");
      label.setAttribute("paint-order", "stroke");
      label.setAttribute("stroke", "white"); label.setAttribute("stroke-width", "1");
      label.setAttribute("stroke-linejoin", "round");
      label.textContent = el.tag ?? key;

      const hit = document.createElementNS(NS, "circle");
      hit.setAttribute("cx", svgX); hit.setAttribute("cy", svgY);
      hit.setAttribute("r", "5");   hit.setAttribute("fill", "transparent");
      hit.classList.add("hit");

      const onClick  = (e) => { e.stopPropagation(); onSelectFn({ el, tag: el.tag ?? key, clientX: e.clientX, clientY: e.clientY }); };
      hit.addEventListener("click", onClick);
      listeners.push({ hit, onClick });

      const g = document.createElementNS(NS, "g");
      g.setAttribute("data-typ", el.typ || "");
      g.appendChild(ring); g.appendChild(dot); g.appendChild(label); g.appendChild(hit);
      svgEl.appendChild(g);
    });
  }

  const cleanup = () => {
    listeners.forEach(({ hit, onClick }) => hit.removeEventListener("click", onClick));
  };

  return { el: svgEl, cleanup };
}

// ── Panel atrybutów ────────────────────────────────────────────────────────────

const HIDDEN_KEYS = new Set(["X", "Y", "_blockName", "tag"]);
const KEY_LABELS = {
  typ: "Typ urządzenia", rola: "Rola", kondygnacja: "Kondygnacja",
  pomieszczenie: "Pomieszczenie", przewód: "Przewód", wysokość: "Wys. montażu",
  wariant: "Wariant", kolor: "Kolor", uwagi: "Uwagi",
};

function AttribPanel({ tag, attrib, pos, onClose, containerRef }) {
  if (!attrib || !pos) return null;

  const entries = Object.entries(attrib).filter(
    ([k, v]) => !HIDDEN_KEYS.has(k) && !k.startsWith("_") && v != null && v !== ""
  );
  const panelW = 290;
  const panelH = Math.min(entries.length * 32 + 80, 380);
  let left = pos.x + 16, top = pos.y - 28;

  if (containerRef?.current) {
    const r = containerRef.current.getBoundingClientRect();
    if (left + panelW > r.width  - 8) left = pos.x - panelW - 16;
    if (top  + panelH > r.height - 8) top  = r.height - panelH - 8;
    if (top  < 8) top = 8;
    if (left < 8) left = 8;
  }

  const color = dotColor(attrib.typ);

  return (
    <AnimatePresence>
      <motion.div
        key="panel"
        initial={{ opacity: 0, scale: 0.93, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93 }}
        transition={{ duration: 0.12 }}
        style={{ position: "absolute", left, top, width: panelW, zIndex: 50 }}
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
          {entries.map(([k, v]) => (
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

function Legend({ elements, activeTypes, onToggle }) {
  const types = {};
  Object.values(elements).forEach(el => {
    if (el.typ && !types[el.typ]) types[el.typ] = dotColor(el.typ);
  });
  const entries = Object.entries(types);
  if (!entries.length) return null;
  const isFiltered = activeTypes && activeTypes.size > 0;
  return (
    <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur border border-slate-200 rounded-lg px-2.5 py-2 shadow-sm z-40 max-w-[240px]">
      {isFiltered && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-[9px] text-blue-500 font-semibold uppercase tracking-wide">Filtr</span>
          <button onClick={() => onToggle(null)} className="text-[9px] text-slate-400 hover:text-slate-600 underline">Pokaż wszystko</button>
        </div>
      )}
      {!isFiltered && (
        <div className="text-[9px] text-slate-400 mb-1">Kliknij typ aby filtrować</div>
      )}
      {entries.map(([typ, color]) => {
        const isActive = !isFiltered || activeTypes.has(typ);
        return (
          <button
            key={typ}
            onClick={() => onToggle(typ)}
            className={`flex items-center gap-1.5 text-[10px] py-0.5 w-full text-left transition-opacity ${isActive ? "text-slate-600" : "text-slate-400 opacity-40"}`}
          >
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: isActive ? color : "#94a3b8" }} />
            <span className="truncate">{typ}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Toolbar ───────────────────────────────────────────────────────────────────

function Toolbar({ scalePct, onZoomIn, onZoomOut, onReset, onFullscreen }) {
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

// ── Pasek ładowania ───────────────────────────────────────────────────────────

function LoadBar({ progress, label }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
      <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
      <div className="w-56 flex flex-col gap-1.5">
        <div className="flex justify-between text-xs text-slate-400">
          <span>{label}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DwgViewer({ projectCode, height = 520, clientMode = false }) {
  const [loadState, setLoadState]     = useState("idle");
  const [loadProg,  setLoadProg]      = useState({ pct: 0, label: "Pobieranie…" });
  const [elements,  setElements]      = useState({});
  const [selected,  setSelected]      = useState(null);
  const [scalePct,  setScalePct]      = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFsHint, setShowFsHint]   = useState(true);
  const [activeTypes, setActiveTypes] = useState(null); // null = pokaż wszystko
  const [floorNames,  setFloorNames]  = useState([]);   // nazwy pięter
  const [activeFloor, setActiveFloor] = useState(0);    // indeks aktywnego piętra
  const containerRef = useRef(null);
  const wrapRef      = useRef(null);
  const svgWrapRef   = useRef(null);   // div – bezpośredni rodzic canvasa i overlay SVG
  const svgContentRef = useRef("");
  const metaRef       = useRef(null);
  const elementsRef   = useRef({});

  const tRef         = useRef({ scale: 1, panX: 0, panY: 0 });
  const dragRef      = useRef(null);
  const hasDragRef   = useRef(false);
  const rafRef       = useRef(null);
  const cleanupRef   = useRef(() => {});
  const overlayElRef = useRef(null);  // referencja do overlay SVG (filtrowanie typów)
  const floorsDataRef = useRef([]);   // pełne dane wszystkich pięter [{ name, svg, attribs }]

  // ── Direct DOM transform (bez React re-render) ────────────────────────────
  const flushTransform = useCallback(() => {
    if (!wrapRef.current) return;
    const { scale, panX, panY } = tRef.current;
    wrapRef.current.style.transform = `translate(${panX}px,${panY}px) scale(${scale})`;
  }, []);

  // ── Filtrowanie typów bloków w overlay ────────────────────────────────────
  const handleToggleType = useCallback((typ) => {
    if (typ === null) { setActiveTypes(null); return; }
    setActiveTypes(prev => {
      if (!prev) return new Set([typ]);
      const next = new Set(prev);
      if (next.has(typ)) { next.delete(typ); return next.size === 0 ? null : next; }
      next.add(typ);
      return next;
    });
  }, []);

  // Aplikuj filtr typów do overlay DOM (bez przebudowy)
  useEffect(() => {
    const overlay = overlayElRef.current;
    if (!overlay) return;
    const groups = overlay.querySelectorAll("g[data-typ]");
    groups.forEach(g => {
      const typ = g.getAttribute("data-typ");
      g.style.display = (!activeTypes || activeTypes.size === 0 || activeTypes.has(typ)) ? "" : "none";
    });
  }, [activeTypes]);

  // ── Montowanie widoku: canvas + overlay SVG ────────────────────────────────
  const mountView = useCallback(async () => {
    const wrap   = svgWrapRef.current;
    const svgStr = svgContentRef.current;
    const m      = metaRef.current;
    const elems  = elementsRef.current;
    if (!wrap || !svgStr) return;

    cleanupRef.current();
    wrap.innerHTML = "";

    // ── Krok 1: parsuj SVG string przez DOMParser (szybko, bez layoutu)
    setLoadProg({ pct: 50, label: "Renderowanie…" });

    const parser    = new DOMParser();
    const doc       = parser.parseFromString(svgStr, "image/svg+xml");
    const parsedSvg = doc.querySelector("svg");

    if (!parsedSvg) {
      // Fallback: innerHTML
      wrap.innerHTML = svgStr;
      setLoadProg({ pct: 100, label: "Gotowe" });
      return;
    }

    // Odczytaj wymiary z viewBox (nie potrzebuje layoutu)
    const vb   = parsedSvg.viewBox?.baseVal;
    const svgW = (vb && vb.width  > 0) ? vb.width  : 1200;
    const svgH = (vb && vb.height > 0) ? vb.height : 900;
    const vbX  = (vb && vb.x  != null) ? vb.x  : 0;
    const vbY  = (vb && vb.y  != null) ? vb.y  : 0;

    // ── Letterbox: dopasuj SVG do kontenera zachowując proporcje (xMidYMid meet)
    const cont   = containerRef.current;
    const contW  = cont ? cont.offsetWidth  : 800;
    const contH  = cont ? cont.offsetHeight : 520;
    const svgAR  = svgW / svgH;
    const contAR = contW / contH;
    let dispW, dispH;
    if (svgAR > contAR) { dispW = contW;              dispH = contW / svgAR; }
    else                { dispH = contH;              dispW = contH * svgAR; }
    dispW = Math.round(dispW);
    dispH = Math.round(dispH);
    const offX = Math.round((contW - dispW) / 2);
    const offY = Math.round((contH - dispH) / 2);
    const layoutCss = `position:absolute;left:${offX}px;top:${offY}px;width:${dispW}px;height:${dispH}px;`;

    console.log(
      "%c[DwgViewer · layout]%c\n" +
      "  SVG viewBox: x=%s y=%s w=%s h=%s\n" +
      "  kontener:    %s × %s px\n" +
      "  wyświetlany: %s × %s px  (offset %s,%s)\n" +
      "  → kropka na 50%% overlay SVG powinna być w centrum rzutu",
      "color:#f59e0b;font-weight:bold", "color:#475569",
      vbX, vbY, svgW, svgH,
      contW, contH,
      dispW, dispH, offX, offY
    );

    // ── Krok 2: rasteryzuj SVG → Canvas
    // rasterizeSvg wewnętrznie liczy rozdzielczość 3× viewBox (ostrość do 3× zooma)
    let canvas = null;
    try {
      canvas = await rasterizeSvg(parsedSvg, svgW, svgH);
    } catch (e) {
      // Fallback: inline SVG z pointer-events injection
      console.warn("DwgViewer: canvas fallback →", e.message);
      wrap.innerHTML = svgStr;
      const svgEl = wrap.querySelector("svg");
      if (svgEl) {
        svgEl.style.width  = "100%";
        svgEl.style.height = "100%";
        svgEl.removeAttribute("width");
        svgEl.removeAttribute("height");
        if (m) {
          const styleEl = document.createElementNS("http://www.w3.org/2000/svg", "style");
          styleEl.textContent = "svg > :not(#__overlay__) * { pointer-events: none !important; } #__overlay__ circle.hit { pointer-events: auto !important; cursor: pointer; }";
          svgEl.insertBefore(styleEl, svgEl.firstChild);
        }
      }
      setLoadProg({ pct: 100, label: "Gotowe" });
      setTimeout(() => setLoadState("ok_mounted"), 300);
      return;
    }

    setLoadProg({ pct: 80, label: "Nakładka…" });

    // ── Krok 3: dołącz canvas z letterbox CSS
    canvas.style.cssText += layoutCss;
    wrap.appendChild(canvas);

    // ── Krok 4: nakładka interaktywna (oddzielny SVG – nie dotyka canvasa)
    const hasCoords = m && Object.values(elems).some(e => e.X != null);
    if (hasCoords) {
      const { el: overlayEl, cleanup } = buildOverlay(svgW, svgH, vbX, vbY, elems, m, ({ tag, attrib, clientX, clientY, el: attEl }) => {
        if (hasDragRef.current) return;
        const rect = containerRef.current?.getBoundingClientRect();
        setSelected({
          tag,
          attrib: attEl,
          pos: rect ? { x: clientX - rect.left, y: clientY - rect.top } : { x: 120, y: 80 },
        });
      });

      overlayEl.addEventListener("click", (e) => {
        if (!hasDragRef.current && !e.target.classList.contains("hit")) setSelected(null);
      });

      // Overlay SVG dostaje ten sam letterbox CSS co canvas
      overlayEl.style.cssText = layoutCss + "overflow:visible;";
      wrap.appendChild(overlayEl);
      overlayElRef.current = overlayEl;
      cleanupRef.current = () => { cleanup(); overlayEl.remove(); overlayElRef.current = null; };
    }

    setLoadProg({ pct: 100, label: "Gotowe" });
    setTimeout(() => setLoadState("ok_mounted"), 300);
  }, []);

  // ── Przełączanie pięter (bez re-fetchu) ──────────────────────────────────
  const switchFloor = useCallback((idx) => {
    const floor = floorsDataRef.current[idx];
    if (!floor) return;
    const { _meta, ...elems } = floor.attribs ?? {};
    svgContentRef.current = floor.svg ?? "";
    metaRef.current       = _meta ?? null;
    elementsRef.current   = elems;
    setElements(elems);
    setSelected(null);
    setActiveTypes(null);
    tRef.current = { scale: 1, panX: 0, panY: 0 };
    setScalePct(100);
    setActiveFloor(idx);
    setLoadState("processing");
  }, []);

  // ── Ładowanie danych z GAS ────────────────────────────────────────────────
  const load = useCallback(async (attempt = 0) => {
    if (!projectCode) return;
    setLoadState("loading");
    setLoadProg({ pct: 5, label: "Pobieranie…" });
    colorCache.clear();
    try {
      setLoadProg({ pct: 20, label: "Pobieranie…" });
      const res = await getDwgViewerContent(projectCode);
      setLoadProg({ pct: 40, label: "Pobieranie…" });

      // GAS zwraca { floors: [...] }
      const floors = res?.floors;
      if (!floors || floors.length === 0) { setLoadState("empty"); return; }

      floorsDataRef.current = floors;
      setFloorNames(floors.map(f => f.name));

      // Załaduj pierwsze piętro
      const first = floors[0];
      const { _meta, ...elems } = first.attribs ?? {};
      svgContentRef.current = first.svg ?? "";
      metaRef.current       = _meta ?? null;
      elementsRef.current   = elems;

      setElements(elems);
      tRef.current = { scale: 1, panX: 0, panY: 0 };
      setScalePct(100);
      setSelected(null);
      setActiveTypes(null);
      setActiveFloor(0);
      setLoadState("processing");
    } catch {
      if (attempt === 0) {
        // Automatyczny retry po 1.5s (pierwsze ładowanie czasem zawodzi)
        setTimeout(() => load(1), 1500);
      } else {
        setLoadState("error");
      }
    }
  }, [projectCode]);

  useEffect(() => { load(); }, [load]);

  // Cleanup overlay tylko przy unmount komponentu
  useEffect(() => () => { cleanupRef.current(); }, []);

  // Po przejściu w stan "processing" → montuj widok.
  // WAŻNE: ten useEffect NIE czyści overlay w return — robiłoby to natychmiast
  // gdy loadState zmienia się z "processing" na "ok_mounted", usuwając overlay
  // zanim użytkownik zdąży kliknąć element.
  useEffect(() => {
    if (loadState !== "processing") return;
    const raf = requestAnimationFrame(() => { mountView(); });
    return () => cancelAnimationFrame(raf);
  }, [loadState, mountView]);

  // ── Pan ───────────────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    hasDragRef.current = false;
    const { panX, panY } = tRef.current;
    dragRef.current = { mx: e.clientX, my: e.clientY, px: panX, py: panY };

    const onMove = (ev) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.mx;
      const dy = ev.clientY - dragRef.current.my;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) hasDragRef.current = true;
      tRef.current.panX = dragRef.current.px + dx;
      tRef.current.panY = dragRef.current.py + dy;
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        flushTransform();
      });
    };

    const onUp = () => {
      dragRef.current = null;
      if (wrapRef.current) wrapRef.current.style.cursor = "grab";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };

    if (wrapRef.current) wrapRef.current.style.cursor = "grabbing";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  }, [flushTransform]);

  // Touch pan (mobile)
  const touchRef = useRef(null);
  const onTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return;
    hasDragRef.current = false;
    const { panX, panY } = tRef.current;
    touchRef.current = { mx: e.touches[0].clientX, my: e.touches[0].clientY, px: panX, py: panY };
  }, []);
  const onTouchMove = useCallback((e) => {
    if (!touchRef.current || e.touches.length !== 1) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - touchRef.current.mx;
    const dy = e.touches[0].clientY - touchRef.current.my;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) hasDragRef.current = true;
    tRef.current.panX = touchRef.current.px + dx;
    tRef.current.panY = touchRef.current.py + dy;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => { rafRef.current = null; flushTransform(); });
  }, [flushTransform]);

  // ── Zoom ─────────────────────────────────────────────────────────────────
  // transformOrigin = "0 0" → skalowanie wokół lewego-górnego rogu wrappera.
  // Formuła: newPan = oldPan + mouseFromTopLeft × (1 − actualRatio)
  // gdzie actualRatio = newScale / oldScale (uwzględnia clamping do 0.1…15).
  const applyZoom = useCallback((newScale, anchorX, anchorY) => {
    const oldScale = tRef.current.scale;
    const clamped  = Math.min(Math.max(newScale, 0.1), 15);
    const ratio    = clamped / oldScale;
    // Poprawna formuła: new_pan = old_pan * ratio + anchor * (1 - ratio)
    // Równoważnie: new_pan = anchor + (old_pan - anchor) * ratio
    // Dowód: punkt pod kursorem ma local = (anchor - old_pan) / old_scale
    //        po zoom: local * new_scale + new_pan = anchor * ratio  + old_pan * ratio
    //                                             ← zmieńmy: nie, sprawdźmy...
    //        local = (anchorX - panX) / oldScale
    //        new_panX = anchorX - local * clamped = anchorX - (anchorX - panX)/oldScale * clamped
    //                 = anchorX - (anchorX - panX) * ratio = anchorX*(1-ratio) + panX*ratio
    tRef.current.panX  = anchorX * (1 - ratio) + tRef.current.panX  * ratio;
    tRef.current.panY  = anchorY * (1 - ratio) + tRef.current.panY  * ratio;
    tRef.current.scale = clamped;
    flushTransform();
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        setScalePct(Math.round(tRef.current.scale * 100));
      });
    }
  }, [flushTransform]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    applyZoom(tRef.current.scale * (e.deltaY < 0 ? 1.12 : 0.9), mx, my);
  }, [applyZoom]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const handleReset = useCallback(() => {
    tRef.current = { scale: 1, panX: 0, panY: 0 };
    flushTransform();
    setScalePct(100);
    setSelected(null);
  }, [flushTransform]);

  // ── Render ────────────────────────────────────────────────────────────────
  const isLoaded = loadState === "ok_mounted";

  const containerStyle = isFullscreen
    ? { position: "fixed", inset: 0, zIndex: 9999, background: "#f1f5f9", borderRadius: 0 }
    : { position: "relative", height, borderRadius: 16, overflow: "hidden", border: "1px solid #e2e8f0", background: "#f1f5f9" };

  return (
    <div
      style={containerStyle}
      ref={containerRef}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
    >

      {/* Pasek ładowania */}
      {(loadState === "loading" || loadState === "processing") && (
        <LoadBar progress={loadProg.pct} label={loadProg.label} />
      )}

      {loadState === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <span className="text-sm text-slate-500">Nie udało się załadować pliku</span>
          <button onClick={() => load()} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50">
            <RefreshCw className="w-3.5 h-3.5" /> Spróbuj ponownie
          </button>
        </div>
      )}

      {loadState === "empty" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-8 text-center">
          <span className="text-2xl">📐</span>
          {clientMode ? (
            <>
              <span className="text-sm font-medium text-slate-600">Projekt automatyki będzie dostępny wkrótce</span>
              <span className="text-xs text-slate-400">Trwają prace nad dokumentacją Twojej instalacji</span>
            </>
          ) : (
            <>
              <span className="text-sm font-medium text-slate-600">Brak pliku rzutu</span>
              <span className="text-xs text-slate-400 leading-relaxed">
                Umieść <code className="bg-slate-100 px-1 rounded">projekt.svg</code> i{" "}
                <code className="bg-slate-100 px-1 rounded">projekt.json</code> w folderze projektu na Drive.
                <br />
                Wiele pięter:{" "}
                <code className="bg-slate-100 px-1 rounded">projekt_Parter.svg</code>,{" "}
                <code className="bg-slate-100 px-1 rounded">projekt_Piętro.svg</code> itd.
              </span>
            </>
          )}
        </div>
      )}

      {/* Widok rzutu (canvas + overlay) */}
      <div
        style={{
          position: "absolute", inset: 0,
          // Ukryjemy div zanim canvas będzie gotowy żeby nie migał
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 0.3s",
          pointerEvents: isLoaded ? "auto" : "none",
        }}
      >
        {/*
          Pan/zoom wrapper — GPU compositor layer.
          Canvas wewnątrz to pojedyncza tekstura GPU.
          Pan = przesunięcie tekstury, zero repaintu SVG.
        */}
        <div
          ref={wrapRef}
          style={{
            position: "absolute", top: 0, left: 0,
            width: "100%", height: "100%",
            transform: "translate(0px,0px) scale(1)",
            transformOrigin: "0 0",
            willChange: "transform",
            cursor: "grab",
            userSelect: "none",
          }}
        >
          <div ref={svgWrapRef} style={{ position: "relative", width: "100%", height: "100%" }} />
        </div>

        {/* Przełącznik pięter – zawsze widoczny gdy są dane (nie tylko po załadowaniu) */}
        {floorNames.length > 1 && (loadState === "ok_mounted" || loadState === "processing") && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/90 backdrop-blur border border-slate-200 rounded-lg p-1 shadow-sm z-40 pointer-events-auto">
            {floorNames.map((name, idx) => (
              <button
                key={name}
                onClick={() => switchFloor(idx)}
                disabled={loadState === "processing"}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors disabled:opacity-60 ${
                  idx === activeFloor
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        {isLoaded && (
          <>
            <Toolbar
              scalePct={scalePct}
              onZoomIn={() => {
                const c = containerRef.current;
                applyZoom(tRef.current.scale * 1.2, c ? c.offsetWidth / 2 : 0, c ? c.offsetHeight / 2 : 0);
              }}
              onZoomOut={() => {
                const c = containerRef.current;
                applyZoom(tRef.current.scale / 1.2, c ? c.offsetWidth / 2 : 0, c ? c.offsetHeight / 2 : 0);
              }}
              onReset={handleReset}
              onFullscreen={() => { setIsFullscreen(f => !f); setShowFsHint(false); }}
            />

            {isFullscreen && (
              <button onClick={() => setIsFullscreen(false)}
                className="absolute top-3 left-3 p-1.5 rounded-lg bg-white/90 border border-slate-200 shadow-sm text-slate-600 hover:text-slate-800 z-40">
                <X className="w-4 h-4" />
              </button>
            )}

            {Object.keys(elements).length > 0 && <Legend elements={elements} activeTypes={activeTypes} onToggle={handleToggleType} />}

            {/* Adnotacja: zalecany tryb pełnoekranowy */}
            {!isFullscreen && showFsHint && (
              <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-[11px] px-2.5 py-1.5 rounded-lg shadow-sm z-40 max-w-[220px]">
                <Maximize2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Zalecany tryb pełnoekranowy dla komfortu pracy</span>
                <button onClick={() => setShowFsHint(false)} className="text-blue-400 hover:text-blue-600 flex-shrink-0 ml-1">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <AttribPanel
              tag={selected?.tag}
              attrib={selected?.attrib}
              pos={selected?.pos}
              onClose={() => setSelected(null)}
              containerRef={containerRef}
            />
          </>
        )}

      </div>
    </div>
  );
}
