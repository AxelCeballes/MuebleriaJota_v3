import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute({ children, roles = [] }) {
  const { usuario, inicializando } = useAuth();
  const ubicacion = useLocation();

  if (inicializando) {
    return (
      <p className="grid-status" role="status">
        Verificando tu sesión...
      </p>
    );
  }

  if (!usuario) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ desde: `${ubicacion.pathname}${ubicacion.search}` }}
      />
    );
  }

  if (roles.length > 0 && !roles.includes(usuario.rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
