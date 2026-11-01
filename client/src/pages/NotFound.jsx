import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <>
      <section className="page-header">
        <p className="eyebrow">ERROR 404</p>
        <h1>Página no encontrada</h1>
        <p>La dirección que ingresaste no corresponde a ninguna página de Hermanos Jota.</p>
      </section>

      <section className="section not-found">
        <div className="section-heading">
          <p className="eyebrow">NOS PERDIMOS</p>
          <h2>Volvamos a un lugar conocido.</h2>
          <p>
            Podés volver al inicio o recorrer el catálogo para seguir descubriendo
            nuestras piezas.
          </p>
        </div>

        <div className="not-found-actions">
          <Link to="/" className="btn">VOLVER AL INICIO</Link>
          <Link to="/productos" className="text-link">VER CATÁLOGO →</Link>
        </div>
      </section>
    </>
  );
}

export default NotFound;
