#!/usr/bin/env python3
"""Varredura de marca: nomes, domínios e cores do original no código e nos nomes de arquivo.
Uso: python3 sweep.py <raiz> --config replica/brand.json   (ou --avoid "A,B" --domains x.com --colors "#hex")
Sai com 1 se encontrar algo."""
import json, os, re, sys

a = sys.argv[1:]; root = a[0]
cfg = {}
if "--config" in a: cfg = json.load(open(a[a.index("--config") + 1], encoding="utf-8"))
get = lambda k: [x.strip() for x in a[a.index("--" + k) + 1].split(",")] if "--" + k in a else cfg.get(k, [])
avoid, domains, colors = get("avoid"), get("domains"), [c.lower() for c in get("colors")]
skip = set(cfg.get("skip_paths", ["node_modules", ".next", "replica", ".git"]))
TEXT = {".ts", ".tsx", ".js", ".mjs", ".cjs", ".json", ".css", ".html", ".md", ".sql", ".svg", ".webmanifest", ".txt", ".yml", ".yaml", ".env", ".example"}

pats = [(n, re.compile(re.escape(n), re.I)) for n in avoid] + [(d, re.compile(re.escape(d), re.I)) for d in domains]
hexes = [(c, re.compile(re.escape(c) + r"(?![0-9a-f])", re.I)) for c in colors]
hits = []
for dp, dirs, files in os.walk(root):
    rel = os.path.relpath(dp, root)
    dirs[:] = [d for d in dirs if d not in skip and os.path.normpath(os.path.join(rel, d)) not in skip]
    for f in files:
        path = os.path.normpath(os.path.join(rel, f))
        if path in skip: continue
        for n, p in pats:
            if p.search(f): hits.append((path, 0, f"nome de arquivo contém “{n}”"))
        if os.path.splitext(f)[1].lower() not in TEXT and not f.startswith(".env"): continue
        try: lines = open(os.path.join(dp, f), encoding="utf-8").read().splitlines()
        except (UnicodeDecodeError, OSError): continue
        for i, line in enumerate(lines, 1):
            for n, p in pats + hexes:
                if p.search(line): hits.append((path, i, f"“{n}”: {line.strip()[:110]}"))
for h in hits: print(f"{h[0]}:{h[1]}  {h[2]}")
print(f"\n{'LIMPO' if not hits else str(len(hits)) + ' ocorrência(s)'} — procurado: {len(avoid)} nomes, {len(domains)} domínios, {len(colors)} cores")
sys.exit(1 if hits else 0)
