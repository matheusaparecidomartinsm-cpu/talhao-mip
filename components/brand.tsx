// Marca provisória do Glyma: vagem de soja com três grãos, no roxo da flor da soja.
// Substituir pelo logo final feito a partir do brief em replica/brand.md.
export function GlymaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden focusable="false">
      <rect width="32" height="32" rx="9" fill="var(--color-ink)" />
      <path d="M7 22c3-9 10-14 18-13-2 8-9 14-18 13z" fill="var(--color-accent-bright)" />
      <circle cx="12.5" cy="18.5" r="2.3" fill="var(--color-accent-soft)" />
      <circle cx="16.5" cy="15.3" r="2.3" fill="var(--color-accent-soft)" />
      <circle cx="20.5" cy="12.3" r="2.3" fill="var(--color-accent-soft)" />
    </svg>
  );
}
