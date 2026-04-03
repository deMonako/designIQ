#!/usr/bin/env python3
"""
konwertuj_cdf.py — Konwertuje polskie znaki w pliku CDF/TXT do notacji DXF \\U+XXXX

Działa z plikami UTF-8 (eksport z panelu admina) oraz CP1250 (eksport z NanoCAD).
Encoding jest wykrywany automatycznie.

Uzywanie:
    python konwertuj_cdf.py projekt.txt
    konwertuj_cdf.bat projekt.txt   (Windows)

Wynik: projekt_dxf.txt gotowy do importu poleceniem ATTIN_SYMBOL w NanoCAD.
"""

import sys
import os


def to_dxf_unicode(text):
    result = []
    for ch in text:
        if ord(ch) < 128:
            result.append(ch)
        else:
            result.append('\\U+{:04X}'.format(ord(ch)))
    return ''.join(result)


def detect_encoding(path):
    """Probuje UTF-8-BOM, UTF-8, CP1250, latin-1 — zwraca (tresc, encoding)."""
    for enc in ("utf-8-sig", "utf-8", "cp1250", "latin-1"):
        try:
            with open(path, "r", encoding=enc) as f:
                content = f.read()
            if enc in ("utf-8-sig", "utf-8") and "\ufffd" in content:
                continue
            return content, enc
        except (UnicodeDecodeError, LookupError):
            continue
    with open(path, "r", encoding="latin-1") as f:
        return f.read(), "latin-1"


def main():
    if len(sys.argv) < 2:
        src = input("Podaj sciezke do pliku CDF: ").strip().strip('"')
    else:
        src = sys.argv[1].strip('"')

    if not os.path.exists(src):
        print("Blad: nie znaleziono pliku: " + src)
        input("Nacisnij Enter...")
        sys.exit(1)

    content, enc = detect_encoding(src)
    print("Wykryto kodowanie: " + enc)

    converted = to_dxf_unicode(content)

    base, ext = os.path.splitext(src)
    dst = base + "_dxf" + ext

    with open(dst, "w", encoding="ascii") as f:
        f.write(converted)

    print("OK! Zapisano: " + dst)
    input("Nacisnij Enter...")


if __name__ == "__main__":
    main()
