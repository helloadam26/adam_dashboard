/**
 * Charge les données réelles une seule fois pour toute l'application et les met à
 * disposition des sections. Les sections consomment `useAdamData()` et reçoivent
 * un `AdamData` toujours défini : les états chargement / erreur sont traités ici.
 */
import { createContext, useContext, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAdamData, MissingAdminAccessError } from './queries/dashboard';
import type { AdamData } from './types';
import { SignOutButton } from '../auth/AuthGate';
import { colors, font, radius, spacing } from '../theme/tokens';

const AdamDataContext = createContext<AdamData | null>(null);

export function AdamDataProvider({ children }: { children: ReactNode }) {
  const { data, error, isLoading } = useQuery({
    queryKey: ['adam-data'],
    queryFn: fetchAdamData,
    staleTime: 60_000,
    retry: (count, err) => !(err instanceof MissingAdminAccessError) && count < 2,
  });

  if (isLoading) return <Message title="Chargement des données…" />;

  if (error) {
    // Session valide mais is_admin = false (ou migrations manquantes) : les vues
    // renvoient zéro ligne. Le cas nominal est « compte pas encore autorisé ».
    return error instanceof MissingAdminAccessError ? (
      <Message
        title="Accès en attente d'autorisation"
        detail="Ton compte est connecté mais n'a pas encore accès aux données du dashboard. Un administrateur doit activer l'accès (profiles.is_admin) pour ton adresse."
        withSignOut
      />
    ) : (
      <Message title="Impossible de charger les données" detail={error.message} withSignOut />
    );
  }

  if (!data) return <Message title="Aucune donnée retournée." />;

  return <AdamDataContext.Provider value={data}>{children}</AdamDataContext.Provider>;
}

export function useAdamData(): AdamData {
  const data = useContext(AdamDataContext);
  if (!data) throw new Error('useAdamData doit être utilisé dans un <AdamDataProvider>.');
  return data;
}

function Message({ title, detail, withSignOut }: { title: string; detail?: string; withSignOut?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: font,
        background: colors.bg,
        padding: spacing.xl,
      }}
    >
      <div
        style={{
          maxWidth: 420,
          background: colors.panel,
          border: `1px solid ${colors.line}`,
          borderRadius: radius.lg,
          padding: spacing.xl,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>{title}</div>
        {detail && (
          <div style={{ fontSize: 12.5, color: colors.muted, marginTop: spacing.sm, lineHeight: 1.6 }}>{detail}</div>
        )}
        {withSignOut && (
          <div style={{ marginTop: spacing.lg }}>
            <SignOutButton />
          </div>
        )}
      </div>
    </div>
  );
}
