import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Login() {
  const { iniciarSesion } = useAuth();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const destino = ubicacion.state?.desde || '/';

  const [formulario, setFormulario] = useState({ email: '', password: '' });
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
      await iniciarSesion(formulario);
      navegar(destino, { replace: true });
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
        <h1>Ingresar</h1>
        <p>Ingresá para ver tus pedidos y continuar con tu compra.</p>
      </section>

      <section className="section auth-section">
        <form className="contact-form auth-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            value={formulario.email}
            onChange={handleChange}
            required
          />

          <label htmlFor="login-password">Contraseña</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
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
            {enviando ? 'Ingresando...' : 'INGRESAR'}
          </button>

          <p className="auth-help">
            ¿Todavía no tenés cuenta? <Link to="/registro" className="text-link">Registrate →</Link>
          </p>
        </form>
      </section>
    </>
  );
}

export default Login;
