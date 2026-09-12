/**
 * Mode fixtures — DÉVELOPPEMENT UNIQUEMENT.
 *
 * Active par `VITE_DASHBOARD_FIXTURES=1` dans .env.local, et doublé du garde
 * `import.meta.env.DEV` : un build de production ignore le drapeau quoi qu'il
 * arrive, et l'écran de connexion reste la seule porte d'entrée.
 *
 * Le scénario se choisit dans l'URL, avant le hash de la route :
 *   http://localhost:5173/?fixture=signal-faible#/engagement
 */
import type { ReactNode } from 'react';
import { StaticAdamDataProvider } from '../data/AdamDataProvider';
import { fixture, SCENARIOS, type ScenarioId } from '../data/fixtures';
import { colors, spacing } from '../theme/tokens';

export const FIXTURES_ENABLED =
  import.meta.env.DEV && import.meta.env.VITE_DASHBOARD_FIXTURES === '1';

function currentScenario(): ScenarioId {
  const asked = new URLSearchParams(window.location.search).get('fixture');
  return SCENARIOS.some((s) => s.id === asked) ? (asked as ScenarioId) : 'pilote-reel';
}

function href(id: ScenarioId): string {
  return `${window.location.pathname}?fixture=${id}${window.location.hash}`;
}

export function FixturesMode({ children }: { children: ReactNode }) {
  const id = currentScenario();
  const meta = SCENARIOS.find((s) => s.id === id)!;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Aucune capture d'écran prise dans ce mode ne doit pouvoir passer pour de la donnée réelle. */}
      <div
        style={{
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: spacing.md,
          flexWrap: 'wrap',
          padding: '8px 16px',
          background: colors.warn,
          color: '#1A1206',
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        <span>⚠ DONNÉES FICTIVES — mode fixtures, aucune donnée réelle à l'écran.</span>
        <span style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap' }}>
          {SCENARIOS.map((s) => (
            <a
              key={s.id}
              href={href(s.id)}
              title={s.description}
              style={{
                padding: '2px 8px',
                borderRadius: 99,
                textDecoration: 'none',
                color: s.id === id ? colors.warn : '#1A1206',
                background: s.id === id ? '#1A1206' : 'rgba(0,0,0,.12)',
              }}
            >
              {s.label}
            </a>
          ))}
        </span>
        <span style={{ width: '100%', fontWeight: 600, opacity: 0.8 }}>{meta.description}</span>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <StaticAdamDataProvider data={fixture(id)}>{children}</StaticAdamDataProvider>
      </div>
    </div>
  );
}
