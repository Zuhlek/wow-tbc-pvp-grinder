import type { ReactNode } from 'react';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="layout">
      <header className="header">
        <h1 className="header-title">WoW PvP Grind Planner</h1>
        <div className="header-actions">
          {/* Import/Export buttons will go here */}
        </div>
      </header>
      <main className="main-content">{children}</main>
    </div>
  );
}
