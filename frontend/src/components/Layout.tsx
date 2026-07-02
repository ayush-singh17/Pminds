import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import CommandPalette from './CommandPalette';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg)', transition: 'background 0.2s' }}>
      <CommandPalette />
      <Header />
      <div style={{ height: '8px' }} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', paddingLeft: '25px', paddingRight: '8px' }}>
        <Sidebar />
        <main style={{
          flex: 1, overflowY: 'auto', padding: '32px',
          background: 'var(--bg)',
          transition: 'background 0.2s',
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
