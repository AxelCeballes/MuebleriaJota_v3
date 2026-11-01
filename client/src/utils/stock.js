// Reglas de stock compartidas por el catálogo, el detalle y el carrito.
export const obtenerStockDisponible = (producto) => {
  const stock = Number(producto?.stock);
  return Number.isFinite(stock) && stock > 0 ? Math.floor(stock) : 0;
};

export const validarAgregadoAlCarrito = (producto, cantidadEnCarrito = 0) => {
  if (!producto) {
    return {
      ok: false,
      mensaje: 'El producto no está disponible en el catálogo.',
    };
  }

  const nombre = producto.nombre || 'El producto';
  const stock = obtenerStockDisponible(producto);

  if (stock === 0) {
    return {
      ok: false,
      mensaje: `"${nombre}" no tiene stock disponible.`,
    };
  }

  if (cantidadEnCarrito >= stock) {
    return {
      ok: false,
      mensaje:
        stock === 1
          ? `Solo hay 1 unidad disponible de "${nombre}".`
          : `Solo hay ${stock} unidades disponibles de "${nombre}".`,
    };
  }

  return {
    ok: true,
    mensaje: `"${nombre}" se agregó al carrito.`,
  };
};
