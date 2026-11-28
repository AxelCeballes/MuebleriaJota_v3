import { useEffect, useState } from 'react';
import { formatoPrecio, resolverImagenUrl } from '../utils/format';
import { activarFeedbackCarrito } from '../utils/cartFeedback';
import { useAuth } from '../hooks/useAuth';
import { headersConToken, urlDeApi } from '../utils/api';

function Estrellas({ valor = 0 }) {
  return <span className="rating-stars" aria-label={`${Number(valor).toFixed(1)} de 5 estrellas`}>{'★'.repeat(Math.round(valor))}{'☆'.repeat(5 - Math.round(valor))}</span>;
}

function ProductDetail({ producto, onAddToCart, onBack }) {
  const [mensaje, setMensaje] = useState('');
  const [mensajeEsError, setMensajeEsError] = useState(false);
  const [resenas, setResenas] = useState([]);
  const [resumen, setResumen] = useState({ promedio: 0, cantidad: 0 });
  const [puntuacion, setPuntuacion] = useState(5);
  const [comentario, setComentario] = useState('');
  const [enviandoOpinion, setEnviandoOpinion] = useState(false);
  const [errorResenas, setErrorResenas] = useState('');
  const [mensajeOpinion, setMensajeOpinion] = useState('');
  const { token, usuario } = useAuth();

  useEffect(() => {
    if (!producto?._id) return undefined;
    const controller = new AbortController();
    fetch(urlDeApi(`/api/resenas/${producto._id}`), { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'No pudimos cargar las opiniones.');
        setResenas(data.data || []);
        setResumen(data.resumen || { promedio: 0, cantidad: 0 });
      })
      .catch((error) => { if (error.name !== 'AbortError') setErrorResenas(error.message); });
    return () => controller.abort();
  }, [producto?._id]);

  if (!producto) {
    return <div className="product-detail-container"><h1>Producto no encontrado</h1>{onBack && <button type="button" className="text-link" onClick={onBack}>Volver al catálogo →</button>}</div>;
  }

  const { _id, nombre, precio, categoria, ambiente, imagenUrl, descripcion, especificaciones = [], stock } = producto;
  const imageSrc = resolverImagenUrl(imagenUrl);
  const resumenDescripcion = descripcion && descripcion.length > 170 ? `${descripcion.slice(0, 167).trimEnd()}…` : descripcion;
  const handleAdd = (boton) => {
    const resultado = onAddToCart?.(_id);
    if (!resultado || !resultado.ok) { setMensaje(resultado?.mensaje || 'No se pudo agregar el producto.'); setMensajeEsError(true); return; }
    activarFeedbackCarrito(boton); setMensaje(resultado.mensaje); setMensajeEsError(false);
  };

  const enviarOpinion = async (event) => {
    event.preventDefault();
    if (!token) { setErrorResenas('Iniciá sesión para dejar tu opinión.'); return; }
    setEnviandoOpinion(true); setErrorResenas(''); setMensajeOpinion('');
    try {
      const response = await fetch(urlDeApi(`/api/resenas/${_id}`), {
        method: 'POST', headers: headersConToken(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ puntuacion: Number(puntuacion), comentario }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'No pudimos guardar tu opinión.');
      setComentario('');
      const refreshed = await fetch(urlDeApi(`/api/resenas/${_id}`));
      const refreshedData = await refreshed.json();
      setResenas(refreshedData.data || []); setResumen(refreshedData.resumen || { promedio: 0, cantidad: 0 });
      setMensajeOpinion('¡Gracias! Tu opinión quedó publicada.');
    } catch (error) { setErrorResenas(error.message); }
    finally { setEnviandoOpinion(false); }
  };

  return (
    <div className="product-detail-container">
      <button type="button" className="text-link detail-back-link" onClick={onBack}>← Volver al catálogo</button>
      <section id="product-detail" className="product-detail product-detail-compact">
        <div className="detail-image"><img src={imageSrc} alt={nombre} /></div>
        <div className="detail-content">
          <p className="eyebrow">{[ambiente, categoria].filter(Boolean).join(' · ')}</p>
          <h1>{nombre}</h1>
          <div className="detail-rating"><Estrellas valor={resumen.promedio || producto.ratingAverage || 0} /><span>{resumen.cantidad || producto.ratingCount || 0} opiniones</span></div>
          <p className="detail-price">{formatoPrecio(precio)}</p>
          <p className="detail-stock">{Number(stock) > 0 ? 'Disponible para comprar' : 'Sin stock disponible'}</p>
          {resumenDescripcion && <p className="detail-description detail-summary">{resumenDescripcion}</p>}
          <div className="detail-actions"><button id="add-detail" type="button" className="btn" disabled={Number(stock) <= 0} onClick={(event) => handleAdd(event.currentTarget)}>AÑADIR AL CARRITO</button></div>
          {mensaje && <p id="detail-message" className={`form-message${mensajeEsError ? ' form-message-error' : ''}`} role={mensajeEsError ? 'alert' : 'status'}>{mensaje}</p>}
        </div>
      </section>

      <section className="product-information">
        <details open={false}><summary>Sobre el producto</summary><div className="product-information-body"><p>{descripcion || 'No hay una descripción adicional para este producto.'}</p></div></details>
        {especificaciones.length > 0 && <details><summary>Características y especificaciones</summary><dl className="specs-table">{especificaciones.map((spec) => <div key={spec.label} className="specs-row"><dt>{spec.label}</dt><dd>{spec.value}</dd></div>)}</dl></details>}
      </section>

      <section className="customer-reviews" aria-labelledby="reviews-heading">
        <div className="reviews-heading"><div><p className="eyebrow">EXPERIENCIAS REALES</p><h2 id="reviews-heading">Opiniones de los clientes</h2></div><div className="reviews-summary"><strong>{resumen.promedio ? resumen.promedio.toFixed(1) : '—'}</strong><Estrellas valor={resumen.promedio} /><span>{resumen.cantidad} opiniones</span></div></div>
        {errorResenas && <p className="form-message form-message-error" role="alert">{errorResenas}</p>}
        {resenas.length ? <div className="reviews-list">{resenas.map((review) => <article className="review-item" key={review._id}><div className="review-meta"><strong>{review.nombre}</strong><time dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString('es-AR')}</time></div><Estrellas valor={review.puntuacion} /><p>{review.comentario || 'El comprador calificó este producto.'}</p></article>)}</div> : <p className="reviews-empty">Todavía no hay opiniones. Sé el primero en compartir tu experiencia cuando compres este producto.</p>}
        <form className="review-form" onSubmit={enviarOpinion}><h3>Dejá tu opinión</h3><label htmlFor="review-rating">Tu valoración</label><select id="review-rating" value={puntuacion} onChange={(event) => setPuntuacion(event.target.value)}><option value="5">5 estrellas</option><option value="4">4 estrellas</option><option value="3">3 estrellas</option><option value="2">2 estrellas</option><option value="1">1 estrella</option></select><label htmlFor="review-comment">Comentario</label><textarea id="review-comment" rows="4" maxLength="1000" value={comentario} onChange={(event) => setComentario(event.target.value)} placeholder="Contanos qué te pareció el producto..." /><button className="btn" type="submit" disabled={enviandoOpinion}>{enviandoOpinion ? 'ENVIANDO...' : 'PUBLICAR OPINIÓN'}</button>{!usuario && <p className="review-help">Necesitás iniciar sesión y haber comprado este producto para opinar.</p>}{mensajeOpinion && <p className="form-message" role="status">{mensajeOpinion}</p>}</form>
      </section>
    </div>
  );
}

export default ProductDetail;
