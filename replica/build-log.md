# Build log — Talhão (clone do Plantix para soja)

Branch `clone-plantix` do repo `talhao-mip`. Stack: Next.js 16, React 19, Tailwind 4 (tokens de `replica/design`), ícones Lucide, fonte Archivo empacotada (OFL).
**Camada de dados provisória** (`lib/data/index.ts`) com as assinaturas de `architecture.md`; dados do usuário no aparelho (IndexedDB + localStorage). Nenhum código, texto, imagem ou endpoint do Plantix/Agrio.

Verificação (`scripts/shots.mjs`, `scripts/e2e-slice.mjs`, `scripts/e2e-offline.mjs`): 36 prints em `replica/clone-screens/`, 0 erros de console, 0 rolagem horizontal em 390 px, 5 telas conferidas em 1440 px, caminho principal completo só com teclado (anel de foco visível).

| ID | data | status | o que falta | mais difícil que o esperado |
| --- | --- | --- | --- | --- |
| S01 | 2026-11-05 | feito | idiomas (só pt-BR) | — |
| S02 | 2026-11-05 | feito | — | — |
| S03 | 2026-11-05 | feito | dados reais de alerta/clima (backend) | redirecionar para boas-vindas sem piscar a tela |
| S04 | 2026-11-05 | feito | seletor de cultura quando houver mais de uma | câmera ao vivo sem permissão/sem câmera: a galeria tem que estar sempre disponível |
| S05 | 2026-11-05 | feito | — | fila offline: o id é gerado no celular para o reenvio não duplicar |
| S06 | 2026-11-05 | **parcial** | **diagnóstico é heurística de demonstração** (brilho/verde/marrom da foto); o modelo de visão entra no `/replica-backend`. Fotos de exemplo são ilustrações | a regra de demonstração precisou de ajuste: manchas pequenas não passavam do limite de "marrom" |
| S07 | 2026-11-05 | feito | fotos próprias de campo; revisão das 12 fichas pela Agronomia | escrever as fichas: conteúdo agronômico é a parte lenta, não o código |
| S08 | 2026-11-05 | feito | milho e trigo | — |
| S09 | 2026-11-05 | feito | — | índice A–Z separava "Á" de "A" |
| S10 | 2026-11-05 | parcial | comunidade online (hoje: exemplos + perguntas salvas no aparelho) | — |
| S11 | 2026-11-05 | parcial | enviar para servidor; anexar mais de uma foto | — |
| S12 | 2026-11-05 | parcial | denunciar, persistir "útil" | tempo relativo ("há 50 min") gerava erro de hidratação do React |
| S13 | 2026-11-05 | parcial | job diário de alertas + push | — |
| S14 | 2026-11-05 | parcial | previsão real (Open-Meteo) | — |
| S15 | 2026-11-05 | feito | calendário de manejo (could) | — |
| S16 | 2026-11-05 | feito | faixas por teor de solo | — |
| S17 | 2026-11-05 | feito | sincronizar com a nuvem | — |
| S18 | 2026-11-05 | parcial | criar conta (Supabase Auth) | — |
| S19 | 2026-11-05 | parcial | só link para o Agrofit, por decisão (sem venda) | — |

## Avisos

- **O diagnóstico ainda não é de verdade.** O resultado aparece marcado como "Modo demonstração". Isso é o maior item pendente e é o próximo passo.
- As 12 fichas estão marcadas como "em revisão" no app. Precisam da revisão da turma/professores de Agronomia antes de lançar.
- Commits foram agrupados por conjunto de telas, não um por tela.
- O protótipo antigo continua acessível em `/prototipo/index.html`.
