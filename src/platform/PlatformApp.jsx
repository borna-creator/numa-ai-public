import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'

export default function PlatformApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route index element={<DashboardPage />} />
        </Route>
        <Route element={<ProtectedRoute roles={['SUPER_ADMIN']} />}>
          <Route path="admin" element={<DashboardPage />} />
        </Route>
        <Route element={<ProtectedRoute roles={['ORG_ADMIN']} />}>
          <Route path="org" element={<DashboardPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
