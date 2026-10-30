import { Link } from 'react-router-dom';

const categorias = [
  'Aparadores',
  'Bibliotecas',
  'Escritorios',
  'Mesas',
  'Sillas',
  'Sillones',
];

function AdminCrearProducto() {
  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <>
      <section className="page-header">
        <p className="eyebrow">ADMINISTRACIÓN</p>
        <h1>Crear producto</h1>
        <p>Alta de una nueva pieza para el catálogo de Hermanos Jota.</p>
      </section>

      <section className="contact-section admin-section">
        <form className="contact-form admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-heading">
            <p className="eyebrow">NUEVA PIEZA</p>
            <h2>Datos del producto</h2>
          </div>

          <label htmlFor="nombre">Nombre</label>
          <input id="nombre" name="nombre" type="text" required />

          <label htmlFor="descripcion">Descripción</label>
          <textarea id="descripcion" name="descripcion" rows={5} required />

          <div className="admin-form-row">
            <div>
              <label htmlFor="precio">Precio</label>
              <input id="precio" name="precio" type="number" min="0" step="1" required />
            </div>
            <div>
              <label htmlFor="stock">Stock</label>
              <input id="stock" name="stock" type="number" min="0" step="1" required />
            </div>
          </div>

          <label htmlFor="categoria">Categoría</label>
          <select id="categoria" name="categoria" defaultValue="" required>
            <option value="" disabled>Seleccionar categoría</option>
            {categorias.map((categoria) => (
              <option key={categoria} value={categoria}>{categoria}</option>
            ))}
          </select>

          <label htmlFor="imagenUrl">Imagen URL</label>
          <input
            id="imagenUrl"
            name="imagenUrl"
            type="text"
            placeholder="/img/Nombre del producto.png"
            required
          />

          <label htmlFor="especificaciones">Especificaciones</label>
          <textarea
            id="especificaciones"
            name="especificaciones"
            rows={5}
            placeholder={'Medidas: 120 × 45 × 75 cm\nMaterial: Roble macizo\nTerminación: Aceite natural'}
          />
          <p className="admin-help">Una especificación por línea con formato «Etiqueta: valor».</p>

          <label className="form-checkbox" htmlFor="destacado">
            <input id="destacado" name="destacado" type="checkbox" />
            <span>Mostrar como producto destacado</span>
          </label>

          <button className="btn" type="submit">GUARDAR PRODUCTO</button>

          <p className="admin-note" role="status">
            Estructura visual preparada. La conexión con la API se implementará en la próxima etapa.
          </p>
        </form>

        <aside className="contact-info">
          <p className="eyebrow">VISTA PREVIA</p>
          <h2>Una ficha completa</h2>
          <p>
            Este formulario refleja los campos del catálogo actual: precio, stock,
            categoría, imagen, especificaciones y producto destacado.
          </p>
          <ul className="admin-preview-list">
            <li>Los identificadores serán ObjectId generados por MongoDB.</li>
            <li>La imagen se tomará desde <code>imagenUrl</code>.</li>
            <li>Las especificaciones mantendrán la estructura <code>{'{ label, value }'}</code>.</li>
          </ul>
          <Link to="/productos" className="text-link">Volver al catálogo →</Link>
        </aside>
      </section>
    </>
  );
}

export default AdminCrearProducto;
