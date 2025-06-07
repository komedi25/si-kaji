
import { ReactNode } from 'react';
import Header from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header with Sidebar Toggle */}
      <div className="md:hidden">
        <Header />
      </div>
      
      {/* Sidebar - Hidden on mobile by default, can be toggled */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Header */}
        <div className="hidden md:block">
          <Header />
        </div>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
