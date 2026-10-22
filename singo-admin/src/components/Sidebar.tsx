import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Truck,
  Users,
  Building2,
  DollarSign,
  LogOut,
  Plus,
  Map,
  GitBranch,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const linkStyle =
    "flex items-center gap-3 px-4 py-2 rounded-lg transition hover:bg-blue-600 hover:text-white text-gray-700 dark:text-gray-300 font-medium";

  const activeStyle = "bg-blue-600 text-white font-semibold";

  const handleLogout = () => {
    onClose?.();
    logout();
    navigate("/");
  };

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      onClose?.();
    }
  };

  return (
    <div
      className={`fixed inset-y-0 left-0 z-40 w-64 h-screen shrink-0 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 p-4 flex flex-col justify-between overflow-y-auto shadow-xl transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div>
        {/* Logo */}
        <div className="mb-6 px-2 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white tracking-wide">
              SINGO
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Delivery Management
            </p>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white text-lg font-bold"
            title="Close menu"
          >
            ✕
          </button>
        </div>

        {/* ADMIN MENU */}
        {user?.role === "ADMIN" && (
          <div className="space-y-1 text-sm">
            <NavLink
              to="/admin/dashboard"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `${linkStyle} ${isActive ? activeStyle : ""}`
              }
            >
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>

            <NavLink
              to="/admin/dashboard/companies"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `${linkStyle} ${isActive ? activeStyle : ""}`
              }
            >
              <Building2 size={18} />
              Companies
            </NavLink>

            <NavLink
              to="/admin/dashboard/branches"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `${linkStyle} ${isActive ? activeStyle : ""}`
              }
            >
              <GitBranch size={18} />
              Branches
            </NavLink>

            <NavLink
              to="/admin/dashboard/drivers"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `${linkStyle} ${isActive ? activeStyle : ""}`
              }
            >
              <Users size={18} />
              Drivers
            </NavLink>

            <NavLink
              to="/admin/dashboard/deliveries"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `${linkStyle} ${isActive ? activeStyle : ""}`
              }
            >
              <Truck size={18} />
              Deliveries
            </NavLink>

            <NavLink
              to="/admin/dashboard/create-delivery"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `${linkStyle} ${isActive ? activeStyle : ""}`
              }
            >
              <Plus size={18} />
              Create Delivery
            </NavLink>

            <NavLink
              to="/admin/dashboard/tracking"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `${linkStyle} ${isActive ? activeStyle : ""}`
              }
            >
              <Map size={18} />
              Track Deliveries
            </NavLink>

            <NavLink
              to="/admin/dashboard/settlements"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `${linkStyle} ${isActive ? activeStyle : ""}`
              }
            >
              <DollarSign size={18} />
              Settlements
            </NavLink>

            <NavLink
              to="/admin/dashboard/manage-settlements"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `${linkStyle} ${isActive ? activeStyle : ""}`
              }
            >
              <Plus size={18} />
              Create Settlements
            </NavLink>

            <NavLink
              to="/admin/dashboard/analytics"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `${linkStyle} ${isActive ? activeStyle : ""}`
              }
            >
              <Plus size={18} />
              Analytics
            </NavLink>
          </div>
        )}

        {/* BRANCH ADMIN MENU */}
        {user?.role === "BRANCH_ADMIN" && (
          <div className="space-y-1 text-sm">
            <NavLink
              to="/admin/dashboard/drivers"
              onClick={handleLinkClick}
              className={({ isActive }) => `${linkStyle} ${isActive ? activeStyle : ""}`}
            >
              <Users size={18} />
              Branch Drivers
            </NavLink>
            <NavLink
              to="/admin/dashboard/deliveries"
              onClick={handleLinkClick}
              className={({ isActive }) => `${linkStyle} ${isActive ? activeStyle : ""}`}
            >
              <Truck size={18} />
              Branch Deliveries
            </NavLink>
          </div>
        )}

        {/* DRIVER MENU */}
        {user?.role === "DRIVER" && (
          <div className="space-y-1 text-sm">
            <NavLink
              to="/driver"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `${linkStyle} ${isActive ? activeStyle : ""}`
              }
            >
              <Truck size={18} />
              My Deliveries
            </NavLink>

            <NavLink
              to="/driver/settlements"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `${linkStyle} ${isActive ? activeStyle : ""}`
              }
            >
              <DollarSign size={18} />
              Cash Settlements
            </NavLink>
          </div>
        )}

        {/* COMPANY MENU */}
        {user?.role === "COMPANY" && (
          <div className="space-y-1 text-sm">
            <NavLink
              to="/company"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `${linkStyle} ${isActive ? activeStyle : ""}`
              }
            >
              <Building2 size={18} />
              Dashboard
            </NavLink>

            <NavLink
              to="/company/create-delivery"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `${linkStyle} ${isActive ? activeStyle : ""}`
              }
            >
              <Plus size={18} />
              Create Delivery
            </NavLink>

            <NavLink
              to="/company/tracking"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `${linkStyle} ${isActive ? activeStyle : ""}`
              }
            >
              <Map size={18} />
              Track Deliveries
            </NavLink>

            <NavLink
              to="/company/settlements"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `${linkStyle} ${isActive ? activeStyle : ""}`
              }
            >
              <DollarSign size={18} />
              Cash Settlements
            </NavLink>
          </div>
        )}
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg text-sm font-semibold w-full flex items-center justify-center gap-2 transition shadow-md mt-6"
      >
        <LogOut size={18} /> Logout
      </button>
    </div>
  );
}
