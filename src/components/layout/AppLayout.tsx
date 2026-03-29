import { Outlet } from 'react-router-dom'
import { SidebarNav } from './SidebarNav'
import { BottomTabNav } from './BottomTabNav'

export function AppLayout() {
  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r">
        <SidebarNav />
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </div>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 border-t bg-background md:hidden">
          <BottomTabNav />
        </nav>
      </main>
    </div>
  )
}
