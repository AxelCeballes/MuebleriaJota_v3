import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { resolverImagenUrl } from '../utils/format';

const categorias = [
  'Aparadores',
  'Bibliotecas',
  'Escritorios',
  'Mesas',
  'Sillas',
  'Sillones',
];

const formularioInicial = {
  nombre: '',
  descripcion: '',
  precio: '',
  stock: '',
  imagenUrl: '',
  categoria: '',
  destacado: false,
};

const erroresIniciales = {
  nombre: '',
  precio: '',
  stock: '',
  especificaciones: '',
};

function AdminCrearProducto({ onProductoGuardado, onCancelar, onUnauthorized, accessToken, initialProduct }) {
  const navigate = useNavigate();
  const redireccionRef = useRef(null);
  const [formData, setFormData] = useState(() => initialProduct ? {
    nombre: initialProduct.nombre || '',
    descripcion: initialProduct.descripcion || '',
    precio: String(initialProduct.precio ?? ''),
    stock: String(initialProduct.stock ?? 0),
    imagenUrl: initialProduct.imagenUrl || '',
    categoria: initialProduct.categoria || '',
    destacado: Boolean(initialProduct.destacado),
  } : formularioInicial);
  const [especificaciones, setEspecificaciones] = useState(() => initialProduct?.especificaciones || []);
  const [errores, setErrores] = useState(erroresIniciales);
  const [erroresEspecificaciones, setErroresEspecificaciones] = useState([]);
  const [estado, setEstado] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [imagenArchivo, setImagenArchivo] = useState(null);
  const [vistaPreviaLocal, setVistaPreviaLocal] = useState('');
  const vistaPreviaRef = useRef('');

  useEffect(() => () => {
    if (redireccionRef.current) clearTimeout(redireccionRef.current);
    if (vistaPreviaRef.current) URL.revokeObjectURL(vistaPreviaRef.current);
  }, []);

  const limpiarFormulario = () => {
    setFormData(formularioInicial);
    setEspecificaciones([]);
    setErrores(erroresIniciales);
    setErroresEspecificaciones([]);
    setImagenArchivo(null);
    if (vistaPreviaRef.current) URL.revokeObjectURL(vistaPreviaRef.current);
    vistaPreviaRef.current = '';
    setVistaPreviaLocal('');
  };

  const handleImagenSeleccionada = (event) => {
    const archivo = event.target.files?.[0];
    if (!archivo) return;
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tiposPermitidos.includes(archivo.type)) {
      setEstado({ tipo: 'error', texto: 'Elegí una imagen JPG, PNG o WebP.' });
      event.target.value = '';
      return;
    }
    if (archivo.size > 3 * 1024 * 1024) {
      setEstado({ tipo: 'error', texto: 'La imagen debe pesar como máximo 3 MB.' });
      event.target.value = '';
      return;
    }
    if (vistaPreviaRef.current) URL.revokeObjectURL(vistaPreviaRef.current);
    vistaPreviaRef.current = URL.createObjectURL(archivo);
    setVistaPreviaLocal(vistaPreviaRef.current);
    setImagenArchivo(archivo);
    setEstado(null);
  };

  const quitarImagen = () => {
    setImagenArchivo(null);
    setFormData((prev) => ({ ...prev, imagenUrl: '' }));
    if (vistaPreviaRef.current) URL.revokeObjectURL(vistaPreviaRef.current);
    vistaPreviaRef.current = '';
    setVistaPreviaLocal('');
    setEstado(null);
  };

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errores[name]) {
      setErrores((prev) => ({ ...prev, [name]: '' }));
    }

    if (estado) setEstado(null);
  };

  const handleEspecificacionChange = (index, campo, valor) => {
    setEspecificaciones((prev) =>
      prev.map((especificacion, posicion) =>
        posicion === index ? { ...especificacion, [campo]: valor } : especificacion
      )
    );

    setErroresEspecificaciones((prev) =>
      prev.map((error, posicion) =>
        posicion === index ? { ...error, [campo]: '' } : error
      )
    );

    setErrores((prev) =>
      prev.especificaciones ? { ...prev, especificaciones: '' } : prev
    );

    if (estado) setEstado(null);
  };

  const agregarEspecificacion = () => {
    setEspecificaciones((prev) => [...prev, { label: '', value: '' }]);
    setErroresEspecificaciones((prev) => [...prev, { label: '', value: '' }]);
    if (estado) setEstado(null);
  };

  const quitarEspecificacion = (index) => {
    setEspecificaciones((prev) =>
      prev.filter((_, posicion) => posicion !== index)
    );
    setErroresEspecificaciones((prev) =>
      prev.filter((_, posicion) => posicion !== index)
    );
    setErrores((prev) =>
      prev.especificaciones ? { ...prev, especificaciones: '' } : prev
    );
    if (estado) setEstado(null);
  };

  const validarFormulario = () => {
    const nuevosErrores = { ...erroresIniciales };
    const nuevosErroresEspecificaciones = especificaciones.map(() => ({
      label: '',
      value: '',
    }));

    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio.';
    }

    const precioTexto = formData.precio.trim();
    let precioNumero = null;

    if (!precioTexto) {
      nuevosErrores.precio = 'El precio es obligatorio.';
    } else {
      precioNumero = Number(precioTexto);
      if (!Number.isFinite(precioNumero)) {
        nuevosErrores.precio = 'Ingresá un precio válido.';
      } else if (precioNumero < 0) {
        nuevosErrores.precio = 'El precio debe ser mayor o igual a cero.';
      }
    }

    const stockTexto = formData.stock.trim();
    let stockNumero = null;

    if (!stockTexto) {
      nuevosErrores.stock = 'El stock es obligatorio.';
    } else {
      stockNumero = Number(stockTexto);
      if (!Number.isFinite(stockNumero) || !Number.isInteger(stockNumero)) {
        nuevosErrores.stock = 'El stock debe ser un número entero.';
      } else if (stockNumero < 0) {
        nuevosErrores.stock = 'El stock debe ser mayor o igual a cero.';
      }
    }

    especificaciones.forEach((especificacion, index) => {
      if (!especificacion.label.trim()) {
        nuevosErroresEspecificaciones[index].label = 'Completá la etiqueta.';
      }
      if (!especificacion.value.trim()) {
        nuevosErroresEspecificaciones[index].value = 'Completá el valor.';
      }
    });

    const hayErroresEspecificaciones = nuevosErroresEspecificaciones.some(
      (error) => error.label || error.value
    );

    if (hayErroresEspecificaciones) {
      nuevosErrores.especificaciones =
        'Completá etiqueta y valor en todas las especificaciones.';
    }

    const hayErrores =
      Object.values(nuevosErrores).some(Boolean) || hayErroresEspecificaciones;

    setErrores(nuevosErrores);
    setErroresEspecificaciones(nuevosErroresEspecificaciones);

    if (hayErrores) {
      setEstado({
        tipo: 'error',
        texto: 'Revisá los campos marcados antes de guardar el producto.',
      });
      return null;
    }

    return {
      precio: precioNumero,
      stock: stockNumero,
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (enviando) return;

    const valoresValidados = validarFormulario();
    if (!valoresValidados) return;

    setEstado(null);
    setEnviando(true);

    const payload = {
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim(),
      precio: valoresValidados.precio,
      stock: valoresValidados.stock,
      imagenUrl: formData.imagenUrl.trim(),
      destacado: formData.destacado,
    };

    if (formData.categoria.trim()) {
      payload.categoria = formData.categoria.trim();
    }

    if (especificaciones.length > 0) {
      payload.especificaciones = especificaciones.map((especificacion) => ({
        label: especificacion.label.trim(),
        value: especificacion.value.trim(),
      }));
    }

    try {
      if (imagenArchivo) {
        const datosImagen = new FormData();
        datosImagen.append('imagen', imagenArchivo);
        const respuestaImagen = await fetch((import.meta.env.VITE_API_BASE || '') + '/api/imagenes', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: datosImagen,
        });
        let resultadoImagen = null;
        try {
          resultadoImagen = await respuestaImagen.json();
        } catch {
          resultadoImagen = null;
        }
        if (!respuestaImagen.ok || !resultadoImagen?.imagenUrl) {
          if (respuestaImagen.status === 401) onUnauthorized?.();
          throw new Error(resultadoImagen?.message || 'No se pudo subir la imagen.');
        }
        payload.imagenUrl = resultadoImagen.imagenUrl;
      }

      const respuesta = await fetch((import.meta.env.VITE_API_BASE || '') + '/api/productos' + (initialProduct ? `/${initialProduct._id}` : ''), {
        method: initialProduct ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!respuesta.ok) {
        if (respuesta.status === 401) onUnauthorized?.();
        let datosError = null;
        try {
          datosError = await respuesta.json();
        } catch {
          datosError = null;
        }

        const detalles = Array.isArray(datosError?.errors)
          ? ` ${datosError.errors.join(' ')}`
          : '';
        throw new Error(
          datosError?.message
            ? `${datosError.message}${detalles}`
            : 'El servidor rechazó la creación del producto.'
        );
      }

      const productoCreado = await respuesta.json();

      limpiarFormulario();
      if (onProductoGuardado) {
        onProductoGuardado(productoCreado);
        return;
      }
      setEstado({
        tipo: 'exito',
        texto: `${initialProduct ? 'Producto actualizado' : 'Producto creado'} correctamente. Volviendo al catálogo...`,
      });

      redireccionRef.current = setTimeout(() => {
        navigate('/productos');
      }, 900);
    } catch (error) {
      setEstado({
        tipo: 'error',
        texto:
          error instanceof TypeError
            ? 'No pudimos conectar con el servidor. Verificá que esté activo e intentá nuevamente.'
            : error.message,
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <section className="page-header">
        <p className="eyebrow">ADMINISTRACIÓN</p>
        <h1>{initialProduct ? 'Editar producto' : 'Crear producto'}</h1>
        <p>{initialProduct ? 'Actualizá los datos de esta pieza.' : 'Alta de una nueva pieza para el catálogo de Hermanos Jota.'}</p>
      </section>

      <section className="contact-section admin-section">
        <form
          className="contact-form admin-form"
          onSubmit={handleSubmit}
          noValidate
          aria-busy={enviando}
        >
          <div className="admin-form-heading">
            <p className="eyebrow">NUEVA PIEZA</p>
            <h2>Datos del producto</h2>
          </div>

          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            value={formData.nombre}
            onChange={handleChange}
            disabled={enviando}
            aria-invalid={Boolean(errores.nombre)}
            aria-describedby={errores.nombre ? 'nombre-error' : undefined}
          />
          {errores.nombre && (
            <p id="nombre-error" className="field-error">{errores.nombre}</p>
          )}

          <label htmlFor="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            name="descripcion"
            rows={5}
            value={formData.descripcion}
            onChange={handleChange}
            disabled={enviando}
          />

          <div className="admin-form-row">
            <div>
              <label htmlFor="precio">Precio</label>
              <input
                id="precio"
                name="precio"
                type="number"
                min="0"
                step="0.01"
                value={formData.precio}
                onChange={handleChange}
                disabled={enviando}
                aria-invalid={Boolean(errores.precio)}
                aria-describedby={errores.precio ? 'precio-error' : undefined}
              />
              {errores.precio && (
                <p id="precio-error" className="field-error">{errores.precio}</p>
              )}
            </div>
            <div>
              <label htmlFor="stock">Stock</label>
              <input
                id="stock"
                name="stock"
                type="number"
                min="0"
                step="1"
                value={formData.stock}
                onChange={handleChange}
                disabled={enviando}
                aria-invalid={Boolean(errores.stock)}
                aria-describedby={errores.stock ? 'stock-error' : undefined}
              />
              {errores.stock && (
                <p id="stock-error" className="field-error">{errores.stock}</p>
              )}
            </div>
          </div>

          <label htmlFor="categoria">Categoría</label>
          <select
            id="categoria"
            name="categoria"
            value={formData.categoria}
            onChange={handleChange}
            disabled={enviando}
          >
            <option value="">Sin categoría</option>
            {categorias.map((categoria) => (
              <option key={categoria} value={categoria}>{categoria}</option>
            ))}
          </select>

          <label htmlFor="imagenArchivo">Imagen del producto</label>
          <input
            id="imagenArchivo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImagenSeleccionada}
            disabled={enviando}
          />
          <p className="admin-help">Buscá una imagen en tus archivos. Formatos: JPG, PNG o WebP; máximo 3 MB.</p>
          {(vistaPreviaLocal || formData.imagenUrl) && (
            <div className="admin-image-preview">
              <img
                src={vistaPreviaLocal || resolverImagenUrl(formData.imagenUrl)}
                alt="Vista previa de la imagen del producto"
              />
              <button type="button" className="btn-outline" onClick={quitarImagen} disabled={enviando}>
                QUITAR IMAGEN
              </button>
            </div>
          )}

          <div className="admin-specs">
            <div className="admin-specs-header">
              <span className="admin-specs-title">Especificaciones</span>
              <button
                type="button"
                className="admin-add-spec"
                onClick={agregarEspecificacion}
                disabled={enviando}
              >
                + AGREGAR
              </button>
            </div>

            {especificaciones.length === 0 && (
              <p className="admin-help">
                Opcional. Agregá filas con una etiqueta y su valor.
              </p>
            )}

            {especificaciones.map((especificacion, index) => (
              <div className="admin-spec-row" key={index}>
                <div>
                  <label htmlFor={`spec-label-${index}`}>Etiqueta</label>
                  <input
                    id={`spec-label-${index}`}
                    type="text"
                    value={especificacion.label}
                    onChange={(event) =>
                      handleEspecificacionChange(index, 'label', event.target.value)
                    }
                    disabled={enviando}
                    aria-invalid={Boolean(erroresEspecificaciones[index]?.label)}
                  />
                  {erroresEspecificaciones[index]?.label && (
                    <p className="field-error">
                      {erroresEspecificaciones[index].label}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor={`spec-value-${index}`}>Valor</label>
                  <input
                    id={`spec-value-${index}`}
                    type="text"
                    value={especificacion.value}
                    onChange={(event) =>
                      handleEspecificacionChange(index, 'value', event.target.value)
                    }
                    disabled={enviando}
                    aria-invalid={Boolean(erroresEspecificaciones[index]?.value)}
                  />
                  {erroresEspecificaciones[index]?.value && (
                    <p className="field-error">
                      {erroresEspecificaciones[index].value}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="admin-remove-spec"
                  onClick={() => quitarEspecificacion(index)}
                  disabled={enviando}
                  aria-label={`Quitar especificación ${index + 1}`}
                >
                  ×
                </button>
              </div>
            ))}

            {errores.especificaciones && (
              <p className="field-error">{errores.especificaciones}</p>
            )}
          </div>

          <label className="form-checkbox" htmlFor="destacado">
            <input
              id="destacado"
              name="destacado"
              type="checkbox"
              checked={formData.destacado}
              onChange={handleChange}
              disabled={enviando}
            />
            <span>Mostrar como producto destacado</span>
          </label>

          <button className="btn" type="submit" disabled={enviando}>
            {enviando ? 'GUARDANDO...' : initialProduct ? 'GUARDAR CAMBIOS' : 'GUARDAR PRODUCTO'}
          </button>
          {onCancelar && <button className="btn-outline" type="button" onClick={onCancelar} disabled={enviando}>CANCELAR</button>}

          {estado && (
            <p
              className={`form-message${estado.tipo === 'error' ? ' form-message-error' : ''}`}
              role={estado.tipo === 'error' ? 'alert' : 'status'}
            >
              {estado.texto}
            </p>
          )}
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
            <li>Las imágenes se guardan en MongoDB y quedan disponibles para el catálogo.</li>
            <li>Las especificaciones mantendrán la estructura <code>{'{ label, value }'}</code>.</li>
          </ul>
          <Link to="/productos" className="text-link">Volver al catálogo →</Link>
        </aside>
      </section>
    </>
  );
}

export default AdminCrearProducto;
