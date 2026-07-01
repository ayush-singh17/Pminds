import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import CommandPalette from './CommandPalette';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'black' }}>
      <div style={{ height: '8px' }} />
      <CommandPalette />
      <Header />
      <div style={{ height: '8px' }} />
      <div className="flex flex-1 overflow-hidden" style={{ paddingLeft: '25px', paddingRight: '8px' }}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
