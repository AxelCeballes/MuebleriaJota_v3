import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute({ children, roles = [] }) {
  const { usuario, inicializando, errorRestauracion, reintentarRestauracion } = useAuth();
  const ubicacion = useLocation();

  if (inicializando) {
    return (
      <p className="grid-status" role="status">
        Verificando tu sesión...
      </p>
    );
  }

  // El token sigue guardado, pero no se pudo validar por un fallo temporal:
  // no se muestra la sesión ni se redirige al login, se ofrece reintentar.
  if (errorRestauracion) {
    return (
      <div className="grid-status" role="alert">
        <p>{errorRestauracion}</p>
        <button type="button" className="btn" onClick={reintentarRestauracion}>
          REINTENTAR
        </button>
      </div>
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
