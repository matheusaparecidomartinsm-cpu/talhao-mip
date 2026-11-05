#!/usr/bin/env python3
"""Agrupa avaliações em temas (themes.json), pesa notas baixas e recentes, marca temas fracos.
Uso: python3 reviews.py reviews.csv --out feedback.md [--themes themes.json]
Linhas sem URL são descartadas. Texto é usado exatamente como está na planilha."""
import csv, json, sys, os, datetime
from collections import defaultdict

a = sys.argv[1:]; path = a[0]
out = a[a.index("--out") + 1] if "--out" in a else None
tpath = a[a.index("--themes") + 1] if "--themes" in a else os.path.join(os.path.dirname(__file__), "themes.json")
T = json.load(open(tpath, encoding="utf-8"))
POS, NEG = T.pop("_pos", []), T.pop("_neg", []); T.pop("_nota", None)
rows = [r for r in csv.DictReader(open(path, encoding="utf-8")) if r.get("url", "").startswith("http")]
today = datetime.date.today()

def weight(r):
    w = 1.0
    if r["rating"]: w *= {1: 3, 2: 2.5, 3: 1.5, 4: 1, 5: 0.5}.get(int(r["rating"]), 1)
    age = (today - datetime.date.fromisoformat(r["date"])).days / 365
    w *= 1.5 if age < 0.5 else 1.0 if age < 2 else 0.6
    return w
def tone(t):
    n = sum(k.lower() in t.lower() for k in NEG); p = sum(k.lower() in t.lower() for k in POS)
    return "neg" if n > p else "pos" if p > n else ("misto" if n else "neutro")

themes, unmatched = defaultdict(list), []
for r in rows:
    r["tone"] = tone(r["text"]); hit = False
    for th, kws in T.items():
        if any(k.lower() in r["text"].lower() for k in kws): themes[th].append(r); hit = True
    if not hit and r["tone"] in ("neg", "misto"): unmatched.append(r)

L = []; p = L.append
srcs = sorted({r["source"] for r in rows}); langs = sorted({r["lang"] for r in rows})
rated = sum(1 for r in rows if r["rating"])
p("# Feedback de usuários do Plantix\n")
p(f"**Amostra: {len(rows)} avaliações**, {len(srcs)} fontes ({', '.join(srcs)}), {len(langs)} idiomas, datas de {min(r['date'] for r in rows)} a {max(r['date'] for r in rows)}. Com nota em estrelas: {rated}.")
p(f"Tom (palavras-chave): {sum(r['tone']=='pos' for r in rows)} positivas, {sum(r['tone']=='neg' for r in rows)} negativas, {sum(r['tone']=='misto' for r in rows)} mistas, {sum(r['tone']=='neutro' for r in rows)} neutras.\n")
p("## Temas (mais peso primeiro)\n")
p("| tema | avaliações | fontes | idiomas | peso | força |\n| --- | ---: | ---: | ---: | ---: | --- |")
ranked = sorted(themes.items(), key=lambda kv: -sum(weight(r) for r in kv[1]))
for th, rs in ranked:
    ns, nl = len({r['source'] for r in rs}), len({r['lang'] for r in rs})
    thin = len(rs) < 3 or len({r['source'].split('-preview')[0] for r in rs}) < 2
    p(f"| {th} | {len(rs)} | {ns} | {nl} | {sum(weight(r) for r in rs):.1f} | {'**fraco**' if thin else 'ok'} |")
p("\n_“Fraco” = menos de 3 avaliações ou uma loja só (Play e Play Preview contam como a mesma loja)._\n")
for th, rs in ranked:
    p(f"### {th} ({len(rs)})\n")
    for r in sorted(rs, key=lambda r: r['date'], reverse=True):
        p(f"- “{r['text']}” — {r['author']}, {r['date']}, {r['lang']} · [fonte]({r['url']})")
    p("")
p("## Pedidos, nas palavras dos usuários\n")
for r in rows:
    t = r["text"].lower()
    if any(k in t for k in ["fehlt", "falt", "kurang", "ينقص", "não tem", "no more species", "tidak ada", "warum fehlt"]):
        p(f"- “{r['text']}” — [fonte]({r['url']})")
p("\n## Negativas sem tema (ler à mão)\n")
for r in unmatched: p(f"- “{r['text']}” — {r['author']}, {r['date']}, {r['lang']} · [fonte]({r['url']})")
if not unmatched: p("- nenhuma")
txt = "\n".join(L)
open(out, "w", encoding="utf-8").write(txt) if out else print(txt)
print(f"{len(rows)} avaliações, {len(themes)} temas, {len(unmatched)} negativas sem tema" + (f" → {out}" if out else ""))
