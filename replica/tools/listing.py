#!/usr/bin/env python3
"""Confere o listing.json: limites da App Store e da Google Play, promessas proibidas em campos curtos,
emoji, palavras-chave desperdiçadas e nomes do 'avoid' do brand.json. Sai com 1 se houver erro."""
import json, re, sys, unicodedata
p = sys.argv[1]; L = json.load(open(p, encoding="utf-8"))
brand = json.load(open(L.get("brand_config", "replica/brand.json"), encoding="utf-8"))
avoid = [a.lower() for a in brand.get("avoid", [])]
errs, warns = [], []
def n(s): return len(unicodedata.normalize("NFC", s))  # caracteres como uma pessoa conta
CLAIMS = re.compile(r"\b(n[ºo°]\s*1|#1|melhor|primeiro|número um|grátis|gratuito|free|top|líder|\d+\s*%|r\$\s*\d)", re.I)
EMOJI = re.compile("[\U0001F300-\U0001FAFF☀-➿]")
LIM = {"google_play": {"title": 30, "short_description": 80, "full_description": 4000},
       "app_store": {"name": 30, "subtitle": 30, "promotional_text": 170, "keywords": 100, "description": 4000}}
SHORT = {"title", "short_description", "name", "subtitle"}
for store, fields in LIM.items():
    d = L.get(store, {})
    for f, lim in fields.items():
        v = d.get(f, "")
        if v.startswith("(mesmo texto"): v = L["google_play"]["full_description"] if f == "description" else v
        k = n(v); ok = k <= lim
        print(f"{'ok  ' if ok else 'ERRO'} {store}.{f}: {k}/{lim}")
        if not ok: errs.append(f"{store}.{f} passa do limite ({k}/{lim})")
        if f in SHORT and CLAIMS.search(v): errs.append(f"{store}.{f} tem promessa de ranking/preço: “{CLAIMS.search(v).group(0)}”")
        if f in SHORT and EMOJI.search(v): errs.append(f"{store}.{f} tem emoji")
        for a in avoid:
            if a in v.lower(): errs.append(f"{store}.{f} contém “{a}”")
    for f, v in d.items():
        if isinstance(v, str):
            for a in avoid:
                if a in v.lower() and f not in fields: errs.append(f"{store}.{f} contém “{a}”")
kw = L.get("app_store", {}).get("keywords", "")
if kw:
    if ", " in kw: warns.append("keywords: espaço depois da vírgula desperdiça caracteres")
    used = (L["app_store"].get("name", "") + " " + L["app_store"].get("subtitle", "")).lower()
    for w in kw.split(","):
        if w.strip().lower() in used.split() or w.strip().lower() + "s" in used.split(): warns.append(f"keywords: “{w}” já está no nome/subtítulo (desperdício)")
blob = json.dumps(L, ensure_ascii=False).lower()
for a in avoid:
    if a in blob and not any(a in e for e in errs): errs.append(f"“{a}” aparece em algum lugar do listing")
for w in warns: print("aviso", w)
for e in errs: print("ERRO", e)
print(f"\n{'PASSOU' if not errs else 'FALHOU'}: {len(errs)} erro(s), {len(warns)} aviso(s)")
sys.exit(1 if errs else 0)
