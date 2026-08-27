import { colors, radius, spacing } from '../theme/tokens';

/**
 * État d'un bloc dont la source existe en base mais n'est pas encore alimentée.
 * Le bloc reste en place et se remplira sans changement de code.
 */
export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: `1px dashed ${colors.line2}`,
        borderRadius: radius.md,
        padding: spacing.lg,
        fontSize: 12.5,
        lineHeight: 1.6,
        color: colors.muted,
        background: 'rgba(255,255,255,.015)',
      }}
    >
      {children}
    </div>
  );
}
