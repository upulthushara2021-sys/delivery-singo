import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth >= 1024;
  });

  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Automatically close sidebar on mobile when navigating routes
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 overflow-hidden relative">
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden w-full">
        {/* Topbar */}
        <Topbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} onLogout={handleLogout} />

        {/* Main Content */}
        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
