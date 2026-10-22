import { useAuth } from "../context/AuthContext";
import { Menu, Bell, User, LogOut } from "lucide-react";

interface TopbarProps {
  onMenuClick: () => void;
  onLogout: () => void;
}

export default function Topbar({ onMenuClick, onLogout }: TopbarProps) {
  const { user } = useAuth();

  const getRoleLabel = (): string => {
    switch (user?.role) {
      case "ADMIN":
        return "Administrator";
      case "BRANCH_ADMIN":
        return "Branch Administrator";
      case "DRIVER":
        return "Driver";
      case "COMPANY":
        return "Company";
      default:
        return "User";
    }
  };

  const getRoleColor = (): string => {
    switch (user?.role) {
      case "ADMIN":
        return "bg-purple-600";
      case "BRANCH_ADMIN":
        return "bg-indigo-600";
      case "DRIVER":
        return "bg-blue-600";
      case "COMPANY":
        return "bg-green-600";
      default:
        return "bg-gray-600";
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-3 shadow-sm">
      {/* Left: Menu Toggle & Title */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition"
          title="Toggle Sidebar"
        >
          <Menu size={24} className="text-gray-700 dark:text-gray-300" />
        </button>
        
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
            Dashboard
          </h1>
          <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-400">
            SINGO Delivery Management System
          </p>
        </div>
      </div>

      {/* Right: Notifications & User Profile */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-6">
        {/* Notifications */}
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition relative" title="Notifications">
          <Bell size={20} className="text-gray-700 dark:text-gray-300" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Profile Section */}
        <div className="flex items-center gap-3 pl-2 sm:pl-6 border-l border-gray-200 dark:border-slate-700">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${getRoleColor()}`}>
            <User size={20} />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-800 dark:text-white truncate max-w-xs">
              {user?.email}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {getRoleLabel()}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition shadow-md"
          title="Logout"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}