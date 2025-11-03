import './login.css';
import axios from 'axios';
import router, { navigateTo } from '../../main.js';
import { login } from "../util/auth.js";

// Helper para mapear roles variados a 'admin' | 'user'
function mapToAppRole(raw) {
  if (!raw) return 'user';
  const r = String(raw).toLowerCase();
  if (r === 'admin' || r === 'administrador' || r === 'administrator') return 'admin';
  return 'user'; // 'usuario', 'user', etc.
}

export function init() {
  const form = document.getElementById("form-login");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const correo = document.getElementById("correo").value.trim();
    const roleRaw = document.getElementById("role")?.value;
    const role = mapToAppRole(roleRaw);

    // auth.js espera { username, role }
    login({ username: correo, role });

    // Redirección por rol (History API)
    navigateTo(role === "admin" ? "/admin" : "/user");
    return false;
  });
}

export default async function Login() {
  // Estado local con inmutabilidad
  let state = {
    loading: false,
    error: null,
    success: null
  };

  const setState = (next) => {
    state = { ...state, ...next };
  };

  // Helpers de storage con copias inmutables
  const readUserFromStorage = () => {
    try {
      const src = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (!src) return null;
      const obj = JSON.parse(src);
      // devolver copia defensiva
      return obj ? JSON.parse(JSON.stringify(obj)) : null;
    } catch {
      return null;
    }
  };

  const writeUserToStorage = (user) => {
    const normalized = user ? {
      id: Number(user.id),
      email: user.email,
      nombre: user.nombre,
      token: user.token
    } : null;
    const payload = normalized ? JSON.stringify(normalized) : null;
    if (payload) {
      sessionStorage.setItem('user', payload);
      localStorage.setItem('user', payload);
      console.log('🗄️ Usuario guardado en storage:', normalized);
    }
  };

  // Verificar si hay datos de usuario en el almacenamiento
  const userInStorage = readUserFromStorage();
  if (userInStorage) {
    console.log("👉 Usuario encontrado en almacenamiento, redirigiendo a /chatbot");
    navigateTo('/chatbot');
    router();
    return;
  }

  // Si ya existe 'user' del backend en storage, usa su rol y redirige a la vista correcta
  const userInStorageBackend = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (userInStorageBackend) {
    try {
      const parsed = JSON.parse(userInStorageBackend);
      const role = mapToAppRole(parsed?.role || parsed?.rol);
      const username = parsed?.email || parsed?.nombre || 'usuario';

      // Guarda también en hc_user para que main.js pueda rutear por rol
      login({ username, role });

      navigateTo(role === 'admin' ? '/admin' : '/user');
      return;
    } catch {
      // Si falla el parse, continúa con el flujo normal de login
    }
  }

  const contraseñaInput = document.getElementById('contraseña');
  const barra = document.getElementById('fuerza-contraseña');
  const mensaje = document.getElementById('mensaje-contraseña');
  const form = document.getElementById('form-login');
  const mensajeExito = document.getElementById('mensaje-exito');
  const btnRegistrarse = document.getElementById('btn-registrarse');
  const btnVolverLogin = document.getElementById('btn-volver-login');
  const formRegistro = document.getElementById('form-registro');
  const formUsuario = document.getElementById('form-login');
  const mensajeExitoRegistro = document.getElementById('mensaje-exito-registro');

  // 🔹 Validación de contraseña
  if (contraseñaInput) {
    contraseñaInput.addEventListener('input', function () {
      const valor = this.value;
      let fuerza = 0;
      if (valor.length >= 8) fuerza++;
      if (/[A-Z]/.test(valor)) fuerza++;
      if (/[0-9]/.test(valor)) fuerza++;
      if (/[^A-Za-z0-9]/.test(valor)) fuerza++;

      if (valor.length === 0) {
        barra.style.background = '';
        mensaje.textContent = '';
      } else if (fuerza <= 1) {
        barra.style.background = 'red';
        mensaje.textContent = 'Contraseña no segura';
        mensaje.style.color = 'red';
      } else if (fuerza === 2) {
        barra.style.background = 'orange';
        mensaje.textContent = 'La contraseña puede mejorar';
        mensaje.style.color = 'orange';
      } else if (fuerza >= 3) {
        barra.style.background = 'green';
        mensaje.textContent = 'Contraseña segura';
        mensaje.style.color = 'green';
      }
    });
  }

  // 🔹 Cambiar entre login y registro
  if (btnRegistrarse) btnRegistrarse.addEventListener('click', () => mostrarRegistro());
  if (btnVolverLogin) btnVolverLogin.addEventListener('click', () => mostrarLogin());

  // 🔹 Registro
  if (formRegistro) {
    formRegistro.addEventListener('submit', async function (e) {
      e.preventDefault();
      const datosUsuario = {
        first_name: document.getElementById('nombre').value,
        last_name: document.getElementById('apellido').value,
        email: document.getElementById('correo-reg').value,
        password: document.getElementById('contraseña-reg').value,
        address: document.getElementById('direccion').value,
        phone: document.getElementById('telefono').value,
        // Nuevo: enviar rol por defecto 'empleado'
        role: (document.getElementById('rol')?.value || 'empleado')
      };

      try {
        const resultado = await registrarUsuario(datosUsuario);
        console.log('Resultado del registro:', resultado?.id);

        if (resultado && resultado.id) {
          // Auto-login con las credenciales recién registradas
          const loginResult = await loginUsuario({
            email: datosUsuario.email,
            password: datosUsuario.password
          });

          if (loginResult && loginResult.id) {
            writeUserToStorage(loginResult);
            mensajeExitoRegistro.style.color = 'green';
            mensajeExitoRegistro.textContent = 'Usuario registrado y logueado con éxito ✅';

            const role = mapToAppRole(loginResult.role);
            const username = loginResult.email || loginResult.nombre || 'usuario';
            login({ username, role });

            navigateTo(role === 'admin' ? '/admin' : '/user');
            window.location.reload();
            return;
          } else {
            mensajeExitoRegistro.style.color = 'red';
            mensajeExitoRegistro.textContent = loginResult?.message || 'Error al iniciar sesión tras el registro ❌';
          }
        } else {
          mensajeExitoRegistro.style.color = 'red';
          mensajeExitoRegistro.textContent = resultado?.message || 'Error al registrar usuario ❌';
        }
      } catch (error) {
        console.error('Error al registrar usuario:', error);
        mensajeExitoRegistro.style.color = 'red';
        mensajeExitoRegistro.textContent = 'Error al registrar usuario ❌';
      } finally {
        formRegistro.reset();
        // Si no se logra auto-login, volver al login visualmente
        setTimeout(() => mostrarLogin(), 1500);
      }
    });
  }



  if (formUsuario) {
    console.log(formUsuario, 'formUsuario'); // Para verificar que encontró el form

    formUsuario.addEventListener('submit', async function(e) {
      e.preventDefault();

      setState({ loading: true, error: null, success: null });

      const datosLogin = {
        email: document.getElementById('correo').value,
        password: document.getElementById('contraseña').value
      };

      console.log('Datos de login:', datosLogin);

      try {
        const resultado = await loginUsuario(datosLogin);
        console.log('Resultado del login:', resultado);

        if (resultado && resultado.id) {
          mensajeExito.style.color = 'green';
          mensajeExito.textContent = 'Usuario logueado con éxito ✅';
          writeUserToStorage(resultado);
          setState({ success: 'ok', loading: false });

          // Mantén compat con tu storage previo:
          sessionStorage.setItem('user', JSON.stringify(resultado));
          localStorage.setItem('user', JSON.stringify(resultado));

          // Guarda también en hc_user y redirige por rol
          const role = mapToAppRole(resultado.role);
          const username = resultado.email || resultado.nombre || 'usuario';
          login({ username, role });

          console.log("👉 Navegando a /chatbot");
          navigateTo('/chatbot');
          router();
          window.location.reload();
        } else {
          mensajeExito.style.color = 'red';
          mensajeExito.textContent = resultado?.message || 'Error al iniciar sesión ❌';
          setState({ error: 'login_failed', loading: false });
        }
      } catch (error) {
        console.error('Error al iniciar sesión:', error);
        mensajeExito.style.color = 'red';
        mensajeExito.textContent = 'Error al iniciar sesión ❌';
        setState({ error: 'login_exception', loading: false });
      }
    });
  }



  // Reemplazo la antigua activarLoginForm por dos funciones claras
  function mostrarRegistro() {
    const loginCard = document.getElementById('card-login');
    const registerCard = document.getElementById('card-registro');
    if (!loginCard || !registerCard) return;

    // Animación: desvanecer login
    loginCard.classList.remove('fade-in');
    loginCard.classList.add('fade-out');

    setTimeout(() => {
      // Ocultar login y mostrar registro
      loginCard.style.display = 'none';
      registerCard.style.display = 'flex';
      registerCard.classList.remove('fade-out');
      registerCard.classList.add('fade-in');

      // Asegurar visibilidad del formulario de registro
      const registerForm = registerCard.querySelector('.register-form');
      if (registerForm) {
        registerForm.style.opacity = '1';
        registerForm.style.transform = 'translateX(0) scale(1)';
        registerForm.classList.add('registerActive');
        registerForm.classList.remove('registerDesactive');
      }
    }, 200);
  }

  function mostrarLogin() {
    const loginCard = document.getElementById('card-login');
    const registerCard = document.getElementById('card-registro');
    if (!loginCard || !registerCard) return;

    // Animación: desvanecer registro
    registerCard.classList.remove('fade-in');
    registerCard.classList.add('fade-out');

    setTimeout(() => {
      // Ocultar registro y mostrar login
      registerCard.style.display = 'none';
      loginCard.style.display = 'flex';
      loginCard.classList.remove('fade-out');
      loginCard.classList.add('fade-in');

      // Asegurar visibilidad del formulario de login
      const loginForm = loginCard.querySelector('.login-form');
      if (loginForm) {
        loginForm.style.opacity = '1';
        loginForm.style.transform = 'translateX(0) scale(1)';
        loginForm.classList.add('loginActive');
        loginForm.classList.remove('loginDesactive');
      }
    }, 200);
  }

  async function registrarUsuario(datosUsuario) {
    try {
      const response = await axios.post('http://localhost:8080/api/usuarios/registro', datosUsuario, {
        headers: { 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      throw error;
    }
  }

  // Dejo UNA sola función de loginUsuario (completa con role)
  async function loginUsuario(datosLogin) {
      try {
          const response = await axios.post(
              'http://localhost:8080/api/usuarios/login',
              datosLogin,
              { headers: { 'Content-Type': 'application/json' } }
          );
          const data = response.data;
          return {
              id: data.usuario.id,
              email: data.usuario.email,
              nombre: data.usuario.first_name + " " + data.usuario.last_name,
              role: data.usuario.role || data.usuario.rol || 'usuario',
              token: data.token
          };
      } catch (error) {
          console.error('Error al iniciar sesión:', error);
          throw error;
      }
  }
}
