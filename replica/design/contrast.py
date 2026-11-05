#!/usr/bin/env python3
"""Checa contraste WCAG de todos os pares do tokens.json.
pairs    -> texto: AA 4.5:1
ui_pairs -> bordas de input, anéis de foco, ícones: AA 3:1
Sai com código 1 se algum par falhar."""
import json, sys

def get(c, path):
    for k in path.split('.'):
        c = c[k]
    return c

def lum(hexc):
    h = hexc.lstrip('#')
    r, g, b = (int(h[i:i+2], 16) / 255 for i in (0, 2, 4))
    f = lambda v: v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)

def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)

t = json.load(open(sys.argv[1] if len(sys.argv) > 1 else 'tokens.json'))
c = t['color']
fails = 0
for group, minimum in (('pairs', 4.5), ('ui_pairs', 3.0)):
    print(f'\n{group} (mínimo {minimum}:1)')
    for fg, bg in t.get(group, []):
        r = ratio(get(c, fg), get(c, bg))
        ok = r >= minimum
        fails += not ok
        print(f"  {'ok  ' if ok else 'FALHA'} {r:5.2f}  {fg} sobre {bg}")
print(f'\n{fails} falha(s)')
sys.exit(1 if fails else 0)
