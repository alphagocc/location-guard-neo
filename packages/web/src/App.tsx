import type { Page } from './components/Layout';
import { useState } from 'react';
import { Layout } from './components/Layout';
import { useTheme } from './hooks/useTheme';
import { FixedPosPage } from './pages/FixedPosPage';
import { IpLocationPage } from './pages/IpLocationPage';
import { LevelsPage } from './pages/LevelsPage';
import { OptionsPage } from './pages/OptionsPage';

export function App() {
  const { theme, toggleTheme } = useTheme();
  const [page, setPage] = useState<Page>('options');

  return (
    <Layout page={page} onPageChange={setPage} theme={theme} onToggleTheme={toggleTheme}>
      {page === 'options' && <OptionsPage />}
      {page === 'levels' && <LevelsPage />}
      {page === 'fixedPos' && <FixedPosPage />}
      {page === 'ipLocation' && <IpLocationPage />}
    </Layout>
  );
}
