import { Navigate } from "react-router-dom";
import { useAuth, type RolAcceso } from "../context/AuthContext";

interface Props {
  children: React.ReactNode;
  allowedRoles?: RolAcceso[];
}

export function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-ink-600">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.rol_acceso)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
