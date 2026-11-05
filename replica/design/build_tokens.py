#!/usr/bin/env python3
"""tokens.json -> tokens.css (variáveis) + tailwind.css (@theme do Tailwind v4)
               + tailwind.config.ts (para quem estiver no Tailwind v3).
Rodar sempre que mudar o tokens.json. replica-brand só muda valores no JSON."""
import json, os, sys

here = os.path.dirname(os.path.abspath(__file__))
t = json.load(open(os.path.join(here, 'tokens.json')))

def flat_colors(d, prefix=''):
    for k, v in d.items():
        if isinstance(v, dict):
            yield from flat_colors(v, f'{prefix}{k}-')
        else:
            yield f'{prefix}{k}', v

colors = list(flat_colors(t['color']))
f = t['font']

css = ['/* GERADO por build_tokens.py a partir de tokens.json. Não editar à mão. */', ':root {']
css += [f'  --color-{k}: {v};' for k, v in colors]
css += [f'  --font-{k}: {v};' for k, v in f['family'].items()]
css += [f'  --text-{k}: {v};' for k, v in f['size'].items()]
css += [f'  --leading-{k}: {v};' for k, v in f['line'].items()]
css += [f'  --weight-{k}: {v};' for k, v in f['weight'].items()]
css += [f'  --space-{k}: {v};' for k, v in t['space'].items()]
css += [f'  --radius-{k}: {v};' for k, v in t['radius'].items()]
css += [f'  --shadow-{k}: {v};' for k, v in t['shadow'].items()]
css += [f'  --duration-{k}: {t["motion"][k]};' for k in ('fast', 'base', 'slow')]
css += [f'  --ease-standard: {t["motion"]["ease"]};']
css += [f'  --layout-{k}: {v};' for k, v in t['layout'].items() if isinstance(v, str) and k != 'note']
css += ['}', '',
        '@media (prefers-reduced-motion: reduce) {',
        '  :root { --duration-fast: 0ms; --duration-base: 0ms; --duration-slow: 0ms; }',
        '}', '']
open(os.path.join(here, 'tokens.css'), 'w').write('\n'.join(css))

# Tailwind v4: @theme com as mesmas variáveis -> classes bg-surface, text-muted etc.
tw = ['/* GERADO por build_tokens.py. Importar em app/globals.css:',
      '   @import "tailwindcss"; @import "../replica/design/tailwind.css"; */',
      '@theme {',
      '  --color-*: initial;']
tw += [f'  --color-{k}: {v};' for k, v in colors]
tw += [f'  --font-{k}: {v};' for k, v in f['family'].items()]
for k, v in f['size'].items():
    tw += [f'  --text-{k}: {v};', f'  --text-{k}--line-height: {f["line"][k]};']
tw += [f'  --font-weight-{k}: {v};' for k, v in f['weight'].items()]
tw += ['  --spacing: 4px;']
tw += [f'  --radius-{k}: {v};' for k, v in t['radius'].items()]
tw += [f'  --shadow-{k}: {v};' for k, v in t['shadow'].items()]
tw += [f'  --breakpoint-{k}: {v};' for k, v in t['layout']['breakpoints'].items()]
tw += [f'  --ease-standard: {t["motion"]["ease"]};', '}', '']
open(os.path.join(here, 'tailwind.css'), 'w').write('\n'.join(tw))

# Tailwind v3 (fallback)
def nest(d):
    return {k: (nest(v) if isinstance(v, dict) else v) for k, v in d.items()}
cfg = {
    'colors': {k.replace('-', '_') if False else k: f'var(--color-{k})' for k, _ in colors},
    'fontFamily': {k: [f'var(--font-{k})'] for k in f['family']},
    'fontSize': {k: [v, f['line'][k]] for k, v in f['size'].items()},
    'borderRadius': t['radius'],
    'boxShadow': t['shadow'],
    'screens': t['layout']['breakpoints'],
}
ts = ('// GERADO por build_tokens.py (Tailwind v3). No v4 use tailwind.css.\n'
      'import type { Config } from "tailwindcss";\n\n'
      'export default {\n  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],\n'
      f'  theme: {{ extend: {{}}, ...{json.dumps(cfg, indent=2, ensure_ascii=False)} }},\n'
      '} satisfies Config;\n')
open(os.path.join(here, 'tailwind.config.ts'), 'w').write(ts)
print(f'{len(colors)} cores, {len(t["space"])} espaços, {len(f["size"])} tamanhos de texto -> tokens.css, tailwind.css, tailwind.config.ts')
