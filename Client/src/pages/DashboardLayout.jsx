import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { LayoutDashboard, ListTodo, BarChart3, Settings, LogOut, Home } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useEffect, useState } from 'react';
import { repos as reposApi } from '../services/api';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [installBanner, setInstallBanner] = useState(null); // 'syncing' | 'success' | 'error'

  // Detect GitHub App installation redirect: /dashboard?installation_id=...&status=success
  useEffect(() => {
    const installationId = searchParams.get('installation_id');
    const status = searchParams.get('status');
    if (installationId && status === 'success') {
      // Clear query params immediately to prevent re-triggering
      setSearchParams({}, { replace: true });
      setInstallBanner('syncing');
      // Auto-sync repos for this installation
      reposApi.sync(parseInt(installationId, 10))
        .then(() => {
          setInstallBanner('success');
          setTimeout(() => {
            setInstallBanner(null);
            navigate('/dashboard/settings', { replace: true });
          }, 2000);
        })
        .catch((err) => {
          console.error('Failed to sync after install:', err);
          setInstallBanner('error');
          setTimeout(() => setInstallBanner(null), 4000);
        });
    }
  }, []);

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
        {/* Back to Home */}
          <div className="px-3 pb-2">
            <Link
              id="nav-back-home"
              to="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-neutral-500 hover:bg-white/5 hover:text-neutral-300 transition-all duration-150 border border-white/5 hover:border-white/10"
            >
              <Home size={17} />
              Back to Home
            </Link>
          </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {/* Installation success / syncing banner */}
        {installBanner === 'syncing' && (
          <div className="mb-6 flex items-center gap-3 p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            GitHub App installed! Syncing your repositories…
          </div>
        )}
        {installBanner === 'success' && (
          <div className="mb-6 flex items-center gap-2 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm">
            <span className="material-symbols-outlined text-base">check_circle</span>
            Repositories synced successfully! Redirecting to Settings…
          </div>
        )}
        {installBanner === 'error' && (
          <div className="mb-6 flex items-center gap-2 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm">
            <span className="material-symbols-outlined text-base">error</span>
            Repository sync failed. Go to Settings and click &ldquo;Sync Repos&rdquo; manually.
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
