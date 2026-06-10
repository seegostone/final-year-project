import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header showAuth={true} onHamburgerClick={() => setIsSidebarOpen(true)} />

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block lg:w-64">
          <div className="h-full border-r border-slate-200 bg-white">
            <div className="p-4">
              <Sidebar isOpen={true} onClose={() => setIsSidebarOpen(false)} />
            </div>
          </div>
        </aside>

        {/* Mobile off-canvas */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <div className="fixed inset-0 bg-black/40" onClick={() => setIsSidebarOpen(false)} />
            <div className="relative w-72 max-w-full bg-white shadow-xl">
              <div className="p-4">
                <Sidebar isOpen onClose={() => setIsSidebarOpen(false)} />
              </div>
            </div>
          </div>
        )}

        {/* Main content area */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
