import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, FlaskConical, Search, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/appointments', label: 'Appointments', icon: Calendar },
  { to: '/study-types', label: 'Study Types', icon: FlaskConical },
  { to: '/search', label: 'Semantic Search', icon: Search },
];

export function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col border-r bg-card">
        {/* Brand */}
        <div className="flex h-16 items-center border-b px-6">
          <span className="text-lg font-semibold tracking-tight">medikt</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="border-t p-4">
          <div className="mb-3">
            <p className="truncate text-sm font-medium">{user?.fullName}</p>
            <p className="truncate text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleLogout}>
            <LogOut size={14} />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
