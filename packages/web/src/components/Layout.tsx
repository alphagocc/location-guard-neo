import { useState } from 'react';
import { ExternalLinkIcon, GlobeIcon, MapPinIcon, MenuIcon, MoonIcon, SettingsIcon, ShieldIcon, SunIcon } from './Icons';

export type Page = 'options' | 'levels' | 'fixedPos' | 'ipLocation';

interface LayoutProps {
  page: Page;
  onPageChange: (page: Page) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: { id: Page; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'options', label: 'Options', icon: SettingsIcon },
  { id: 'levels', label: 'Privacy Levels', icon: ShieldIcon },
  { id: 'fixedPos', label: 'Fixed Location', icon: MapPinIcon },
  { id: 'ipLocation', label: 'IP Location', icon: GlobeIcon },
];

export function Layout({ page, onPageChange, theme, onToggleTheme, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavClick = (id: Page) => {
    onPageChange(id);
    setSidebarOpen(false);
  };

  return (
    <div className="app-layout">
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">Location Guard Neo</div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <item.icon className="nav-icon" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={onToggleTheme}>
            {theme === 'light' ? <MoonIcon className="nav-icon" /> : <SunIcon className="nav-icon" />}
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
          </button>
          <button
            className="theme-toggle"
            onClick={() => window.open('https://github.com/Alphagocc/location-guard-neo/issues', '_blank')}
          >
            <ExternalLinkIcon className="nav-icon" />
            Report an issue
          </button>
        </div>
      </aside>

      <div className="main-content">
        <div className="mobile-header">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
            <MenuIcon />
          </button>
          <h1>Location Guard Neo</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
