#!/usr/bin/env python3
"""
generate_json.py — Generuje projekt.json z projekt.svg + projekt.txt (ATTEXT)

Użycie:
    python generate_json.py                        # pliki w bieżącym folderze
    python generate_json.py /ścieżka/do/folderu   # podaj folder
    python generate_json.py --scale=20             # wymuś skalę

Co robi:
    1. Odczytuje viewBox z projekt.svg (wymiary w jednostkach SVG)
    2. Parsuje projekt.txt (eksport ATTEXT z NanoCAD)
    3. Automatycznie oblicza skalę i przesunięcie układu współrzędnych
    4. Generuje projekt.json gotowy do wgrania na Google Drive

Format projekt.txt (kolumny rozdzielone przecinkami):
    X, Y, Tag, Typ, Rola, Kondygnacja, Pomieszczenie, Przewód,
    Wysokość, Wariant, Kolor, Uwagi

Jak działa transformacja współrzędnych:
    SVG z Inkscape (import DXF) ma oś Y odwróconą względem CAD.
    Skrypt liczy: svgX = (modelX - originX) / scale
                  svgY = svgHeight - (modelY - originY) / scale
    originX/Y = lewy dolny narożnik "rysunku" w przestrzeni modelu (z marginesem)
"""

import re
import json
import sys
import os
import math


# ── Typowe skale CAD ──────────────────────────────────────────────────────────
STANDARD_SCALES = [5, 10, 15, 20, 25, 33, 40, 50, 75, 100, 150, 200]


# ── Parsowanie SVG ────────────────────────────────────────────────────────────

def parse_svg(path):
    """Zwraca (svgWidth, svgHeight) z viewBox lub atrybutów width/height."""
    with open(path, encoding="utf-8") as f:
        content = f.read(4096)  # tylko nagłówek, plik może być duży

    # viewBox="minX minY width height"
    m = re.search(r'viewBox\s*=\s*["\']([^"\']+)["\']', content)
    if m:
        parts = m.group(1).split()
        if len(parts) == 4:
            return float(parts[2]), float(parts[3])

    # width="..." height="..."
    w = re.search(r'\bwidth\s*=\s*["\']([0-9.]+)', content)
    h = re.search(r'\bheight\s*=\s*["\']([0-9.]+)', content)
    if w and h:
        return float(w.group(1)), float(h.group(1))

    raise ValueError("Nie można odczytać wymiarów SVG (brak viewBox/width/height)")


# ── Parsowanie TXT (ATTEXT) ───────────────────────────────────────────────────

def parse_attext_line(line):
    """
    Parsuje jedną linię ATTEXT: wartości oddzielone przecinkami,
    teksty mogą być w apostrofach lub bez.
    Zwraca listę wartości (string).
    """
    parts = []
    current = ""
    in_quote = False

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


def parse_txt(path):
    """
    Parsuje plik ATTEXT. Zwraca listę słowników z kluczami:
    X, Y, tag, typ, rola, kondygnacja, pomieszczenie, przewód,
    wysokość, wariant, kolor, uwagi
    """
    elements = []
    tag_counts = {}

    with open(path, encoding="utf-8", errors="replace") as f:
        for lineno, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue

            parts = parse_attext_line(line)
            if len(parts) < 3:
                continue

            try:
                x = float(parts[0])
                y = float(parts[1])
            except ValueError:
                print(f"  [pomiń] linia {lineno}: nie można odczytać X,Y → {line[:60]}", file=sys.stderr)
                continue

            tag = parts[2] if len(parts) > 2 else ""
            if not tag:
                continue

            # Obsługa duplikatów tagów (np. OS8 pojawia się kilka razy)
            tag_counts[tag] = tag_counts.get(tag, 0) + 1
            unique_tag = tag if tag_counts[tag] == 1 else f"{tag}_{tag_counts[tag]}"

            def col(i): return parts[i].strip() if i < len(parts) else ""

            elements.append({
                "X":             round(x, 3),
                "Y":             round(y, 3),
                "tag":           tag,           # oryginalny tag (może być duplikat)
                "typ":           col(3),
                "rola":          col(4),
                "kondygnacja":   col(5),
                "pomieszczenie": col(6),
                "przewód":       col(7),
                "wysokość":      col(8),
                "wariant":       col(9),
                "kolor":         col(10),
                "uwagi":         col(11),
                "_key":          unique_tag,    # klucz w JSON (unikalny)
            })

    return elements


# ── Automatyczne obliczanie transformacji ────────────────────────────────────

