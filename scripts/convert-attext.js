#!/usr/bin/env node
/**
 * convert-attext.js — Konwerter eksportu ATTEXT (NanoCAD) do projekt.json
 *
 * Użycie:
 *   node scripts/convert-attext.js projekt.txt [opcje] > projekt.json
 *
 * Opcje:
 *   --scale=20        Skala wydruku (np. 1:20 → podaj 20). Default: auto
 *   --margin=200      Margines wokół elementów w mm. Default: 300
 *   --flip-y          Odwróć oś Y (domyślnie WŁĄCZONE, bo SVG ma Y w dół)
 *
 * Format pliku .txt z ATTEXT (kolejność kolumn):
 *   X, Y, Tag, Typ, Rola, Kondygnacja, Pomieszczenie, Przewód,
 *   Wysokość, Wariant, Kolor, Uwagi
 *
 * Wyjście projekt.json:
 *   {
 *     "_meta": {
 *       "scale": 20,          ← skala wydruku (dostosuj jeśli punkty nie trafiają)
 *       "originX": 5488,      ← lewy dolny narożnik widoku w mm (model space)
 *       "originY": 3203,      ← lewy dolny narożnik widoku w mm (model space)
 *       "svgWidth": 898.06,   ← szerokość SVG (z pliku SVG)
 *       "svgHeight": 635.04,  ← wysokość SVG (z pliku SVG)
 *       "flipY": true         ← czy odwrócić oś Y
 *     },
 *     "WL8": { "X": 7243.42, "Y": 8573.85, "tag": "WL8", ... },
 *     ...
 *   }
 *
 * Jak dobrać skalę:
 *   1. Otwórz SVG w przeglądarce (zakładka "Rzut DWG" z włączonym overlay)
 *   2. Jeśli punkty są za małe (skupione) → zmniejsz scale
 *   3. Jeśli punkty wychodzą poza rysunek → zwiększ scale
 *   4. Możesz też podać 2 punkty kalibracyjne w _meta.calibration
 *
 * Alternatywna kalibracja (zamiast scale/origin, 2 znane punkty):
 *   W _meta dodaj:
 *   "calibration": [
 *     { "tag": "WL1", "svgX": 234.5, "svgY": 178.3 },
 *     { "tag": "WL8", "svgX": 56.2,  "svgY": 412.7 }
 *   ]
 *   SVG-owe współrzędne sprawdź klikając "Ustaw punkt kalibracyjny" w viewerze.
 */

const fs   = require("fs");
const path = require("path");

// ── Parsowanie argumentów ──────────────────────────────────────────────────────
const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith("--"));
if (!file) {
  console.error("Użycie: node convert-attext.js <plik.txt> [--scale=20] [--margin=300] [--svg-width=898.06] [--svg-height=635.04]");
  process.exit(1);
}

function getArg(name, def) {
  const a = args.find(a => a.startsWith(`--${name}=`));
  return a ? a.split("=")[1] : def;
}

const forceScale  = getArg("scale",      null);
const margin      = parseFloat(getArg("margin",     "300"));
const svgWidthArg = parseFloat(getArg("svg-width",  "0"));
const svgHeightArg= parseFloat(getArg("svg-height", "0"));
const noFlipY     = args.includes("--no-flip-y");

// ── Parsowanie TXT ─────────────────────────────────────────────────────────────
const text  = fs.readFileSync(file, "utf8");
const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

/**
 * Parsuje jedną linię ATTEXT: wartości rozdzielone przecinkami, opcjonalnie
 * otoczone apostrofami ('wartość') lub bez cudzysłowów (liczby).
 */
function parseLine(line) {
  const parts = [];
  let current = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === "'" && !inQuote)  { inQuote = true;  continue; }
    if (ch === "'" && inQuote)   { inQuote = false; continue; }
    if (ch === "," && !inQuote)  { parts.push(current.trim()); current = ""; continue; }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

const elements = [];
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

for (const line of lines) {
  const parts = parseLine(line);
  if (parts.length < 3) continue;

  const x   = parseFloat(parts[0]);
  const y   = parseFloat(parts[1]);
  const tag = parts[2];

  if (isNaN(x) || isNaN(y) || !tag) continue;

  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minY = Math.min(minY, y); maxY = Math.max(maxY, y);

  elements.push({
    X:           x,
    Y:           y,
    tag,
    typ:         parts[3]  || "",
    rola:        parts[4]  || "",
    kondygnacja: parts[5]  || "",
    pomieszczenie: parts[6] || "",
    przewód:     parts[7]  || "",
    wysokość:    parts[8]  || "",
    wariant:     parts[9]  || "",
    kolor:       parts[10] || "",
    uwagi:       parts[11] || "",
  });
}

if (elements.length === 0) {
  console.error("Nie znaleziono elementów w pliku. Sprawdź format.");
  process.exit(1);
}

// ── Obliczenie metadanych ──────────────────────────────────────────────────────
const modelW = maxX - minX;
const modelH = maxY - minY;

// Jeśli podano rozmiary SVG, oblicz skalę automatycznie
let scale;
if (forceScale) {
  scale = parseFloat(forceScale);
} else if (svgWidthArg && svgHeightArg) {
  const scaleX = modelW / svgWidthArg;
  const scaleY = modelH / svgHeightArg;
  scale = Math.round((scaleX + scaleY) / 2);
  console.error(`Auto-obliczona skala: ${scale} (X: ${scaleX.toFixed(1)}, Y: ${scaleY.toFixed(1)})`);
  console.error("Jeśli punkty nie trafiają dokładnie, podaj --scale=<wartość> ręcznie.");
} else {
  // Brak info o SVG — zakładamy skalę 1:20 jako punkt startowy
  scale = 20;
  console.error(`Brak wymiarów SVG — przyjęto scale=${scale}. Podaj --svg-width=<W> --svg-height=<H> z pliku SVG lub --scale=<N>.`);
}

const originX = minX - margin;
const originY = minY - margin;

// svgHeight potrzebne do Y-flip
const svgHeight = svgHeightArg || Math.round((modelH + margin * 2) / scale * 10) / 10;
const svgWidth  = svgWidthArg  || Math.round((modelW + margin * 2) / scale * 10) / 10;

// ── Budowanie JSON ─────────────────────────────────────────────────────────────
const output = {
  _meta: {
    scale,
    originX,
    originY,
    svgWidth,
    svgHeight,
    flipY: !noFlipY,
    // Kalibracja alternatywna — odkomentuj i wypełnij ręcznie:
    // calibration: [
    //   { tag: "WL1", svgX: 0, svgY: 0 },
    //   { tag: "WL8", svgX: 0, svgY: 0 }
    // ]
  },
};

for (const el of elements) {
  output[el.tag] = el;
}

console.log(JSON.stringify(output, null, 2));
console.error(`\nGotowe: ${elements.length} elementów`);
console.error(`Zakres modelu: X ${minX.toFixed(0)}–${maxX.toFixed(0)}, Y ${minY.toFixed(0)}–${maxY.toFixed(0)}`);
console.error(`Podaj wymiary SVG z pliku (width=, height= z tagu <svg>) żeby poprawić automatyczne dopasowanie.`);
