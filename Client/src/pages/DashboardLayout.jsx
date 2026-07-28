import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ListTodo, BarChart3, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Issues', href: '/dashboard/issues', icon: ListTodo },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#050505', color: '#f5f5f5' }}>
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col border-r border-white/10" style={{ background: 'rgba(10,10,10,0.95)' }}>
        {/* Brand */}
        <div className="px-5 py-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-white text-base">shield_with_heart</span>
          </div>
          <span className="font-bold text-white text-sm tracking-tight">
            Maintainer<span className="text-neutral-400">AI</span>
          </span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map(({ name, href, icon: Icon }) => {
            const isActive = href === '/dashboard'
              ? location.pathname === '/dashboard'
              : location.pathname.startsWith(href);
            return (
              <Link
                key={name}
                to={href}
                id={`nav-${name.toLowerCase()}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={17} />
                {name}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="px-3 py-4 border-t border-white/10">
          {user && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-1" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="w-7 h-7 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-neutral-300 text-sm">person</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">{user.name || user.githubUsername}</p>
                <p className="text-xs text-neutral-500 truncate">{user.email || `@${user.githubUsername}`}</p>
              </div>
            </div>
          )}
          <button
            id="sidebar-logout-btn"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-400 hover:bg-white/5 hover:text-white transition-all"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
