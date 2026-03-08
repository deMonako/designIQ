#!/usr/bin/env python3
"""
generate_json.py — Generuje projekt.json z projekt.svg + projekt.txt (ATTEXT)

Użycie:
    python generate_json.py                        # pliki w bieżącym folderze
    python generate_json.py /ścieżka/do/folderu   # podaj folder
    python generate_json.py --scale=20             # wymuś skalę (bez REF bloków)
    python generate_json.py --margin=0.02          # margines SVG (domyślnie 0.02 = 2%)

Sposób kalibracji (zalecany — najdokładniejszy):
    1. W NanoCAD umieść 4 bloki REF w rogach rysunku/arkusza:
          REF1 = lewy dolny   REF2 = prawy dolny
          REF3 = lewy górny   REF4 = prawy górny
    2. Eksportuj ATTEXT normalnie (REF bloki pojawiają się w pliku TXT)
    3. Skrypt wykryje je automatycznie i użyje do kalibracji
    4. Bloki REF NIE trafią do wyjściowego JSON

Bez REF bloków:
    Skrypt szacuje skalę z zakresu współrzędnych vs. SVG viewBox.
    Używaj --scale=N jeśli wynik jest niedokładny.

Transformacja współrzędnych:
    svgX = (modelX - originX) / scale
    svgY = svgHeight - (modelY - originY) / scale   [Y odwrócone]
"""

import re
import json
import sys
import os


STANDARD_SCALES = [5, 10, 15, 20, 25, 33, 40, 50, 75, 100, 150, 200]


# ── Parsowanie SVG ─────────────────────────────────────────────────────────────

def parse_svg(path):
    """Zwraca (svgWidth, svgHeight, viewBox_minX, viewBox_minY)."""
    with open(path, encoding="utf-8") as f:
        header = f.read(4096)

    m = re.search(r'viewBox\s*=\s*["\']([^"\']+)["\']', header)
    if m:
        parts = m.group(1).split()
        if len(parts) == 4:
            return float(parts[2]), float(parts[3]), float(parts[0]), float(parts[1])

    w = re.search(r'\bwidth\s*=\s*["\']([0-9.]+)', header)
    h = re.search(r'\bheight\s*=\s*["\']([0-9.]+)', header)
    if w and h:
        return float(w.group(1)), float(h.group(1)), 0.0, 0.0

    raise ValueError("Nie można odczytać wymiarów SVG (brak viewBox/width/height)")


# ── Parsowanie TXT (ATTEXT) ────────────────────────────────────────────────────

def parse_attext_line(line):
    """Parsuje jedną linię CSV z opcjonalnymi apostrofami."""
    parts, current, in_quote = [], "", False
    for ch in line:
        if ch == "'" and not in_quote:
            in_quote = True
        elif ch == "'" and in_quote:
            in_quote = False
        elif ch == "," and not in_quote:
            parts.append(current.strip())
            current = ""
        else:
            current += ch
    if current.strip():
        parts.append(current.strip())
    return parts


def detect_encoding(path):
    """Próbuje UTF-8, potem CP1250 (NanoCAD/Windows), na końcu latin-1."""
    for enc in ("utf-8-sig", "utf-8", "cp1250", "latin-1"):
        try:
            with open(path, encoding=enc) as f:
                content = f.read()
            if enc in ("utf-8-sig", "utf-8") and "\ufffd" in content:
                continue
            return content, enc
        except (UnicodeDecodeError, LookupError):
            continue
    with open(path, encoding="latin-1") as f:
        return f.read(), "latin-1"


def parse_txt(path):
    """Parsuje plik ATTEXT. Zwraca listę elementów jako słowniki."""
    content, enc = detect_encoding(path)
    print(f"  Kodowanie pliku TXT: {enc}", file=sys.stderr)

    elements = []
    tag_counts = {}

    for lineno, line in enumerate(content.splitlines(), 1):
        line = line.strip()
        if not line:
            continue

        parts = parse_attext_line(line)
        if len(parts) < 3:
            continue

        try:
            x, y = float(parts[0]), float(parts[1])
        except ValueError:
            print(f"  [pomiń] linia {lineno}: brak X,Y → {line[:60]}", file=sys.stderr)
            continue

        tag = parts[2]
        if not tag:
            continue

        tag_counts[tag] = tag_counts.get(tag, 0) + 1
        unique_tag = tag if tag_counts[tag] == 1 else f"{tag}_{tag_counts[tag]}"

        def col(i): return parts[i].strip() if i < len(parts) else ""

        elements.append({
            "X":             round(x, 3),
            "Y":             round(y, 3),
            "tag":           tag,
            "typ":           col(3),
            "rola":          col(4),
            "kondygnacja":   col(5),
            "pomieszczenie": col(6),
            "przewód":       col(7),
            "wysokość":      col(8),
            "wariant":       col(9),
            "kolor":         col(10),
            "uwagi":         col(11),
            "_key":          unique_tag,
        })

    return elements


