import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { SidebarProvider, useSidebar } from '../../contexts/SidebarContext';

// Accept children so Next.js pages can render their content inside the layout
const LayoutContent: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { isCollapsed, isMobile, closeSidebar } = useSidebar();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {isMobile && !isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Hide sidebar on mobile, show on desktop */}
      <div className="hidden md:block">
        <Sidebar/>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Prefer children (Next.js pages) but fallback to Outlet (React Router) */}
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
};

const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
};

export default Layout;