import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, FlaskConical, FileText, Search, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  { to: '/dashboard',     label: 'Dashboard',       icon: LayoutDashboard },
  { to: '/appointments',  label: 'Appointments',    icon: Calendar },
  { to: '/study-types',   label: 'Study Types',     icon: FlaskConical,  roles: ['admin', 'doctor'] },
  { to: '/study-results', label: 'Study Results',   icon: FileText },
  { to: '/search',        label: 'Semantic Search', icon: Search },
];

interface SidebarProps {
  onClose: () => void;
  user: { fullName: string; role: string } | null;
  onLogout: () => void;
  closeable: boolean;
}

function Sidebar({ onClose, user, onLogout, closeable }: SidebarProps) {
  return (
    <aside className="flex h-full w-60 flex-col border-r bg-card">
      <div className="flex h-16 items-center justify-between border-b px-6">
        <span className="text-lg font-semibold tracking-tight">medikt</span>
        {closeable && (
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.filter(item => !item.roles || item.roles.includes(user?.role ?? '')).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
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

      <div className="border-t p-4">
        <div className="mb-3">
          <p className="truncate text-sm font-medium">{user?.fullName}</p>
          <p className="truncate text-xs text-muted-foreground capitalize">{user?.role}</p>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={onLogout}>
          <LogOut size={14} />
          Sign out
        </Button>
      </div>
    </aside>
  );
}

export function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const sidebarProps = {
    user,
    onLogout: handleLogout,
    onClose: () => setSidebarOpen(false),
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar — always visible */}
      <div className="hidden lg:flex lg:w-60 lg:flex-col">
        <Sidebar {...sidebarProps} closeable={false} />
      </div>

      {/* Mobile sidebar — overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <Sidebar {...sidebarProps} closeable={true} />
          </div>
        </>
      )}

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex h-16 items-center border-b bg-card px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <span className="ml-4 text-lg font-semibold tracking-tight">medikt</span>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