# ── Kalibracja przez bloki REF ─────────────────────────────────────────────────

def calibrate_with_ref(elements, svg_w, svg_h, margin_ratio):
    """
    Jeśli w danych są bloki REF1–REF4 (lub REF_BL, REF_TR itp.),
    używa ich jako punktów kalibracyjnych.

    Zakłada że REF bloki leżą w rogach arkusza rysunkowego,
    który odpowiada SVG viewBox z marginesem `margin_ratio`.

    Zwraca (scale, originX, originY) lub None jeśli brak REF bloków.
    """
    ref = [e for e in elements if e["tag"].upper().startswith("REF")]
    if len(ref) < 2:
        return None

    print(f"  Znaleziono {len(ref)} bloków REF: {[r['tag'] for r in ref]}", file=sys.stderr)

    # Zakres modelu wyznaczony przez REF bloki = zakres arkusza
    ref_xs = [r["X"] for r in ref]
    ref_ys = [r["Y"] for r in ref]
    model_left   = min(ref_xs)
    model_right  = max(ref_xs)
    model_bottom = min(ref_ys)
    model_top    = max(ref_ys)
    model_w = model_right - model_left
    model_h = model_top - model_bottom

    if model_w < 1 or model_h < 1:
        print("  REF bloki zbyt blisko siebie — ignoruję kalibrację REF", file=sys.stderr)
        return None

    # Arkusz w SVG = viewBox minus margines po obu stronach
    svg_usable_w = svg_w * (1 - 2 * margin_ratio)
    svg_usable_h = svg_h * (1 - 2 * margin_ratio)

    scale_x = model_w / svg_usable_w
    scale_y = model_h / svg_usable_h

    # Sprawdź spójność (skala powinna być izotropowa ±15%)
    diff = abs(scale_x - scale_y) / max(scale_x, scale_y)
    if diff > 0.15:
        print(f"  Uwaga: skala X={scale_x:.3f} vs Y={scale_y:.3f} różnią się o {diff*100:.1f}%", file=sys.stderr)
        print(f"  Możliwe że margines SVG jest inny niż {margin_ratio*100:.0f}% — spróbuj --margin=0.03", file=sys.stderr)

    # Użyj średniej skali
    scale = (scale_x + scale_y) / 2

    # Origin: lewy dolny narożnik arkusza w modelu
    origin_x = model_left  - svg_w * margin_ratio * scale
    origin_y = model_bottom - svg_h * margin_ratio * scale

    print(f"  Kalibracja REF: scale={scale:.4f}, originX={origin_x:.1f}, originY={origin_y:.1f}", file=sys.stderr)
    return scale, round(origin_x, 3), round(origin_y, 3)


# ── Auto-skalowanie (fallback) ─────────────────────────────────────────────────

def compute_transform_auto(elements, svg_w, svg_h, force_scale=None, margin_ratio=0.05):
    """Oblicza transformację z zakresu wszystkich elementów."""
    xs = [e["X"] for e in elements]
    ys = [e["Y"] for e in elements]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    data_w = max_x - min_x
    data_h = max_y - min_y

    if force_scale:
        scale = force_scale
        print(f"  Skala wymuszona: {scale}", file=sys.stderr)
    else:
        usable_w = svg_w * (1 - 2 * margin_ratio)
        usable_h = svg_h * (1 - 2 * margin_ratio)
        raw_x = data_w / usable_w if usable_w > 0 else 1
        raw_y = data_h / usable_h if usable_h > 0 else 1
        raw   = max(raw_x, raw_y)
        scale = min(STANDARD_SCALES, key=lambda s: abs(s - raw))
        print(f"  Auto-skala: surowa={raw:.2f} → CAD {scale} "
              f"(błąd: {abs(scale - raw)/raw*100:.1f}%)", file=sys.stderr)

    rendered_w = data_w / scale
    rendered_h = data_h / scale
    margin_x = (svg_w - rendered_w) / 2 * scale
    margin_y = (svg_h - rendered_h) / 2 * scale
    origin_x = min_x - margin_x
    origin_y = min_y - margin_y

    return scale, round(origin_x, 3), round(origin_y, 3)


