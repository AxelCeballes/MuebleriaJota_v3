import { useEffect, useState } from 'react';
import { formatoPrecio } from '../utils/format';
import AdminCrearProducto from './AdminCrearProducto';

const API = (import.meta.env.VITE_API_BASE || '') + '/api';

function AdminGestion({ onProductoGuardado }) {
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
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
  }, [reload]);

  const removeProduct = async (product) => {
    if (!window.confirm(`¿Eliminar “${product.nombre}”? Esta acción no se puede deshacer.`)) return;
    setError('');
    try {
      const response = await fetch(`${API}/productos/${product._id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'No se pudo eliminar el producto.');
      setProducts((previous) => previous.filter((item) => item._id !== product._id));
      onProductoGuardado?.(null, product._id);
    } catch (err) {
      setError(err instanceof TypeError ? 'No se pudo conectar con el servidor.' : err.message);
    }
  };

  return (
    <>
      <section className="page-header">
        <p className="eyebrow">ADMINISTRACIÓN</p>
        <h1>Gestionar productos</h1>
        <p>Creá productos nuevos, editá sus datos o quitá artículos del catálogo.</p>
      </section>
      {editing !== null ? (
        <AdminCrearProducto
          key={editing?._id || 'new-product'}
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
