import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Trilha from './pages/Trilha'
import Login from './pages/Login'
import Register from './pages/Register'
import UserProfile from './pages/UserProfile'
import Conquistas from './pages/Conquistas'
import UserDrawer from './components/UserDrawer'
import ProtectedRoute from './components/ProtectedRoute'
import ResizableSidebarLayout from './components/layout/ResizableSidebarLayout'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './hooks/useAuth'
const PopulatePage = React.lazy(() => import('./pages/Populate'))

function AppContent() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  )
}

function AppRoutes() {
  const [drawerOpen, setDrawerOpen] = useState(true)
  const { user } = useAuth()
  const location = useLocation()

  const activeUser = user
  const usesUserSidebar = user && ['/', '/conquistas'].includes(location.pathname)

  const routedContent = (
    <Routes>
      <Route
        path="/trilha"
        element={
          <ProtectedRoute>
            <Trilha activeUser={activeUser} />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Register />} />
      <Route
        path="/conquistas"
        element={
          <ProtectedRoute>
            <Conquistas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        }
      />
      <Route path="/populate" element={<PopulatePage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
    </Routes>
  )

  return (
    <>
      {usesUserSidebar && drawerOpen ? (
        <ResizableSidebarLayout
          storageKey="corvis.user.sidebar.width"
          className="app-layout--user"
          sidebar={<UserDrawer setOpen={setDrawerOpen} usuarioId={user?.id} />}
        >
          {routedContent}
        </ResizableSidebarLayout>
      ) : (
        routedContent
      )}

      {!drawerOpen && user && (
        <button
          onClick={() => setDrawerOpen(true)}
          className="user-sidebar-toggle bg-white text-black px-1.5 py-2 rounded-2xl shadow-lg hover:bg-gray-200 transition-colors duration-300"
          aria-label="Abrir barra lateral do usuario"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="size-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
      )}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
