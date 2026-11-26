import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Navbar({ cantidadCarrito = 0 }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [menuCuentaAbierto, setMenuCuentaAbierto] = useState(false);
  const cuentaRef = useRef(null);
  const botonCuentaRef = useRef(null);
  const { usuario, esAdmin, cerrarSesion } = useAuth();

  // Cierra los menús al navegar
  const cerrarMenus = () => {
    setMenuAbierto(false);
    setMenuCuentaAbierto(false);
  };

  // Cierra el menú de cuenta al tocar fuera o con Escape.
  useEffect(() => {
    if (!menuCuentaAbierto) return undefined;

    const cerrarAlTocarFuera = (evento) => {
      if (!cuentaRef.current?.contains(evento.target)) {
        setMenuCuentaAbierto(false);
      }
    };

    const cerrarConEscape = (evento) => {
      if (evento.key !== 'Escape') return;
      setMenuCuentaAbierto(false);
      botonCuentaRef.current?.focus();
    };

    document.addEventListener('pointerdown', cerrarAlTocarFuera);
    document.addEventListener('keydown', cerrarConEscape);

    return () => {
      document.removeEventListener('pointerdown', cerrarAlTocarFuera);
      document.removeEventListener('keydown', cerrarConEscape);
    };
  }, [menuCuentaAbierto]);

  const handleCerrarSesion = () => {
    cerrarSesion();
    cerrarMenus();
  };

  return (
    <header className="header">
      <div className="header-inner">
        <Link
          className="logo"
          to="/"
          aria-label="Hermanos Jota - Inicio"
          onClick={cerrarMenus}
        >
          <img src="/img/logo.svg" alt="Hermanos Jota" />
        </Link>

        <div className="header-actions">
          {!usuario && (
            <div className="nav-auth">
              <NavLink
                to="/login"
                role="button"
                className={({ isActive }) =>
                  `nav-auth-link nav-auth-secondary${isActive ? ' active' : ''}`
                }
                onClick={cerrarMenus}
              >
                Ingresar
              </NavLink>
              <NavLink
                to="/registro"
                role="button"
                className={({ isActive }) =>
                  `nav-auth-link nav-auth-primary${isActive ? ' active' : ''}`
                }
                onClick={cerrarMenus}
              >
                Registrarse
              </NavLink>
            </div>
          )}

          {usuario && (
            <div className="account" ref={cuentaRef}>
              <button
                ref={botonCuentaRef}
                type="button"
                className={`account-button${menuCuentaAbierto ? ' is-open' : ''}`}
                aria-label="Menú de cuenta"
                aria-haspopup="true"
                aria-expanded={menuCuentaAbierto}
                aria-controls="menu-cuenta"
                onClick={() => {
                  setMenuCuentaAbierto((abierto) => !abierto);
                  setMenuAbierto(false);
                }}
              >
                <svg
                  className="account-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    fill="currentColor"
                    d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.24-8 5v2h16v-2c0-2.76-3.58-5-8-5Z"
                  />
                </svg>
              </button>

              {menuCuentaAbierto && (
                <div id="menu-cuenta" className="account-menu">
                  <NavLink
                    to="/perfil"
                    className={({ isActive }) =>
                      `account-menu-item${isActive ? ' active' : ''}`
                    }
                    onClick={cerrarMenus}
                  >
                    Mi perfil
                  </NavLink>
                  <NavLink
                    to="/mis-pedidos"
                    className={({ isActive }) =>
                      `account-menu-item${isActive ? ' active' : ''}`
                    }
                    onClick={cerrarMenus}
                  >
                    Mis pedidos
                  </NavLink>
                  <button
                    type="button"
                    className="account-menu-item account-menu-logout"
                    onClick={handleCerrarSesion}
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Botón hamburguesa — solo visible en mobile */}
          <button
            className={`hamburger${menuAbierto ? ' is-open' : ''}`}
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuAbierto}
            onClick={() => {
              setMenuAbierto((abierto) => !abierto);
              setMenuCuentaAbierto(false);
            }}
          >
            <span />
            <span />
            <span />
          </button>

          <Link
            to="/carrito"
            role="button"
            className="cart-link"
            aria-label="Ver carrito de compras"
            onClick={cerrarMenus}
          >
            <img src="/img/logo-compras.png" alt="Carrito de compras" className="cart-icon" />
            <span id="cart-count" className="cart-badge">{cantidadCarrito}</span>
          </Link>
        </div>
      </div>

      {/* Nav — collapsa en mobile, inline en desktop */}
      <nav className={`nav${menuAbierto ? ' nav-open' : ''}`}>
        <NavLink
          to="/"
          end
          role="button"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          onClick={cerrarMenus}
        >
          Inicio
        </NavLink>
        <NavLink
          to="/productos"
          role="button"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          onClick={cerrarMenus}
        >
          Catálogo
        </NavLink>
        <NavLink
          to="/contacto"
          role="button"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          onClick={cerrarMenus}
        >
          Contacto
        </NavLink>

        {esAdmin && (
          <NavLink
            to="/admin/crear-producto"
            role="button"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            onClick={cerrarMenus}
          >
            Admin
          </NavLink>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
