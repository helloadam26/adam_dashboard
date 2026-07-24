import { colors, spacing } from '../theme/tokens';

interface PlaceholderProps {
  title: string;
  subtitle: string;
}

export function Placeholder({ title, subtitle }: PlaceholderProps) {
  return (
    <div style={{ padding: spacing.xl }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{title}</h1>
      <p style={{ color: colors.muted, fontSize: 13, margin: '4px 0 24px' }}>{subtitle}</p>
      <div
        style={{
          border: `1px dashed ${colors.line2}`,
          borderRadius: 14,
          padding: 40,
          textAlign: 'center',
          color: colors.faint,
          fontSize: 13,
        }}
      >
        Section à construire (scope bêta suivant)
      </div>
    </div>
  );
}
