import React from 'react';
import { Outlet } from 'react-router-dom';
import classNames from 'classnames';
import { Sidebar } from '../components/common/Sidebar';
import { Header } from '../components/common/Header';
import { useUIStore } from '../store';

export const MainLayout: React.FC = () => {
  const { sidebarOpen, presentationMode } = useUIStore();

  return (
    <div className="h-screen w-screen overflow-hidden transition-theme">
      {!presentationMode && <Sidebar />}
      {!presentationMode && <Header />}
      
      <main
        className={classNames(
          'transition-all duration-300 overflow-y-auto custom-scrollbar',
          {
            'ml-64 mt-16': !presentationMode && sidebarOpen,
            'ml-20 mt-16': !presentationMode && !sidebarOpen,
            'ml-0 mt-0': presentationMode,
          }
        )}
        style={{
          height: presentationMode ? '100vh' : 'calc(100vh - 4rem)',
          backgroundColor: 'var(--color-bg-secondary)',
        }}
      >
        <div className={classNames('p-6', { 'p-0': presentationMode })}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};
