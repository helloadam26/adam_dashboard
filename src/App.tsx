import { HashRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdamDataProvider } from './data/AdamDataProvider';
import { Sidebar } from './components/layout/Sidebar';
import { Overview } from './sections/Overview/Overview';
import { Users } from './sections/Users/Users';
import { Faculties } from './sections/Faculties/Faculties';
import { Activity } from './sections/Activity/Activity';
import { Engagement } from './sections/Engagement/Engagement';
import { Quality } from './sections/Quality/Quality';
import { Performance } from './sections/Performance/Performance';
import { Reports } from './sections/Reports/Reports';
import { Settings } from './sections/Settings/Settings';
import { colors, font } from './theme/tokens';

// L'authentification est volontairement désactivée le temps de finaliser le dashboard.
// Pour la réactiver : réintroduire <AuthGate> (src/auth/AuthGate.tsx) autour de
// <AdamDataProvider>, et restaurer le prédicat de is_dashboard_admin() en base
// (procédure en fin de migration 20260724130000_dashboard_metrics_extension.sql).
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdamDataProvider>
        <HashRouter>
          <div
            style={{
              display: 'flex',
              height: '100vh',
              overflow: 'hidden',
              fontFamily: font,
              color: colors.text,
              background: colors.bg,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <Sidebar />
            <main style={{ flex: 1, overflowY: 'auto' }}>
              <Routes>
                <Route path="/" element={<Overview />} />
                <Route path="/performance" element={<Performance />} />
                <Route path="/users" element={<Users />} />
                <Route path="/faculties" element={<Faculties />} />
                <Route path="/activity" element={<Activity />} />
                <Route path="/engagement" element={<Engagement />} />
                <Route path="/quality" element={<Quality />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
        </HashRouter>
      </AdamDataProvider>
    </QueryClientProvider>
  );
}
