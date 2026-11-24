import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Perfil() {
  const { usuario } = useAuth();
  const rolVisible = usuario?.rol === 'admin' ? 'Administrador' : 'Cliente';

  return (
    <>
      <section className="page-header">
        <p className="eyebrow">TU CUENTA</p>
        <h1>Mi perfil</h1>
        <p>Datos de la cuenta que inició sesión.</p>
      </section>

      <section className="section auth-section">
        <div className="perfil-card">
          <p><strong>Nombre:</strong> {usuario?.nombre}</p>
          <p><strong>Email:</strong> {usuario?.email}</p>
          <p><strong>Rol:</strong> {rolVisible}</p>
          <Link to="/mis-pedidos" className="text-link">Ver mis pedidos →</Link>
        </div>
      </section>
    </>
  );
}

export default Perfil;
