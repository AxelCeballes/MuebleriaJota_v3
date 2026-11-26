import { useEffect, useMemo, useState } from 'react';
import { formatoPrecio, normalizarTexto, resolverImagenUrl } from '../utils/format';
import { headersConToken, leerJsonDeRespuesta } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import AdminCrearProducto from './AdminCrearProducto';
import AdminIcon from './admin/AdminIcon';

const API = (import.meta.env.VITE_API_BASE || '') + '/api';

function AdminGestion({ onProductoGuardado }) {
  const { token } = useAuth();
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [editing, setEditing] = useState(null);
  const [reload, setReload] = useState(0);
  const [busqueda, setBusqueda] = useState('');

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

  const productosFiltrados = useMemo(() => {
    if (!Array.isArray(products)) return [];
    const texto = normalizarTexto(busqueda.trim());
    if (!texto) return products;

    return products.filter((product) =>
      normalizarTexto(`${product.nombre} ${product.categoria || ''}`).includes(texto),
    );
  }, [products, busqueda]);

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
      const response = await fetch(`${API}/productos/${product._id}`, {
        method: 'DELETE',
        headers: headersConToken(token),
      });
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

  if (editing !== null) {
    return (
      <AdminCrearProducto
        key={editing?._id || 'new-product'}
        initialProduct={editing || undefined}
        onProductoGuardado={handleProductoGuardado}
        onCancelar={() => setEditing(null)}
      />
    );
  }

  return (
    <section className="admin-page">
      <header className="admin-section-heading admin-section-heading-row">
        <div>
          <p className="eyebrow">PRODUCTOS</p>
          <h1>Gestión de productos</h1>
          <p>Creá piezas nuevas, editá sus datos o quitá artículos del catálogo.</p>
        </div>
        <button
          type="button"
          className="btn admin-create-btn"
          onClick={() => {
            setMensajeExito('');
            setEditing(false);
          }}
        >
          NUEVO PRODUCTO
        </button>
      </header>

      {mensajeExito && <p className="form-message" role="status">{mensajeExito}</p>}
      {error && <p className="form-message form-message-error" role="alert">{error}</p>}

      {products !== null && (
        <div className="admin-toolbar admin-toolbar-single">
          <label className="admin-search">
            <span>Buscar</span>
            <input
              type="search"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Nombre o categoría"
            />
          </label>
        </div>
      )}

      {products === null && (
        <p className="admin-status" role="status">Cargando productos...</p>
      )}

      {products !== null && productosFiltrados.length === 0 && (
        <p className="admin-empty">
          {products.length === 0
            ? 'Todavía no hay productos publicados.'
            : 'No encontramos productos con esa búsqueda.'}
        </p>
      )}

      {productosFiltrados.length > 0 && (
        <div className="admin-product-list">
          {productosFiltrados.map((product) => {
            const stock = Number(product.stock) || 0;

            return (
              <article className="admin-product-card" key={product._id}>
                <div className="admin-product-media">
                  {product.imagenUrl ? (
                    <img
                      src={resolverImagenUrl(product.imagenUrl)}
                      alt={product.nombre}
                      loading="lazy"
                    />
                  ) : (
                    <span className="admin-product-placeholder">
                      <AdminIcon nombre="productos" />
                    </span>
                  )}
                </div>

                <div className="admin-product-info">
                  <div className="admin-product-title">
                    <h2>{product.nombre}</h2>
                    <span className="admin-badge admin-badge-success">Publicado</span>
                    {product.destacado && (
                      <span className="admin-badge admin-badge-gold">Destacado</span>
                    )}
                  </div>
                  <p className="admin-product-category">{product.categoria || 'Sin categoría'}</p>
                  <div className="admin-product-meta">
                    <span>{formatoPrecio(Number(product.precio))}</span>
                    <span>Stock: {stock}</span>
                  </div>
                </div>

                <div className="admin-product-actions">
                  <button
                    className="admin-action"
                    type="button"
                    onClick={() => {
                      setMensajeExito('');
                      setEditing(product);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className="admin-action admin-action-danger"
                    type="button"
                    onClick={() => removeProduct(product)}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default AdminGestion;
