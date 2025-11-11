import React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout simples sem sidebar/header
 * Usado por páginas que gerenciam seu próprio layout completo
 */
export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-gray-50">
      {children}
    </div>
  );
};