def verify_transform(elements, scale, origin_x, origin_y, svg_w, svg_h):
    ok, out = 0, []
    for e in elements:
        sx = (e["X"] - origin_x) / scale
        sy = svg_h - (e["Y"] - origin_y) / scale
        if 0 <= sx <= svg_w and 0 <= sy <= svg_h:
            ok += 1
        else:
            out.append(e.get("_key", e.get("tag", "?")))
    print(f"  Weryfikacja: {ok}/{len(elements)} elementów w granicach SVG", file=sys.stderr)
    if out:
        print(f"  Poza granicami: {', '.join(out[:10])}"
              + (f" (+{len(out)-10} więcej)" if len(out) > 10 else ""), file=sys.stderr)
        print("  → Spróbuj --scale=25 albo --scale=15, lub dodaj bloki REF", file=sys.stderr)


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    folder = "."
    force_scale  = None
    margin_ratio = 0.02  # 2% margines SVG (typowe dla NanoCAD)

    for arg in sys.argv[1:]:
        if arg.startswith("--scale="):
            force_scale = float(arg.split("=")[1])
        elif arg.startswith("--margin="):
            margin_ratio = float(arg.split("=")[1])
        elif not arg.startswith("--"):
            folder = arg

    svg_path  = os.path.join(folder, "projekt.svg")
    txt_path  = os.path.join(folder, "projekt.txt")
    json_path = os.path.join(folder, "projekt.json")

    for p in [svg_path, txt_path]:
        if not os.path.exists(p):
            print(f"Błąd: nie znaleziono pliku {p}", file=sys.stderr)
            sys.exit(1)

    print(f"Wczytuję: {svg_path}", file=sys.stderr)
    svg_w, svg_h, vb_x, vb_y = parse_svg(svg_path)
    print(f"  SVG viewBox: {svg_w:.3f} × {svg_h:.3f} (offset {vb_x},{vb_y})", file=sys.stderr)

    print(f"Wczytuję: {txt_path}", file=sys.stderr)
    elements = parse_txt(txt_path)

    # Odfiltruj REF bloki z listy elementów (nie trafiają do JSON)
    ref_elements = [e for e in elements if e["tag"].upper().startswith("REF")]
    data_elements = [e for e in elements if not e["tag"].upper().startswith("REF")]

    print(f"  Elementy: {len(data_elements)} roboczych + {len(ref_elements)} REF", file=sys.stderr)

    if not data_elements:
        print("Błąd: brak elementów w pliku TXT", file=sys.stderr)
        sys.exit(1)

    # Kalibracja
    print("Obliczam transformację...", file=sys.stderr)
    result = None

    if ref_elements and not force_scale:
        result = calibrate_with_ref(ref_elements, svg_w, svg_h, margin_ratio)

    if result is None:
        result = compute_transform_auto(data_elements, svg_w, svg_h, force_scale, margin_ratio)

    scale, origin_x, origin_y = result
    verify_transform(data_elements, scale, origin_x, origin_y, svg_w, svg_h)

    # Buduj JSON
    output = {
        "_meta": {
            "scale":           scale,
            "originX":         origin_x,
            "originY":         origin_y,
            "svgWidth":        round(svg_w, 3),
            "svgHeight":       round(svg_h, 3),
            "flipY":           True,
            "calibratedWith":  "REF" if ref_elements else "auto",
        }
    }

    for el in data_elements:
        key = el.pop("_key")
        output[key] = el

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\nZapisano: {json_path}  ({len(data_elements)} elementów, skala 1:{scale:.2f})", file=sys.stderr)
    if not ref_elements:
        print("\nTIP: Dla dokładniejszego wyniku umieść bloki REF1/REF2/REF3/REF4", file=sys.stderr)
        print("     w 4 rogach arkusza w NanoCAD — skrypt użyje ich do kalibracji.", file=sys.stderr)
        print(f"\n     Jeśli nadal przesunięte: python generate_json.py {folder} --scale=25", file=sys.stderr)


if __name__ == "__main__":
    main()
