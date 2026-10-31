import { formatoPrecio } from '../utils/format';
import { activarFeedbackCarrito } from '../utils/cartFeedback';
import { resolverImagenUrl } from '../utils/format';

function ProductCard({ producto, onSelect, onAddToCart }) {
  if (!producto) return null;

  const { _id, nombre, precio, categoria, imagenUrl } = producto;
  const imageSrc = resolverImagenUrl(imagenUrl);

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(producto);
    }
  };

  const handleAddClick = (e) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(_id);
    }
    activarFeedbackCarrito(e.currentTarget);
  };

  return (
    <article className="product-card">
      <div
        className="product-card-link"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleCardClick();
          }
        }}
        aria-label={`Ver detalle de ${nombre}`}
      >
        <div className="product-image">
          <span className="product-badge">{categoria}</span>
          <img src={imageSrc} alt={nombre} />
        </div>
        <div className="product-info">
          <p className="category">{categoria}</p>
          <h3>{nombre}</h3>
          <p className="price">{formatoPrecio(precio)}</p>
        </div>
      </div>
      <div className="product-card-actions">
        <button
          type="button"
          className="btn btn-small"
          data-id={_id}
          onClick={handleAddClick}
        >
          AÑADIR
        </button>
      </div>
    </article>
  );
}

export default ProductCard;
