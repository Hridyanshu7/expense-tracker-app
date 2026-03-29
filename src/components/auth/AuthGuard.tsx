import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Spinner } from '@/components/common/Spinner'

export function AuthGuard() {
  const { user, loading } = useAuth()

  if (loading) {
    return <Spinner fullPage />
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />
  }

  return <Outlet />
}
