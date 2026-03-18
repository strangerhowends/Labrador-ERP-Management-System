import { useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { DashboardCaja } from './components/DashboardCaja'
import { RegistroGastosForm } from './components/RegistroGastosForm'
import { CalendarioGastos } from './components/CalendarioGastos'
import { AdminCatalogos } from './components/erp/AdminCatalogos'
import { RegistroPago } from './components/erp/RegistroPago'
import { DashboardPagosSemanales } from './components/erp/DashboardPagosSemanales'
import { CalendarioTurnos } from './components/erp/CalendarioTurnos'
import { LoginView } from './components/LoginView'
import { ProtectedRoute } from './components/ProtectedRoute'
import { MisTurnos } from './components/erp/MisTurnos'
import { MisPagos } from './components/erp/MisPagos'
import { useAuth } from './context/AuthContext'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sand-50 via-white to-sand-100">
        <p className="text-sm text-ink-600">Cargando...</p>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginView />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

function AppShell() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState<'caja' | 'gastos'>('caja')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isAdmin = user?.rol_acceso === 'ADMIN'

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-xl px-4 py-2 text-sm font-semibold transition ${isActive ? 'bg-white text-ink-950 shadow-sm' : 'text-ink-600 hover:text-ink-900'}`

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded-xl px-4 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-white text-ink-950 shadow-sm' : 'text-ink-600 hover:text-ink-900'}`

  return (
    <main className="min-h-screen bg-gradient-to-b from-sand-50 via-white to-sand-100 px-3 py-4 text-ink-900 sm:px-8 sm:py-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-3xl border border-sand-200 bg-white/80 p-4 shadow-soft backdrop-blur sm:mb-8 sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500 sm:text-xs">Restaurante Labrador</p>
              <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink-950 sm:mt-3 sm:text-3xl lg:text-4xl">Control de Flujo de Efectivo</h1>
              <p className="mt-2 max-w-2xl text-xs text-ink-700 sm:mt-3 sm:text-sm lg:text-base">
                Gestion diaria de caja y registro de gastos detallados en una sola interfaz, limpia y operativa.
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-xs font-medium text-ink-800 sm:text-sm">{user?.nombre_completo}</span>
              <span className="rounded-full border border-sand-200 bg-sand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                {user?.rol_acceso}
              </span>
              <button
                type="button"
                onClick={logout}
                className="mt-1 text-xs font-semibold text-ink-500 hover:text-ink-800"
              >
                Cerrar sesion
              </button>
            </div>
          </div>

          {/* Desktop nav */}
          <div className="mt-5 hidden flex-wrap rounded-2xl border border-sand-200 bg-sand-50 p-1 gap-1 md:inline-flex">
            {isAdmin && (
              <>
                <NavLink to="/" end className={navLinkClass}>Registro</NavLink>
                <NavLink to="/calendario" className={navLinkClass}>Calendario de Gastos</NavLink>
                <NavLink to="/erp/catalogos" className={navLinkClass}>Catalogos ERP</NavLink>
                <NavLink to="/erp/remuneraciones/registro" className={navLinkClass}>Registro Pagos</NavLink>
                <NavLink to="/erp/remuneraciones/dashboard" className={navLinkClass}>Dashboard Pagos</NavLink>
                <NavLink to="/erp/turnos" className={navLinkClass}>Turnos</NavLink>
              </>
            )}
            {!isAdmin && (
              <>
                <NavLink to="/" end className={navLinkClass}>Mis Turnos</NavLink>
                <NavLink to="/mis-pagos" className={navLinkClass}>Mis Pagos</NavLink>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="mt-4 md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl border border-sand-200 bg-sand-50 px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-sand-100"
              aria-expanded={mobileMenuOpen}
              aria-label="Menu de navegacion"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
              Menu
            </button>

            {mobileMenuOpen && (
              <nav className="mt-2 flex flex-col gap-1 rounded-2xl border border-sand-200 bg-sand-50 p-2">
                {isAdmin && (
                  <>
                    <NavLink to="/" end className={mobileNavLinkClass} onClick={() => setMobileMenuOpen(false)}>Registro</NavLink>
                    <NavLink to="/calendario" className={mobileNavLinkClass} onClick={() => setMobileMenuOpen(false)}>Calendario de Gastos</NavLink>
                    <NavLink to="/erp/catalogos" className={mobileNavLinkClass} onClick={() => setMobileMenuOpen(false)}>Catalogos ERP</NavLink>
                    <NavLink to="/erp/remuneraciones/registro" className={mobileNavLinkClass} onClick={() => setMobileMenuOpen(false)}>Registro Pagos</NavLink>
                    <NavLink to="/erp/remuneraciones/dashboard" className={mobileNavLinkClass} onClick={() => setMobileMenuOpen(false)}>Dashboard Pagos</NavLink>
                    <NavLink to="/erp/turnos" className={mobileNavLinkClass} onClick={() => setMobileMenuOpen(false)}>Turnos</NavLink>
                  </>
                )}
                {!isAdmin && (
                  <>
                    <NavLink to="/" end className={mobileNavLinkClass} onClick={() => setMobileMenuOpen(false)}>Mis Turnos</NavLink>
                    <NavLink to="/mis-pagos" className={mobileNavLinkClass} onClick={() => setMobileMenuOpen(false)}>Mis Pagos</NavLink>
                  </>
                )}
              </nav>
            )}
          </div>
        </header>

        <Routes>
          {isAdmin ? (
            <>
              <Route path="/" element={<RegistroWorkspace tab={tab} setTab={setTab} />} />
              <Route path="/calendario" element={<CalendarioGastos />} />
              <Route path="/erp/catalogos" element={<AdminCatalogos />} />
              <Route path="/erp/remuneraciones/registro" element={<RegistroPago />} />
              <Route path="/erp/remuneraciones/dashboard" element={<DashboardPagosSemanales />} />
              <Route path="/erp/turnos" element={<CalendarioTurnos />} />
            </>
          ) : (
            <>
              <Route path="/" element={<MisTurnos />} />
              <Route path="/mis-pagos" element={<MisPagos />} />
            </>
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </main>
  )
}

function RegistroWorkspace({
  tab,
  setTab,
}: {
  tab: 'caja' | 'gastos'
  setTab: (value: 'caja' | 'gastos') => void
}) {
  return (
    <>
      <div className="mb-6 inline-flex rounded-2xl border border-sand-200 bg-sand-50 p-1">
        <button
          type="button"
          onClick={() => setTab('caja')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            tab === 'caja' ? 'bg-white text-ink-950 shadow-sm' : 'text-ink-600 hover:text-ink-900'
          }`}
        >
          Flujo de Caja
        </button>
        <button
          type="button"
          onClick={() => setTab('gastos')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            tab === 'gastos' ? 'bg-white text-ink-950 shadow-sm' : 'text-ink-600 hover:text-ink-900'
          }`}
        >
          Registro de Gastos
        </button>
      </div>
      {tab === 'caja' ? <DashboardCaja /> : <RegistroGastosForm />}
    </>
  )
}

export default App
