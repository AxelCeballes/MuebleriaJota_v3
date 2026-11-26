import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

function AdminPerfil() {
  const { usuario, esAdmin } = useAuth();
  const rolVisible = esAdmin ? 'Administrador' : 'Cliente';

  return (
    <section className="admin-page">
      <header className="admin-section-heading">
        <p className="eyebrow">MI PERFIL</p>
        <h1>Mi perfil</h1>
        <p>Datos de la cuenta administradora.</p>
      </header>

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
          <h2 className="profile-card-title">Datos de la cuenta</h2>
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
            <Link to="/perfil" className="btn-outline">VER PERFIL DE LA TIENDA</Link>
          </div>
        </article>
      </div>
    </section>
  );
}

export default AdminPerfil;
