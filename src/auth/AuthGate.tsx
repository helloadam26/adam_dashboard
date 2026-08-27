/**
 * Garde d'authentification.
 *
 * Le dashboard est réservé à des comptes dédiés (distincts des comptes étudiants) :
 * inscription + connexion par courriel / mot de passe via Supabase Auth. Un compte
 * connecté n'obtient les données que si son profil porte is_admin = true (géré côté
 * base, voir migration 20260728190000) ; sinon il reste en « attente d'autorisation »
 * (traité dans AdamDataProvider).
 *
 * Le playbook prévoit en plus une 2FA (TOTP) et un minuteur d'inactivité — étape
 * suivante, pas encore implémentés ici.
 */
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../data/supabaseClient';
import { colors, font, radius, spacing } from '../theme/tokens';
import adamLogo from '../assets/adam-logo.png';

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
  if (!session) return <AuthForm />;
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

type Mode = 'signin' | 'signup' | 'verify';

function AuthForm() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
  };

  const resendCode = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    const { error: resendError } = await supabase.auth.resend({ type: 'signup', email });
    setError(resendError ? resendError.message : null);
    if (!resendError) setNotice('Nouveau code envoyé.');
    setBusy(false);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    if (mode === 'signin') {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        // Compte créé mais e-mail pas encore confirmé : orienter vers la saisie du code.
        if (/confirm/i.test(signInError.message)) {
          setNotice("Cette adresse n'est pas encore confirmée. Entre le code reçu par courriel.");
          setMode('verify');
        }
      }
      // En cas de succès, onAuthStateChange bascule l'AuthGate.
    } else if (mode === 'signup') {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (signUpError) {
        setError(signUpError.message);
      } else if (!data.session) {
        // Confirmation par code OTP activée : pas de session immédiate.
        setNotice('Compte créé. Entre le code de confirmation reçu par courriel.');
        setMode('verify');
      }
      // Si une session est renvoyée (confirmation désactivée), l'AuthGate bascule seul.
    } else {
      // Vérification du code OTP de confirmation d'inscription.
      const { error: otpError } = await supabase.auth.verifyOtp({ email, token: otp.trim(), type: 'signup' });
      if (otpError) setError(otpError.message);
      // En cas de succès, une session est créée et l'AuthGate bascule.
    }

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

  const isSignup = mode === 'signup';
  const isVerify = mode === 'verify';

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
          width: 340,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
            <img
              src={adamLogo}
              alt=""
              width={40}
              height={40}
              style={{ display: 'block', flex: '0 0 auto', objectFit: 'contain' }}
            />
            <div style={{ fontSize: 16, fontWeight: 700 }}>ADAM · Dashboard interne</div>
          </div>
          <div style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
            {isVerify
              ? 'Entre le code de confirmation reçu par courriel.'
              : isSignup
                ? 'Créer un compte dédié au dashboard (distinct des comptes étudiants).'
                : 'Réservé aux comptes administrateurs du pilote.'}
          </div>
        </div>

        {!isVerify && (
          <div style={{ display: 'flex', gap: 4, background: colors.panel2, borderRadius: radius.sm, padding: 3 }}>
            {(['signin', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                style={{
                  flex: 1,
                  fontFamily: 'inherit',
                  fontSize: 12.5,
                  fontWeight: 700,
                  padding: '7px 0',
                  borderRadius: radius.sm - 2,
                  border: 'none',
                  cursor: 'pointer',
                  color: mode === m ? colors.text : colors.muted,
                  background: mode === m ? colors.indigo : 'transparent',
                }}
              >
                {m === 'signin' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>
        )}

        {isSignup && (
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nom complet"
            autoComplete="name"
            style={inputStyle}
          />
        )}

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Courriel"
          autoComplete="username"
          required
          readOnly={isVerify}
          style={{ ...inputStyle, opacity: isVerify ? 0.6 : 1 }}
        />

        {isVerify ? (
          <input
            type="text"
            inputMode="numeric"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Code de confirmation"
            autoComplete="one-time-code"
            required
            style={inputStyle}
          />
        ) : (
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            required
            minLength={isSignup ? 6 : undefined}
            style={inputStyle}
          />
        )}

        {error && <div style={{ fontSize: 12, color: colors.alarm }}>{error}</div>}
        {notice && <div style={{ fontSize: 12, color: colors.ok, lineHeight: 1.5 }}>{notice}</div>}

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
          {busy ? 'Veuillez patienter…' : isVerify ? 'Vérifier le code' : isSignup ? 'Créer le compte' : 'Se connecter'}
        </button>

        {mode === 'signin' && (
          <button
            type="button"
            onClick={() => switchMode('verify')}
            style={{
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 600,
              color: colors.muted,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              textAlign: 'center',
            }}
          >
            J'ai un code de confirmation à saisir
          </button>
        )}

        {isVerify && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <button
              type="button"
              onClick={resendCode}
              disabled={busy}
              style={{
                fontFamily: 'inherit',
                fontSize: 12,
                fontWeight: 600,
                color: colors.muted,
                background: 'transparent',
                border: 'none',
                cursor: busy ? 'default' : 'pointer',
                padding: 0,
              }}
            >
              Renvoyer le code
            </button>
            <button
              type="button"
              onClick={() => switchMode('signin')}
              style={{
                fontFamily: 'inherit',
                fontSize: 12,
                fontWeight: 600,
                color: colors.muted,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              ← Connexion
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
