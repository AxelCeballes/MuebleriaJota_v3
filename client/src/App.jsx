import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import ContactForm from './components/ContactForm';
import Cart from './components/Cart';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import AdminGestion from './pages/AdminGestion';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Perfil from './pages/Perfil';
import MisPedidos from './pages/MisPedidos';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { useCart } from './hooks/useCart';
import { useCheckout } from './hooks/useCheckout';

// Componente para la página de inicio
function HomePage({ productos, onAddToCart, onSelectProduct, cargando, error, onReintentar }) {
  const productosDestacados = productos.filter((producto) => producto.destacado);

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">MUEBLES CON HISTORIA</p>
          <h1>Diseño que honra el pasado y abraza el futuro.</h1>
          <p>
            Creamos piezas atemporales con materiales nobles, oficio artesanal y una
            mirada consciente.
          </p>
          <Link to="/productos" className="btn">
            VER CATÁLOGO
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">SELECCIÓN JOTA</p>
          <h2>Piezas destacadas</h2>
          <p>Descubrí muebles pensados para formar parte de tu historia.</p>
        </div>
        <ProductList
          productos={productosDestacados}
          onSelectProduct={onSelectProduct}
          onAddToCart={onAddToCart}
          mostrarBuscador={false}
          cargando={cargando}
          error={error}
          onReintentar={onReintentar}
        />
      </section>

      <section className="sustainability">
        <div>
          <p className="eyebrow">NUESTRO COMPROMISO</p>
          <h2>Diseñar pensando en mañana.</h2>
          <p>
            Priorizamos maderas certificadas, proveedores locales y acabados naturales.
            Cada pieza busca durar, repararse y acompañarte durante años.
          </p>
          <Link to="/productos" className="text-link">
            Conocé nuestra colección →
          </Link>
        </div>
      </section>
    </>
  );
}

// Componente para la página del catálogo de productos
function ProductosPage({ productos, onAddToCart, onSelectProduct, cargando, error, onReintentar }) {
  return (
    <>
      <section className="page-header">
        <p className="eyebrow">COLECCIÓN 2026</p>
        <h1>Catálogo</h1>
        <p>Objetos para vivir espacios con carácter.</p>
      </section>

      <ProductList
        productos={productos}
        onSelectProduct={onSelectProduct}
        onAddToCart={onAddToCart}
        mostrarBuscador={true}
        cargando={cargando}
        error={error}
        onReintentar={onReintentar}
      />
    </>
  );
}

