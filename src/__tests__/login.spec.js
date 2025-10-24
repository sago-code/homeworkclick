import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock del router/navegación del main.js
vi.mock('../main.js', () => {
  return {
    default: vi.fn(() => {}),
    navigateTo: vi.fn(() => {})
  };
});

import Login from '../pages/login/login.js';

describe('Login Page', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="card-login">
        <div class="caja login-form">
          <form id="form-login">
            <div class="imput">
              <input type="email" id="correo" />
              <input type="password" id="contraseña" />
              <div id="mensaje-exito"></div>
              <button type="submit">Iniciar Sesión</button>
              <button type="button" id="btn-registrarse">Registrarse</button>
            </div>
          </form>
        </div>
      </div>
      <div id="card-registro" style="display:none;">
        <div class="register-form">
          <form id="form-registro">
            <input id="nombre" />
            <input id="apellido" />
            <input id="correo-reg" />
            <input id="contraseña-reg" />
            <input id="direccion" />
            <input id="telefono" />
            <input id="rol" />
            <div id="mensaje-exito-registro"></div>
          </form>
        </div>
      </div>
    `;
    // Garantiza axios limpio
    axios.post.mockReset();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('login exitoso guarda en storage y muestra mensaje', async () => {
    const payloadResp = {
      token: 'TOK',
      usuario: { id: 1, email: 'yttye@gmail.com', first_name: 'User', last_name: 'Test' },
      message: 'Login exitoso'
    };
    axios.post.mockResolvedValueOnce({ data: payloadResp });

    await Login();
    document.getElementById('correo').value = 'yttye@gmail.com';
    document.getElementById('contraseña').value = '12345678';

    const form = document.getElementById('form-login');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await new Promise(r => setTimeout(r, 0));

    expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:8080/api/usuarios/login',
        { email: 'yttye@gmail.com', password: '12345678' },
        { headers: { 'Content-Type': 'application/json' } }
    );

    const stored = JSON.parse(localStorage.getItem('user'));
    expect(stored).toEqual({ id: 1, email: 'yttye@gmail.com', nombre: 'User Test', token: 'TOK' });

    const msg = document.getElementById('mensaje-exito').textContent;
    expect(msg).toContain('Usuario logueado con éxito');
  });

  it('login falla muestra mensaje de error', async () => {
    axios.post.mockRejectedValueOnce(new Error('Invalid'));
    await Login();

    document.getElementById('correo').value = 'bad@b.com';
    document.getElementById('contraseña').value = 'wrong';

    const form = document.getElementById('form-login');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await new Promise(r => setTimeout(r, 0));

    const msg = document.getElementById('mensaje-exito').textContent;
    expect(msg).toContain('Error al iniciar sesión');
  });
});