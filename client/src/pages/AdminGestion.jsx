import { useEffect, useState } from 'react';
import { formatoPrecio } from '../utils/format';
import { leerJsonDeRespuesta } from '../utils/api';
import AdminCrearProducto from './AdminCrearProducto';

const API = (import.meta.env.VITE_API_BASE || '') + '/api';

function AdminGestion({ onProductoGuardado }) {
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [editing, setEditing] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    const loadProducts = async () => {
      try {
        const response = await fetch(`${API}/productos`);
        const data = await leerJsonDeRespuesta(response);
        if (!response.ok) {
          throw new Error(data?.message || 'No se pudo cargar el catálogo.');
        }
        if (!Array.isArray(data)) {
          throw new Error('La respuesta del servidor no es un listado de productos válido.');
        }
        if (active) {
          setProducts(data);
          setError('');
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'No se pudo cargar el catálogo.');
          setProducts((previous) => (Array.isArray(previous) ? previous : []));
        }
      }
    };
    loadProducts();
    return () => { active = false; };
  }, [reload]);

  const handleProductoGuardado = (product) => {
    const esEdicion = Boolean(editing);
    onProductoGuardado?.(product);
    setProducts((previous) => {
      const listado = Array.isArray(previous) ? previous : [];
      if (esEdicion) {
        const existe = listado.some((item) => item._id === product._id);
        return existe
          ? listado.map((item) => (item._id === product._id ? { ...item, ...product } : item))
          : [product, ...listado];
      }
      return [product, ...listado.filter((item) => item._id !== product._id)];
    });
    setMensajeExito(
      esEdicion ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.'
    );
    setError('');
    setEditing(null);
    setReload((value) => value + 1);
  };

  const removeProduct = async (product) => {
    if (!window.confirm(`¿Eliminar “${product.nombre}”? Esta acción no se puede deshacer.`)) return;
    setError('');
    setMensajeExito('');
    try {
      const response = await fetch(`${API}/productos/${product._id}`, { method: 'DELETE' });
      const data = await leerJsonDeRespuesta(response);
      if (!response.ok) throw new Error(data?.message || 'No se pudo eliminar el producto.');
      setProducts((previous) => (
        Array.isArray(previous) ? previous.filter((item) => item._id !== product._id) : []
      ));
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
          onProductoGuardado={handleProductoGuardado}
          onCancelar={() => setEditing(null)}
        />
      ) : (
        <section className="section catalog-section admin-product-list">
          <button
            type="button"
            className="btn"
            onClick={() => {
              setMensajeExito('');
              setEditing(false);
            }}
          >
            NUEVO PRODUCTO
          </button>
          {mensajeExito && <p className="form-message" role="status">{mensajeExito}</p>}
          {error && <p className="form-message form-message-error" role="alert">{error}</p>}
          {products === null ? <p className="grid-status" role="status">Cargando productos...</p> : products.map((product) => (
            <article className="admin-product-row" key={product._id}>
              <div><strong>{product.nombre}</strong><p>{formatoPrecio(product.precio)} · Stock: {product.stock ?? 0}</p></div>
              <div className="admin-product-actions">
                <button
                  className="btn-outline"
                  type="button"
                  onClick={() => {
                    setMensajeExito('');
                    setEditing(product);
                  }}
                >
                  EDITAR
                </button>
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
