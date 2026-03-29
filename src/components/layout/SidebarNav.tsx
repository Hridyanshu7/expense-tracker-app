import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Upload,
  BarChart3,
  Settings,
  LogOut,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/import', label: 'Import', icon: Upload },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function SidebarNav() {
  const { user, signOut } = useAuth()

  return (
    <div className="flex h-full flex-col gap-2 p-4">
      {/* Logo */}
      <div className="flex items-center gap-2 px-2 py-3">
        <Wallet className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">Expense Tracker</span>
      </div>

      {/* Nav links */}
      <nav className="flex flex-1 flex-col gap-1 pt-4">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + sign out */}
      <div className="border-t pt-4">
        <div className="mb-2 px-3 text-xs text-muted-foreground truncate">
          {user?.email}
        </div>
        <button
          onClick={() => void signOut()}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  )
}
