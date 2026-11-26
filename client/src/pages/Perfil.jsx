import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Perfil() {
  const { usuario, esAdmin } = useAuth();
  const rolVisible = esAdmin ? 'Administrador' : 'Cliente';

  return (
    <>
      <section className="page-header">
        <p className="eyebrow">TU CUENTA</p>
        <h1>Mi perfil</h1>
        <p>Datos de la cuenta que inició sesión.</p>
      </section>

      <section className="section profile-section">
        <div className="profile-layout">
          <article className="perfil-card profile-summary">
            <div className="profile-avatar" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path
                  fill="currentColor"
                  d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.24-8 5v2h16v-2c0-2.76-3.58-5-8-5Z"
                />
              </svg>
            </div>
            <p className="profile-name">{usuario?.nombre}</p>
            <p className="profile-email">{usuario?.email}</p>
            <span className={`profile-role${esAdmin ? ' profile-role-admin' : ''}`}>
              {rolVisible}
            </span>
          </article>

          <article className="perfil-card profile-details">
            <h2 className="profile-card-title">Datos personales</h2>
            <dl className="profile-data">
              <div className="profile-data-row">
                <dt>Nombre</dt>
                <dd>{usuario?.nombre}</dd>
              </div>
              <div className="profile-data-row">
                <dt>Correo electrónico</dt>
                <dd>{usuario?.email}</dd>
              </div>
              <div className="profile-data-row">
                <dt>Rol</dt>
                <dd>{rolVisible}</dd>
              </div>
            </dl>

            <div className="profile-actions">
              <Link to="/mis-pedidos" className="btn">VER MIS PEDIDOS</Link>
              {esAdmin && (
                <Link to="/admin/crear-producto" className="btn-outline">
                  PANEL DE ADMINISTRACIÓN
                </Link>
              )}
            </div>
          </article>
        </div>
      </section>
    </>
  );
}

export default Perfil;
