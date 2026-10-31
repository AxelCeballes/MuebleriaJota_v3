import { useCallback, useEffect, useState } from 'react';
import { formatoPrecio } from '../utils/format';
import AdminCrearProducto from './AdminCrearProducto';

const API = (import.meta.env.VITE_API_BASE || '') + '/api';
const SESSION_KEY = 'jota_admin_session';

function AdminGestion({ onProductoGuardado }) {
  const [session, setSession] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      return saved?.expiresAt > Date.now() ? saved : null;
    } catch {
      return null;
    }
  });
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [reload, setReload] = useState(0);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
    setProducts(null);
    setEditing(null);
  }, []);

  useEffect(() => {
    if (!session) return undefined;
    let active = true;
    const loadProducts = async () => {
      try {
        const response = await fetch(`${API}/productos`);
        if (!response.ok) throw new Error('No se pudo cargar el catálogo.');
        const data = await response.json();
        if (active) setProducts(data);
      } catch (err) {
        if (active) {
          setError(err.message);
          setProducts([]);
        }
      }
    };
    loadProducts();
    return () => { active = false; };
  }, [session, reload]);

  const login = async (event) => {
    event.preventDefault();
    setLoginError('');
    setError('');
    try {
      const response = await fetch(`${API}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'No se pudo iniciar sesión.');
      const nextSession = { token: data.token, expiresAt: Date.now() + data.expiresIn * 1000 };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      setProducts(null);
      setSession(nextSession);
      setPassword('');
    } catch (err) {
      setLoginError(err instanceof TypeError ? 'No se pudo conectar con el servidor.' : err.message);
    }
  };

  const removeProduct = async (product) => {
    if (!window.confirm(`¿Eliminar “${product.nombre}”? Esta acción no se puede deshacer.`)) return;
    try {
      const response = await fetch(`${API}/productos/${product._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) logout();
        throw new Error(data.message || 'No se pudo eliminar el producto.');
      }
      setProducts((previous) => previous.filter((item) => item._id !== product._id));
      onProductoGuardado?.(null, product._id);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!session) return (
    <>
      <section className="page-header"><p className="eyebrow">ADMINISTRACIÓN</p><h1>Acceso administrador</h1><p>Ingresá la contraseña de administración para gestionar el catálogo.</p></section>
      <section className="contact-section admin-section">
        <form className="contact-form admin-form" onSubmit={login}>
          <label htmlFor="admin-password">Contraseña</label>
          <input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <button className="btn" type="submit">INGRESAR</button>
          {loginError && <p className="form-message form-message-error" role="alert">{loginError}</p>}
        </form>
      </section>
    </>
  );

  return (
    <>
      <section className="page-header">
        <p className="eyebrow">ADMINISTRACIÓN</p><h1>Gestionar productos</h1>
        <p>Creá productos nuevos, editá sus datos o quitá artículos del catálogo.</p>
        <button type="button" className="btn-outline" onClick={logout}>CERRAR SESIÓN</button>
      </section>
      {editing !== null ? (
        <AdminCrearProducto
          key={editing?._id || 'new-product'}
          accessToken={session.token}
          onUnauthorized={logout}
          initialProduct={editing || undefined}
          onProductoGuardado={(product) => {
            onProductoGuardado?.(product);
            setEditing(null);
            setReload((value) => value + 1);
          }}
          onCancelar={() => setEditing(null)}
        />
      ) : (
        <section className="section catalog-section admin-product-list">
          <button type="button" className="btn" onClick={() => setEditing(false)}>NUEVO PRODUCTO</button>
          {error && <p className="form-message form-message-error" role="alert">{error}</p>}
          {products === null ? <p className="grid-status" role="status">Cargando productos...</p> : products.map((product) => (
            <article className="admin-product-row" key={product._id}>
              <div><strong>{product.nombre}</strong><p>{formatoPrecio(product.precio)} · Stock: {product.stock ?? 0}</p></div>
              <div className="admin-product-actions">
                <button className="btn-outline" type="button" onClick={() => setEditing(product)}>EDITAR</button>
                <button className="btn-outline" type="button" onClick={() => removeProduct(product)}>ELIMINAR</button>
              </div>
            </article>
          ))}
        </section>
      )}
    </>
  );
}

export default AdminGestion;
