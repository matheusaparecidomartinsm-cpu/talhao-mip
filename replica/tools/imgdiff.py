#!/usr/bin/env python3
"""Diff de layout por mapa de bordas em grade (ignora cor de propósito).
Uso: python3 imgdiff.py original.png clone.png [--out diff.png] [--json] [--mode layout|pixel] [--grid 24] [--screen S06]
Requer Pillow."""
import json, sys
from PIL import Image, ImageFilter, ImageChops, ImageDraw

a = sys.argv[1:]
o, c = a[0], a[1]
opt = lambda k, d=None: a[a.index(k) + 1] if k in a else d
out, mode, G, screen = opt("--out"), opt("--mode", "layout"), int(opt("--grid", 24)), opt("--screen", "")
W = 480

def load(p):
    im = Image.open(p).convert("L")
    return im.resize((W, max(1, round(im.height * W / im.width))))
A, B = load(o), load(c)
hdiff = (B.height - A.height) / A.height
H = min(A.height, B.height)
A, B = A.crop((0, 0, W, H)), B.crop((0, 0, W, H))

if mode == "pixel":
    d = ImageChops.difference(A, B).point(lambda v: 255 if v > 24 else 0)
    same = 100 * (1 - sum(1 for v in (d.get_flattened_data() if hasattr(d, 'get_flattened_data') else d.getdata()) if v) / (W * H))
    res = {"screen": screen, "mode": "pixel", "score": round(same, 1)}
else:
    ea = A.filter(ImageFilter.FIND_EDGES).point(lambda v: 255 if v > 40 else 0)
    eb = B.filter(ImageFilter.FIND_EDGES).point(lambda v: 255 if v > 40 else 0)
    cols, rows = G, max(1, round(G * H / W))
    cw, ch = W / cols, H / rows
    pa, pb = ea.load(), eb.load()
    def dens(px, x0, y0):
        x1, y1 = int((x0 + 1) * cw), int((y0 + 1) * ch)
        n = t = 0
        for y in range(int(y0 * ch), y1, 2):
            for x in range(int(x0 * cw), x1, 2):
                t += 1; n += px[x, y] > 0
        return n / max(1, t)
    cells, bad = 0, []
    agree = 0.0
    for y in range(rows):
        for x in range(cols):
            da, db = dens(pa, x, y), dens(pb, x, y)
            if da < 0.01 and db < 0.01: continue
            cells += 1
            both = (da >= 0.01) == (db >= 0.01)
            sim = (1 - abs(da - db) / max(da, db)) if both else 0
            agree += sim
            if sim < 0.5: bad.append((x, y))
    sc = 100 * agree / max(1, cells)
    # regiões: agrupa células ruins por faixa horizontal
    bands = {}
    for x, y in bad: bands.setdefault(y, []).append(x)
    scale = Image.open(o).width / W   # devolve em pixels do original
    regions = [[0, int(y * ch * scale), int(W * scale), int((y + 1) * ch * scale), len(xs)]
               for y, xs in sorted(bands.items(), key=lambda kv: -len(kv[1]))][:6]
    res = {"screen": screen, "mode": "layout", "score": round(sc, 1), "cells": cells, "differing_cells": len(bad),
           "regions_differ_px": regions, "height_diff_pct": round(100 * hdiff, 1)}
    if out:
        vis = Image.merge("RGB", (ea, eb, Image.new("L", (W, H), 0)))
        dr = ImageDraw.Draw(vis)
        for x, y in bad: dr.rectangle([x * cw, y * ch, (x + 1) * cw, (y + 1) * ch], outline=(255, 255, 0))
        vis.save(out)
v = res["score"]
res["verdict"] = "matches" if v >= 90 else "close" if v >= 75 else "partly" if v >= 50 else "different"
print(json.dumps(res, ensure_ascii=False) if "--json" in a else
      f"{screen or c}: {v}% ({res['verdict']})" + (f", altura {res.get('height_diff_pct', 0):+}%" if mode == "layout" else ""))
