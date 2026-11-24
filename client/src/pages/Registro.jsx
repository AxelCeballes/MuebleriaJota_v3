import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Registro() {
  const { registrarUsuario } = useAuth();
  const navegar = useNavigate();

  const [formulario, setFormulario] = useState({ nombre: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const handleChange = (evento) => {
    const { name, value } = evento.target;
    setFormulario((previo) => ({ ...previo, [name]: value }));
    setError('');
  };

  const handleSubmit = async (evento) => {
    evento.preventDefault();
    if (enviando) return;

    setEnviando(true);
    setError('');

    try {
      await registrarUsuario(formulario);
      navegar('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <section className="page-header">
        <p className="eyebrow">TU CUENTA</p>
        <h1>Registro</h1>
        <p>Creá una cuenta para guardar tus pedidos.</p>
      </section>

      <section className="section auth-section">
        <form className="contact-form auth-form" onSubmit={handleSubmit}>
          <label htmlFor="registro-nombre">Nombre</label>
          <input
            id="registro-nombre"
            name="nombre"
            type="text"
            autoComplete="name"
            value={formulario.nombre}
            onChange={handleChange}
            required
          />

          <label htmlFor="registro-email">Email</label>
          <input
            id="registro-email"
            name="email"
            type="email"
            autoComplete="email"
            value={formulario.email}
            onChange={handleChange}
            required
          />

          <label htmlFor="registro-password">Contraseña</label>
          <input
            id="registro-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={formulario.password}
            onChange={handleChange}
            required
          />

          {error && (
            <p className="form-message form-message-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn" disabled={enviando}>
            {enviando ? 'Creando cuenta...' : 'CREAR CUENTA'}
          </button>

          <p className="auth-help">
            ¿Ya tenés cuenta? <Link to="/login" className="text-link">Ingresá →</Link>
          </p>
        </form>
      </section>
    </>
  );
}

export default Registro;
