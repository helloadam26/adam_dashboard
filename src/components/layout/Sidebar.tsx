import { NavLink } from 'react-router-dom';
import { SignOutButton } from '../../auth/AuthGate';
import { colors, spacing } from '../../theme/tokens';
import adamLogo from '../../assets/adam-logo.png';

const NAV: [string, [string, string][]][] = [
  ['PILOTAGE', [['/', "Vue d'ensemble"], ['/performance', 'Performance']]],
  ['AUDIENCE', [['/users', 'Utilisateurs']]],
  ['USAGE', [['/activity', 'Activité'], ['/engagement', 'Engagement'], ['/calendar', 'Calendrier']]],
  ['ADAM', [['/quality', 'Qualité IA']]],
  ['LIVRABLES', [['/reports', 'Rapports'], ['/settings', 'Paramètres']]],
];

export function Sidebar() {
  return (
    <aside
      style={{
        width: 236,
        flex: '0 0 auto',
        background: colors.bgAlt,
        borderRight: `1px solid ${colors.line}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      <div style={{ padding: '18px 18px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <img
          src={adamLogo}
          alt="ADAM"
          width={30}
          height={30}
          style={{ display: 'block', flex: '0 0 auto', objectFit: 'contain' }}
        />
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '.02em' }}>ADAM</div>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: colors.faint, letterSpacing: '.04em' }}>
            Dashboard interne
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '6px 12px 12px' }}>
        {NAV.map(([group, items]) => (
          <div key={group} style={{ marginBottom: spacing.md }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: colors.faint,
                letterSpacing: '.06em',
                padding: '10px 10px 6px',
              }}
            >
              {group}
            </div>
            {items.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                style={({ isActive }) => ({
                  display: 'block',
                  padding: '8px 10px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                  color: isActive ? colors.text : colors.muted,
                  background: isActive ? 'rgba(109,93,246,.14)' : 'transparent',
                })}
              >
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div
        style={{
          padding: spacing.md,
          borderTop: `1px solid ${colors.line}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
        }}
      >
        <span style={{ fontSize: 11.5, color: colors.muted }}>Équipe ADAM</span>
        <SignOutButton />
      </div>
    </aside>
  );
}
