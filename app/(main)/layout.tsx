import Header from '@/components/layout/Header';
import TabNav from '@/components/layout/TabNav';
import { ReactNode } from 'react';

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <TabNav />
      <main style={{ flex: 1, padding: '20px 20px', maxWidth: 1400, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {children}
      </main>
    </div>
  );
}
