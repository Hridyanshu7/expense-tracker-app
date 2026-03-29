import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Upload,
  BarChart3,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Txns', icon: ArrowLeftRight },
  { to: '/import', label: 'Import', icon: Upload },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function BottomTabNav() {
  return (
    <div className="flex items-center justify-around px-2 py-1">
      {tabs.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground',
            )
          }
        >
          <Icon className="h-5 w-5" />
          {label}
        </NavLink>
      ))}
    </div>
  )
}
