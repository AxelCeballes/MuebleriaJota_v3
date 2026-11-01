import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Cart from './Cart';
import { formatoPrecio } from '../utils/format';

const sillon = {
  _id: 'producto-1',
  nombre: 'Sillón',
  precio: 150000,
  stock: 2,
  categoria: 'Sillones',
  imagenUrl: '/img/sillon.jpg',
};

const mesa = {
  _id: 'producto-2',
  nombre: 'Mesa',
  precio: 90000,
  stock: 3,
  categoria: 'Mesas',
  imagenUrl: '/img/mesa.jpg',
};

const crearProps = (overrides = {}) => ({
  items: [{ producto: sillon, cantidad: 1 }],
  totalUnidades: 1,
  total: sillon.precio,
  onNavigate: vi.fn(),
  onAgregar: vi.fn(() => ({ ok: true, mensaje: 'Agregado.' })),
  onQuitarUnidad: vi.fn(),
  onEliminar: vi.fn(),
  onVaciar: vi.fn(),
  ...overrides,
});

describe('Cart', () => {
  it('muestra los productos agregados y el resumen', () => {
    const props = crearProps({
      items: [
        { producto: sillon, cantidad: 1 },
        { producto: mesa, cantidad: 2 },
      ],
      totalUnidades: 3,
      total: sillon.precio + mesa.precio * 2,
    });

    render(<Cart {...props} />);

    // Productos visibles
    expect(screen.getByText('Sillón')).toBeInTheDocument();
    expect(screen.getByText('Mesa')).toBeInTheDocument();

    // Resumen
    expect(document.getElementById('cart-summary-count')).toHaveTextContent('3');
    expect(document.getElementById('cart-total').textContent.replace(/\u00A0/g, ' ')).toBe(
      formatoPrecio(sillon.precio + mesa.precio * 2).replace(/\u00A0/g, ' '),
    );

    });

  it('incrementa una unidad y delega en onAgregar', async () => {
    const user = userEvent.setup();
    const props = crearProps();

    render(<Cart {...props} />);
    await user.click(screen.getByRole('button', { name: /Agregar una unidad de Sillón/i }));

    expect(props.onAgregar).toHaveBeenCalledWith('producto-1');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('disminuye una unidad y delega en onQuitarUnidad', async () => {
    const user = userEvent.setup();
    const props = crearProps();

    render(<Cart {...props} />);
    await user.click(screen.getByRole('button', { name: /Quitar una unidad de Sillón/i }));

    expect(props.onQuitarUnidad).toHaveBeenCalledWith('producto-1');
  });

  it('no permite superar el stock y muestra el mensaje de onAgregar', async () => {
    const user = userEvent.setup();
    const mensaje = 'Solo hay 2 unidades disponibles de "Sillón".';
    const props = crearProps({
      onAgregar: vi.fn(() => ({ ok: false, mensaje })),
    });

    render(<Cart {...props} />);
    await user.click(screen.getByRole('button', { name: /Agregar una unidad de Sillón/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(mensaje);
  });

  it('deshabilita el incremento cuando se alcanzó el stock máximo', () => {
    const props = crearProps({
      items: [{ producto: sillon, cantidad: 2 }],
      totalUnidades: 2,
      total: sillon.precio * 2,
    });

    render(<Cart {...props} />);

    expect(
      screen.getByRole('button', { name: /Agregar una unidad de Sillón/i }),
    ).toBeDisabled();
    expect(screen.getByText('Máximo disponible: 2.')).toBeInTheDocument();
  });

  it('muestra un mensaje cuando el producto no tiene stock', () => {
    const productoAgotado = { ...sillon, stock: 0 };
    const props = crearProps({
      items: [{ producto: productoAgotado, cantidad: 1 }],
      totalUnidades: 1,
      total: productoAgotado.precio,
    });

    render(<Cart {...props} />);

    expect(
      screen.getByRole('button', { name: /Agregar una unidad de Sillón/i }),
    ).toBeDisabled();
    expect(screen.getByText('Producto sin stock.')).toBeInTheDocument();
  });

  it('elimina un producto del carrito', async () => {
    const user = userEvent.setup();
    const props = crearProps();

    render(<Cart {...props} />);
    await user.click(screen.getByRole('button', { name: /Eliminar Sillón del carrito/i }));

    expect(props.onEliminar).toHaveBeenCalledWith('producto-1');
  });

  it('muestra el carrito vacío y permite ir al catálogo', async () => {
    const user = userEvent.setup();
    const props = crearProps({ items: [], totalUnidades: 0, total: 0 });

    render(<Cart {...props} />);

    expect(screen.getByText('Tu carrito está vacío.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /COMPRAR/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /VACIAR CARRITO/i })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /Ver catálogo →/i }));

    expect(props.onNavigate).toHaveBeenCalledWith('catalogo');
  });

it('muestra el aviso demostrativo al hacer clic en COMPRAR', async () => {
    const user = userEvent.setup();
    const props = crearProps();
    render(<Cart {...props} />);
    await user.click(screen.getByRole('button', { name: /COMPRAR/i }));
    await screen.findByText('Esta demo no procesa pagos ni confirma pedidos.');
});
  it('vacía el carrito y comprueba que el botón COMPRAR sigue activo y no muestra el aviso', async () => {
    const user = userEvent.setup();
    const props = crearProps();

    render(<Cart {...props} />);

    await user.click(screen.getByRole('button', { name: /VACIAR CARRITO/i }));

    expect(props.onVaciar).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole('button', { name: /COMPRAR/i }),
    ).not.toBeDisabled();
    expect(
      screen.queryByText('Esta demo no procesa pagos ni confirma pedidos.'),
    ).not.toBeInTheDocument();
  });
});