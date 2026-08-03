import { motion } from "framer-motion";
import { LogOut, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import type { UserRole } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { RoleBadge } from "./StatusBadge";
import logoPng from "@/assets/logo.png";

interface NavbarProps {
  role: UserRole;
  navItems: { label: string; path: string; icon: React.ReactNode }[];
  title: string;
}

export function Navbar({ role, navItems, title }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-slate-200/60">
      <div className="container">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link to={navItems[0]?.path || "#"} className="flex items-center gap-2 group">
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="flex items-center"
              >
                <img src={logoPng} alt="Rwanda Energy Group" className="h-9 object-contain" />
              </motion.div>
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="font-display text-xs font-bold text-brand-800 tracking-tight">
                  Voltage Drop Monitoring
                </span>
                <span className="text-[9px] font-medium text-slate-500 -mt-0.5">
                  {title}
                </span>
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  location.pathname.startsWith(`${item.path}/`);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl text-slate-600 transition-all duration-200 hover:text-brand-800 hover:bg-brand-50 ${isActive ? "text-brand-800 bg-brand-50 shadow-inner" : ""}`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <RoleBadge role={role} />
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 border border-brand-200/60">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-semibold text-slate-800">
                    {user?.name}
                  </span>
                  <span className="text-[11px] text-slate-500">{user?.branch}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all duration-200 hover:text-rose-600 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden pb-3 pt-2 space-y-1 border-t border-slate-200/60"
          >
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                location.pathname.startsWith(`${item.path}/`);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl text-slate-600 transition-all duration-200 hover:text-brand-800 hover:bg-brand-50 w-full ${isActive ? "text-brand-800 bg-brand-50 shadow-inner" : ""}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-3 mt-2 border-t border-slate-200">
              <div className="flex items-center gap-2 px-2 py-2">
                <RoleBadge role={role} />
              </div>
              <div className="flex items-center gap-2.5 px-2 py-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 border border-brand-200/60">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-semibold text-slate-800">
                    {user?.name}
                  </span>
                  <span className="text-[11px] text-slate-500">{user?.branch}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
}
