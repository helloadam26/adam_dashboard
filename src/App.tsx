import { HashRouter, Route, Routes } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Overview } from './sections/Overview/Overview';
import { Placeholder } from './sections/Placeholder';
import { colors, font } from './theme/tokens';

const STUBS: Record<string, [string, string]> = {
  '/performance': ['Performance', 'ADAM atteint-il les objectifs fixés pour le pilote ?'],
  '/users': ['Utilisateurs', 'Qui utilise ADAM.'],
  '/faculties': ['Facultés', 'Adoption et performance par faculté.'],
  '/activity': ['Activité', 'Quand et combien.'],
  '/engagement': ['Engagement', "Les utilisateurs reviennent-ils et s'investissent-ils ?"],
  '/quality': ['Qualité IA', "ADAM répond-il bien, et où doit-il s'améliorer ?"],
  '/reports': ['Rapports', 'Exporter les chiffres clés pour les partenaires du pilote.'],
  '/settings': ['Paramètres', 'Configuration du pilote.'],
};

export default function App() {
  return (
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
            {Object.entries(STUBS).map(([path, [title, subtitle]]) => (
              <Route key={path} path={path} element={<Placeholder title={title} subtitle={subtitle} />} />
            ))}
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
