import type { ReactNode } from 'react';
import { colors, radius, spacing } from '../../theme/tokens';

interface PanelProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  style?: React.CSSProperties;
}

export function Panel({ title, subtitle, children, style }: PanelProps) {
  return (
    <div
      style={{
        background: colors.panel,
        border: `1px solid ${colors.line}`,
        borderRadius: radius.lg,
        padding: spacing.lg,
        ...style,
      }}
    >
      {title && <div style={{ fontSize: 13, fontWeight: 700, marginBottom: subtitle ? 2 : spacing.md }}>{title}</div>}
      {subtitle && <div style={{ fontSize: 12, color: colors.muted, marginBottom: spacing.md }}>{subtitle}</div>}
      {children}
    </div>
  );
}
