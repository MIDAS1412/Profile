import { ADMIN_ROUTE, AdminPage } from './pages/AdminPage'
import { ProfilePage } from './pages/ProfilePage'

export default function App() {
  const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/'

  if (normalizedPath === ADMIN_ROUTE) {
    return <AdminPage />
  }

  return <ProfilePage />
}
