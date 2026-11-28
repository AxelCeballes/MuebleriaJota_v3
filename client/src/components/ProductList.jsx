import { useState, useMemo, useRef, useEffect } from 'react';
import ProductCard from './ProductCard';
import { Link } from 'react-router-dom';
import { normalizarTexto } from '../utils/format';

function ProductList({
  productos = [],
  onSelectProduct,
  onAddToCart,
  mostrarBuscador = true,
  cargando = false,
  error = null,
  onReintentar,
  modoCarrusel = false,
}) {
  const [busqueda, setBusqueda] = useState('');
  const [ambiente, setAmbiente] = useState('');
  const [tipo, setTipo] = useState('');
  const [precioMin, setPrecioMin] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [hayMasProductos, setHayMasProductos] = useState(false);
  const carruselRef = useRef(null);

  // Los filtros son independientes y se combinan en tiempo real.
  const productosFiltrados = useMemo(() => {
    const termino = normalizarTexto(busqueda);
    return productos.filter((producto) => {
      const textoCompleto = normalizarTexto(`${producto.nombre} ${producto.categoria || ''} ${producto.ambiente || ''} ${producto.descripcion || ''}`);
      const coincideBusqueda = !termino || textoCompleto.includes(termino);
      const coincideAmbiente = !ambiente || normalizarTexto(producto.ambiente || '') === normalizarTexto(ambiente);
      const coincideTipo = !tipo || normalizarTexto(producto.categoria || '') === normalizarTexto(tipo);
      const precio = Number(producto.precio) || 0;
      const coincideMin = precioMin === '' || precio >= Number(precioMin);
      const coincideMax = precioMax === '' || precio <= Number(precioMax);
      return coincideBusqueda && coincideAmbiente && coincideTipo && coincideMin && coincideMax;
    });
  }, [productos, busqueda, ambiente, tipo, precioMin, precioMax]);

  useEffect(() => {
    if (!modoCarrusel || !carruselRef.current) return undefined;
    const elemento = carruselRef.current;
    const actualizar = () => setHayMasProductos(elemento.scrollWidth > elemento.clientWidth + 4);
    actualizar();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(actualizar);
    observer.observe(elemento);
    return () => observer.disconnect();
  }, [modoCarrusel, productosFiltrados.length]);

  const ambientes = [...new Set(['Comedor', 'Dormitorio', 'Living', 'Cocina', 'Oficina', 'Exterior', 'Recibidor', ...productos.map((p) => p.ambiente).filter(Boolean)])].sort();
  const tipos = [...new Set(productos.map((p) => p.categoria).filter(Boolean))].sort();
  const limpiarFiltros = () => { setBusqueda(''); setAmbiente(''); setTipo(''); setPrecioMin(''); setPrecioMax(''); };
  const desplazarCarrusel = (direccion) => carruselRef.current?.scrollBy({ left: direccion * carruselRef.current.clientWidth * 0.82, behavior: 'smooth' });

  // Contenido de la grilla según el ciclo de la petición: cargando, error o éxito
  let contenido;
  if (cargando) {
    contenido = (
      <p className="grid-status" role="status">
        Cargando catálogo...
      </p>
    );
  } else if (error) {
    contenido = (
      <div className="grid-status" role="alert">
        <p>{error}</p>
        {onReintentar && (
          <button type="button" className="btn" onClick={onReintentar}>
            REINTENTAR
          </button>
        )}
      </div>
    );
  } else if (productosFiltrados.length === 0) {
    contenido = <p className="grid-status">No encontramos productos.</p>;
  } else {
    contenido = productosFiltrados.map((producto) => (
      <ProductCard
        key={producto._id}
        producto={producto}
        onSelect={onSelectProduct}
        onAddToCart={onAddToCart}
      />
    ));
  }

  const grilla = (
    <div id={mostrarBuscador ? 'product-grid' : 'featured-products'} ref={modoCarrusel ? carruselRef : undefined} className={`product-grid${modoCarrusel ? ' product-carousel' : ''}`}>
      {contenido}
    </div>
  );

  // En la portada solo se muestra la grilla; en el catálogo, buscador + grilla
  if (!mostrarBuscador) {
    return <div className={modoCarrusel ? 'featured-carousel-wrap' : undefined}>
      {modoCarrusel && hayMasProductos && <div className="carousel-controls">
        <button type="button" aria-label="Productos anteriores" onClick={() => desplazarCarrusel(-1)}>‹</button>
        <button type="button" aria-label="Productos siguientes" onClick={() => desplazarCarrusel(1)}>›</button>
      </div>}
      {grilla}
      {modoCarrusel && <Link className="text-link featured-all-link" to="/productos">Ver todos los productos →</Link>}
    </div>;
  }

  return (
    <section className="section catalog-section">
      <label className="search-label" htmlFor="search">
        Buscar producto
      </label>
      <input
        id="search"
        className="search-input"
        type="search"
        placeholder="Ej: sillón, mesa, silla..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />
      <div className="catalog-filter-heading">
        <p><strong>{productosFiltrados.length}</strong> productos encontrados</p>
        <button type="button" className="filter-toggle" aria-expanded={filtrosAbiertos} onClick={() => setFiltrosAbiertos((v) => !v)}>Filtrar productos {filtrosAbiertos ? '−' : '+'}</button>
      </div>
      <div className={`catalog-layout${filtrosAbiertos ? ' filters-open' : ''}`}>
        <aside className="catalog-filters" aria-label="Filtros del catálogo">
          <div className="filter-title-row"><h2>Filtros</h2><button type="button" onClick={limpiarFiltros}>Limpiar</button></div>
          <label htmlFor="filter-ambiente">Ambiente</label>
          <select id="filter-ambiente" value={ambiente} onChange={(e) => setAmbiente(e.target.value)}><option value="">Todos</option>{ambientes.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <label htmlFor="filter-tipo">Tipo de mueble</label>
          <select id="filter-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}><option value="">Todos</option>{tipos.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <fieldset><legend>Precio</legend><div className="price-filter-row"><label htmlFor="price-min">Mínimo<input id="price-min" type="number" min="0" value={precioMin} onChange={(e) => setPrecioMin(e.target.value)} placeholder="$ 0" /></label><label htmlFor="price-max">Máximo<input id="price-max" type="number" min="0" value={precioMax} onChange={(e) => setPrecioMax(e.target.value)} placeholder="Sin límite" /></label></div></fieldset>
        </aside>
        <div className="catalog-results">{grilla}</div>
      </div>
    </section>
  );
}

export default ProductList;
