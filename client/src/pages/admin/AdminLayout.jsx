import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import AdminIcon from './AdminIcon';

const enlaces = [
  { to: '/admin', label: 'Inicio', icono: 'inicio', end: true },
  { to: '/admin/pedidos', label: 'Pedidos', icono: 'pedidos' },
  { to: '/admin/productos', label: 'Productos', icono: 'productos' },
  { to: '/admin/clientes', label: 'Clientes', icono: 'clientes' },
  { to: '/admin/perfil', label: 'Mi perfil', icono: 'perfil' },
];

function AdminLayout() {
  const [sidebarAbierta, setSidebarAbierta] = useState(false);

  const cerrarSidebar = () => setSidebarAbierta(false);

  useEffect(() => {
    if (!sidebarAbierta) return undefined;

    const cerrarConEscape = (evento) => {
      if (evento.key === 'Escape') setSidebarAbierta(false);
    };

    document.addEventListener('keydown', cerrarConEscape);
    return () => document.removeEventListener('keydown', cerrarConEscape);
  }, [sidebarAbierta]);

  return (
    <div className="admin-shell">
      <aside id="admin-sidebar" className={`admin-sidebar${sidebarAbierta ? ' is-open' : ''}`}>
        <NavLink to="/admin" className="admin-brand" onClick={cerrarSidebar}>
          <span className="admin-brand-text">
            <strong>Hermanos Jota</strong>
            <small>Panel de administración</small>
          </span>
        </NavLink>

        <nav className="admin-nav" aria-label="Secciones del panel">
          {enlaces.map((enlace) => (
            <NavLink
              key={enlace.to}
              to={enlace.to}
              end={enlace.end}
              className={({ isActive }) =>
                `admin-nav-link${isActive ? ' active' : ''}`
              }
              onClick={cerrarSidebar}
            >
              <AdminIcon nombre={enlace.icono} />
              <span>{enlace.label}</span>
            </NavLink>
          ))}
        </nav>

        <NavLink to="/" className="admin-store-link" onClick={cerrarSidebar}>
          <AdminIcon nombre="tienda" />
          <span>Ver tienda</span>
        </NavLink>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-menu-toggle"
            aria-label={sidebarAbierta ? 'Cerrar menú del panel' : 'Abrir menú del panel'}
            aria-expanded={sidebarAbierta}
            aria-controls="admin-sidebar"
            onClick={() => setSidebarAbierta((abierta) => !abierta)}
          >
            <AdminIcon nombre={sidebarAbierta ? 'cerrar' : 'menu'} />
          </button>
          <span>Panel de administración</span>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </div>

      {sidebarAbierta && (
        <button
          type="button"
          className="admin-overlay"
          aria-label="Cerrar menú del panel"
          onClick={cerrarSidebar}
        />
      )}
    </div>
  );
}

export default AdminLayout;
