/**
 * Garde d'authentification.
 *
 * Les vues `dashboard_*` n'ouvrent leurs agrégats qu'aux sessions dont le profil
 * porte `is_admin = true` : sans session Supabase, le dashboard n'a rien à afficher.
 *
 * Le playbook prévoit en plus une 2FA (TOTP) et un minuteur d'inactivité —
 * pas encore implémentés ici.
 */
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../data/supabaseClient';
import { colors, font, radius, spacing } from '../theme/tokens';

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return <Centered>Chargement de la session…</Centered>;
  if (!session) return <LoginForm />;
  return <>{children}</>;
}

export function SignOutButton() {
  return (
    <button
      onClick={() => void supabase.auth.signOut()}
      style={{
        fontFamily: 'inherit',
        fontSize: 11.5,
        fontWeight: 600,
        color: colors.muted,
        background: 'transparent',
        border: `1px solid ${colors.line2}`,
        borderRadius: 7,
        padding: '5px 10px',
        cursor: 'pointer',
      }}
    >
      Se déconnecter
    </button>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: font,
        background: colors.bg,
        color: colors.muted,
        fontSize: 13,
      }}
    >
      {children}
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) setError(signInError.message);
    setBusy(false);
  };

  const inputStyle = {
    fontFamily: 'inherit',
    fontSize: 13,
    color: colors.text,
    background: colors.panel2,
    border: `1px solid ${colors.line2}`,
    borderRadius: radius.sm,
    padding: '10px 12px',
    width: '100%',
    boxSizing: 'border-box' as const,
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: font,
        background: colors.bg,
        color: colors.text,
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          width: 320,
          background: colors.panel,
          border: `1px solid ${colors.line}`,
          borderRadius: radius.lg,
          padding: spacing.xl,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md,
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>ADAM · Dashboard interne</div>
          <div style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
            Réservé aux comptes administrateurs du pilote.
          </div>
        </div>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Courriel"
          autoComplete="username"
          required
          style={inputStyle}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          autoComplete="current-password"
          required
          style={inputStyle}
        />

        {error && <div style={{ fontSize: 12, color: colors.alarm }}>{error}</div>}

        <button
          type="submit"
          disabled={busy}
          style={{
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 700,
            color: '#fff',
            background: colors.indigo,
            border: 'none',
            borderRadius: radius.sm,
            padding: '11px 16px',
            cursor: busy ? 'default' : 'pointer',
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}
