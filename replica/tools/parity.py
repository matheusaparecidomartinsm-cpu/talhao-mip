#!/usr/bin/env python3
"""Paridade de funcionalidades (regras do replica-diff).
Pesos: must 3, should 2, could 1. partial = meio ponto. Fora da conta: skip e linhas
que o original não tem (original = "agrio", vindas da referência visual).
Uso: python3 parity.py features.csv [--visual diffs/*.json] [--markdown]"""
import csv, json, sys, glob
from collections import defaultdict

args = sys.argv[1:]
path = args[0]
md = "--markdown" in args
vis = []
if "--visual" in args:
    i = args.index("--visual") + 1
    while i < len(args) and not args[i].startswith("--"):
        vis += glob.glob(args[i]); i += 1

W = {"must": 3, "should": 2, "could": 1}
VAL = {"yes": 1.0, "partial": 0.5, "no": 0.0}
ORDER = {"must": 0, "should": 1, "could": 2}
rows = list(csv.DictReader(open(path, encoding="utf-8")))
counted = [r for r in rows if r["priority"] in W and r["original"] not in ("agrio", "no")]
extra = [r for r in rows if r["original"] in ("agrio", "no") and r["priority"] in W]
skipped = [r for r in rows if r["priority"] == "skip"]

def score(rs):
    tot = sum(W[r["priority"]] for r in rs)
    got = sum(W[r["priority"]] * VAL.get(r["clone"], 0) for r in rs)
    return (100 * got / tot) if tot else 100.0

feat = score(counted)
musts = [r for r in counted if r["priority"] == "must"]
must_done = sum(r["clone"] == "yes" for r in musts)
areas = defaultdict(list)
for r in counted: areas[r["area"]].append(r)
area_scores = sorted(((score(v), a, len(v)) for a, v in areas.items()))
missing = sorted([r for r in counted if r["clone"] != "yes"], key=lambda r: (ORDER[r["priority"]], VAL.get(r["clone"], 0), r["area"]))

layout = []
for f in vis:
    j = json.load(open(f)); layout.append((j["screen"], j["score"], j["verdict"]))
lay = sum(s for _, s, _ in layout) / len(layout) if layout else None
overall = round(0.8 * feat + 0.2 * lay, 1) if lay is not None else round(feat, 1)

out = []
p = out.append
p(f"{'## ' if md else ''}Paridade de funcionalidades: {feat:.1f}%")
p(f"Must-haves completos: {must_done} de {len(musts)}" + ("" if must_done == len(musts) else "  →  NÃO É LANÇÁVEL enquanto faltar must-have"))
if lay is not None: p(f"Layout (média de {len(layout)} telas): {lay:.1f}%   ·   Nota geral (80% funções + 20% layout): {overall}%")
p(f"Linhas contadas: {len(counted)} · fora da conta: {len(skipped)} skip, {len(extra)} fora do original (referência Agrio ou correções próprias)")
p("")
p(f"{'### ' if md else ''}Por área (mais fraca primeiro)")
if md: p("| área | nota | itens |\n| --- | ---: | ---: |")
for s, a, n in area_scores: p(f"| {a} | {s:.0f}% | {n} |" if md else f"  {s:5.0f}%  {a} ({n})")
p("")
p(f"{'### ' if md else ''}Falta (ordem de construção)")
if md: p("| prioridade | funcionalidade | estado | nota |\n| --- | --- | --- | --- |")
for r in missing:
    p(f"| {r['priority']} | {r['feature']} | {r['clone']} | {r['notes']} |" if md else f"  [{r['priority']}] {r['feature']} — {r['clone']}: {r['notes']}")
if extra:
    p("")
    p(f"{'### ' if md else ''}Extras fora do original: referência Agrio e correções próprias (não contam)")
    for r in extra: p(f"- {r['feature']}: {r['clone']}" if md else f"  {r['feature']}: {r['clone']}")
print("\n".join(out))