// Componente para la página de detalle de producto según id de la ruta
function ProductoDetallePage({ productos, onAddToCart, cargando, error, onReintentar }) {
  const navigate = useNavigate();
  const { id } = useParams();

  // El id de la URL es la única fuente de verdad del producto en detalle
  const producto = id
    ? productos.find((p) => String(p._id) === String(id)) || null
    : null;

  // Mientras la API no responde todavía no se puede afirmar que el id no exista:
  // mostrar "no encontrado" acá produce un destello antes del producto real.
  if (cargando) {
    return (
      <div className="product-detail-container">
        <p className="grid-status" role="status">
          Cargando producto...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-detail-container">
        <div className="grid-status" role="alert">
          <p>{error}</p>
          {onReintentar && (
            <button type="button" className="btn" onClick={onReintentar}>
              REINTENTAR
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <ProductDetail
      producto={producto}
      onAddToCart={onAddToCart}
      onBack={() => navigate('/productos')}
    />
  );
}

// Componente para la página de contacto
function ContactoPage() {
  return (
    <>
      <section className="page-header">
        <p className="eyebrow">HABLEMOS</p>
        <h1>Contacto</h1>
        <p>¿Tenés una consulta? Estamos para ayudarte.</p>
      </section>

      <ContactForm />
    </>
  );
}

// Componente para la página de carrito
function CarritoPage({
  itemsCarrito,
  totalUnidades,
  totalCarrito,
  onAddToCart,
  onQuitarUnidad,
  onEliminarProducto,
  onVaciarCarrito,
  onPedidoConfirmado
}) {
  const navigate = useNavigate();
  const confirmarPedido = useCheckout();

  const handleCheckout = async () => {
    const pedido = await confirmarPedido();
    if (pedido) onPedidoConfirmado?.();
    return pedido;
  };

  return (
    <>
      <section className="page-header">
        <p className="eyebrow">TU SELECCIÓN</p>
        <h1>Carrito</h1>
        <p>Revisá tus piezas antes de continuar.</p>
      </section>

      <Cart
        items={itemsCarrito}
        totalUnidades={totalUnidades}
        total={totalCarrito}
        onNavigate={(destino) => {
          if (destino === 'catalogo') navigate('/productos');
          else if (destino === 'inicio') navigate('/');
          else if (destino === 'contacto') navigate('/contacto');
          else navigate(`/${destino}`);
        }}
        onAgregar={onAddToCart}
        onQuitarUnidad={onQuitarUnidad}
        onEliminar={onEliminarProducto}
        onVaciar={onVaciarCarrito}
        onCheckout={handleCheckout}
      />
    </>
  );
}

// Adapta la respuesta de MongoDB a los valores que consumen los componentes.
const normalizarProducto = (producto) => ({
  ...producto,
  stock: Number.isFinite(Number(producto.stock)) ? Number(producto.stock) : 0,
  imagenUrl: typeof producto.imagenUrl === 'string' ? producto.imagenUrl : '',
  categoria: typeof producto.categoria === 'string' ? producto.categoria : 'Sin categoría',
  especificaciones: Array.isArray(producto.especificaciones) ? producto.especificaciones : [],
  destacado: Boolean(producto.destacado),
});

// Contenido principal de la aplicación con Router
function AppContent() {
  const navigate = useNavigate();

  // Estado de productos y ciclo de vida de la petición
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const solicitarProductos = useCallback(async (signal) => {
    try {
      const respuesta = await fetch((import.meta.env.VITE_API_BASE || '') + '/api/productos', { signal });
      if (!respuesta.ok) {
        throw new Error(`Error ${respuesta.status} al pedir los productos`);
      }
      const datos = await respuesta.json();
      // La app trabaja siempre contra un listado: si la API contesta 200 pero
      // con otra forma de dato, se trata como error en lugar de guardar algo
      // que rompería el catálogo al renderizar.
      if (!Array.isArray(datos)) {
        throw new Error('La respuesta de la API no es un listado de productos');
      }
      setProductos(datos.map(normalizarProducto));
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError('No pudimos cargar el catálogo. Verificá que el servidor esté activo e intentá de nuevo.');
    } finally {
      if (!signal || !signal.aborted) setCargando(false);
    }
  }, []);

  const cargarProductos = useCallback((signal) => {
    setCargando(true);
    setError(null);
    return solicitarProductos(signal);
  }, [solicitarProductos]);

  useEffect(() => {
    const controlador = new AbortController();
    solicitarProductos(controlador.signal);
    return () => controlador.abort();
  }, [solicitarProductos]);

  // El carrito vive en CartContext; acá sólo se conserva el estado del catálogo.
  const {
    itemsCarrito,
    totalUnidades,
    totalCarrito,
    agregarProducto: handleAddToCart,
    quitarUnidad: handleQuitarUnidad,
    eliminarProducto: handleEliminarProducto,
    vaciarCarrito: handleVaciarCarrito,
  } = useCart();

  const handleSelectProduct = (producto) => {
    navigate(`/productos/${producto._id}`);
  };

  const handleProductoCreado = (producto, deletedId) => {
    if (deletedId) {
      setProductos((prev) => prev.filter((item) => item._id !== deletedId));
      return;
    }
    if (!producto) return;
    const productoNormalizado = normalizarProducto(producto);
    setProductos((prev) => [
      productoNormalizado,
      ...prev.filter((item) => item._id !== productoNormalizado._id),
    ]);
  };

  return (
    <CartProvider productos={productos}>
      <div className="App">
        <ScrollToTop />
        <Navbar cantidadCarrito={totalUnidades} />

        <main>
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  productos={productos}
                  onAddToCart={handleAddToCart}
                  onSelectProduct={handleSelectProduct}
                  cargando={cargando}
                  error={error}
                  onReintentar={() => cargarProductos()}
                />
              }
            />
            <Route
              path="/productos"
              element={
                <ProductosPage
                  productos={productos}
                  onAddToCart={handleAddToCart}
                  onSelectProduct={handleSelectProduct}
                  cargando={cargando}
                  error={error}
                  onReintentar={() => cargarProductos()}
                />
              }
            />
            <Route
              path="/productos/:id"
              element={
                <ProductoDetallePage
                  productos={productos}
                  onAddToCart={handleAddToCart}
                  cargando={cargando}
                  error={error}
                  onReintentar={() => cargarProductos()}
                />
              }
            />
            <Route
              path="/contacto"
              element={<ContactoPage />}
            />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <Perfil />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mis-pedidos"
              element={
                <ProtectedRoute>
                  <MisPedidos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/crear-producto"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminGestion onProductoGuardado={handleProductoCreado} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/carrito"
              element={
                <CarritoPage
                  itemsCarrito={itemsCarrito}
                  totalUnidades={totalUnidades}
                  totalCarrito={totalCarrito}
                  onAddToCart={handleAddToCart}
                  onQuitarUnidad={handleQuitarUnidad}
                  onEliminarProducto={handleEliminarProducto}
                  onVaciarCarrito={handleVaciarCarrito}
                  onPedidoConfirmado={cargarProductos}
                />
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </CartProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
