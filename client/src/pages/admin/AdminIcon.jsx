const trazos = {
  inicio: 'M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5',
  pedidos: 'M7 3h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-3-2V5a2 2 0 0 1 2-2ZM9 8h6M9 12h6',
  productos: 'M21 8 12 3 3 8v8l9 5 9-5V8ZM3 8l9 5 9-5M12 13v8',
  clientes:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  perfil: 'M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  menu: 'M4 7h16M4 12h16M4 17h16',
  cerrar: 'M6 6l12 12M18 6 6 18',
  flecha: 'M9 6l6 6-6 6',
  tienda: 'M3 9l1-5h16l1 5M4 9v11h16V9M9 20v-6h6v6',
  pendiente: 'M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  dinero: 'M12 6v12M15.5 9.5a3 3 0 0 0-3-2h-1a3 3 0 0 0 0 6h1a3 3 0 0 1 0 6h-1a3 3 0 0 1-3-2',
};

function AdminIcon({ nombre, className = '' }) {
  return (
    <svg
      className={`admin-icon${className ? ` ${className}` : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={trazos[nombre] || trazos.inicio} />
    </svg>
  );
}

export default AdminIcon;