def compute_transform(elements, svg_w, svg_h, force_scale=None, margin_ratio=0.05):
    """
    Oblicza (scale, originX, originY) dla transformacji:
        svgX = (modelX - originX) / scale
        svgY = svgHeight - (modelY - originY) / scale

    Jeśli force_scale jest podane, używa go.
    W przeciwnym razie próbuje dobrać skalę ze standardowych wartości CAD.
    """
    xs = [e["X"] for e in elements]
    ys = [e["Y"] for e in elements]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    data_w = max_x - min_x
    data_h = max_y - min_y

    if force_scale:
        scale = force_scale
    else:
        # Skala która pozwoli zmieścić dane w SVG z marginesem
        usable_w = svg_w * (1 - 2 * margin_ratio)
        usable_h = svg_h * (1 - 2 * margin_ratio)
        raw_scale_x = data_w / usable_w if usable_w > 0 else 1
        raw_scale_y = data_h / usable_h if usable_h > 0 else 1
        raw_scale = max(raw_scale_x, raw_scale_y)

        # Dopasuj do najbliższej standardowej skali CAD
        best = min(STANDARD_SCALES, key=lambda s: abs(s - raw_scale))
        scale = best

        print(f"  Auto-skala surowa: {raw_scale:.2f} → dobrano {scale} "
              f"(błąd: {abs(best - raw_scale)/raw_scale*100:.1f}%)", file=sys.stderr)

    # Origin: lewy dolny narożnik rysunku w przestrzeni modelu
    # Przesunięcie tak, żeby dane były wyśrodkowane w SVG
    rendered_w = data_w / scale
    rendered_h = data_h / scale
    margin_x = (svg_w - rendered_w) / 2 * scale
    margin_y = (svg_h - rendered_h) / 2 * scale

    origin_x = min_x - margin_x
    origin_y = min_y - margin_y

    return scale, round(origin_x, 3), round(origin_y, 3)


def verify_transform(elements, scale, origin_x, origin_y, svg_w, svg_h):
    """Sprawdza ile elementów trafia w granice SVG. Wypisuje ostrzeżenie."""
    ok = 0
    out = []
    for e in elements:
        svgx = (e["X"] - origin_x) / scale
        svgy = svg_h - (e["Y"] - origin_y) / scale
        if 0 <= svgx <= svg_w and 0 <= svgy <= svg_h:
            ok += 1
        else:
            out.append(e["_key"])

    print(f"  Weryfikacja: {ok}/{len(elements)} elementów w granicach SVG", file=sys.stderr)
    if out:
        print(f"  Poza granicami: {', '.join(out[:10])}"
              + (f" ... (+{len(out)-10})" if len(out) > 10 else ""), file=sys.stderr)
        print(f"  → Spróbuj podać --scale=<wartość> ręcznie", file=sys.stderr)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    # Argumenty
    folder = "."
    force_scale = None

    for arg in sys.argv[1:]:
        if arg.startswith("--scale="):
            force_scale = float(arg.split("=")[1])
        elif not arg.startswith("--"):
            folder = arg

    svg_path  = os.path.join(folder, "projekt.svg")
    txt_path  = os.path.join(folder, "projekt.txt")
    json_path = os.path.join(folder, "projekt.json")

    # Sprawdź czy pliki istnieją
    for p in [svg_path, txt_path]:
        if not os.path.exists(p):
            print(f"Błąd: nie znaleziono pliku {p}", file=sys.stderr)
            sys.exit(1)

    print(f"Wczytuję: {svg_path}", file=sys.stderr)
    svg_w, svg_h = parse_svg(svg_path)
    print(f"  SVG: {svg_w:.3f} × {svg_h:.3f} jednostek", file=sys.stderr)

    print(f"Wczytuję: {txt_path}", file=sys.stderr)
    elements = parse_txt(txt_path)
    print(f"  Znaleziono {len(elements)} elementów", file=sys.stderr)

    if not elements:
        print("Błąd: brak elementów w pliku TXT", file=sys.stderr)
        sys.exit(1)

    print("Obliczam transformację...", file=sys.stderr)
    scale, origin_x, origin_y = compute_transform(
        elements, svg_w, svg_h, force_scale=force_scale
    )
    print(f"  scale={scale}, originX={origin_x:.1f}, originY={origin_y:.1f}", file=sys.stderr)

    verify_transform(elements, scale, origin_x, origin_y, svg_w, svg_h)

    # Buduj JSON
    output = {
        "_meta": {
            "scale":     scale,
            "originX":   origin_x,
            "originY":   origin_y,
            "svgWidth":  round(svg_w, 3),
            "svgHeight": round(svg_h, 3),
            "flipY":     True,
            # Jeśli punkty nie trafiają dokładnie:
            # 1. Zmień scale (--scale=25, --scale=15 itp.)
            # 2. Lub dodaj ręcznie calibration z 2 znanych punktów:
            # "calibration": [
            #   {"tag": "WL1", "svgX": 0, "svgY": 0},
            #   {"tag": "WL8", "svgX": 0, "svgY": 0}
            # ]
        }
    }

    for el in elements:
        key = el.pop("_key")
        output[key] = el

    # Zapisz
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\nZapisano: {json_path}", file=sys.stderr)
    print(f"Gotowe! {len(elements)} elementów, skala 1:{scale}", file=sys.stderr)
    print(f"\nJeśli punkty nie trafiają na elementy, spróbuj:", file=sys.stderr)
    print(f"  python generate_json.py {folder} --scale=25", file=sys.stderr)
    print(f"  python generate_json.py {folder} --scale=15", file=sys.stderr)


if __name__ == "__main__":
    main()
