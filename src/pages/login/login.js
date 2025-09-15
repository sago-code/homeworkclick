import './login.css';
import axios from 'axios';
import router, { navigateTo } from '../../main.js';

export default async function Login() {
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
    if (btnRegistrarse) btnRegistrarse.addEventListener('click', activarLoginForm);
    if (btnVolverLogin) btnVolverLogin.addEventListener('click', activarLoginForm);

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
                phone: document.getElementById('telefono').value
            };

            try {
                const resultado = await registrarUsuario(datosUsuario);
                console.log('Resultado del registro:', resultado.id);
                if (resultado && resultado.id) {
                    mensajeExitoRegistro.style.color = 'green';
                    mensajeExitoRegistro.textContent = 'Usuario registrado con éxito ✅';
                } else {
                    mensajeExitoRegistro.style.color = 'red';
                    mensajeExitoRegistro.textContent = resultado?.message || 'Error al registrar usuario ❌';
                }
            } catch (error) {
                mensajeExitoRegistro.style.color = 'red';
                mensajeExitoRegistro.textContent = 'Error al registrar usuario ❌';
            } finally {
                formRegistro.reset();
                setTimeout(() => activarLoginForm(), 1500);
            }
        });
    }

    if (formUsuario) {
        console.log(formUsuario, 'formUsuario'); // Para verificar que encontró el form

        formUsuario.addEventListener('submit', async function(e) {
            e.preventDefault();

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
                    sessionStorage.setItem('user', JSON.stringify(resultado));
                    localStorage.setItem('user', JSON.stringify(resultado));

                    console.log("👉 Navegando a /chatbot");
                    navigateTo('/chatbot');
                    router();
                    window.location.reload();
                } else {
                    mensajeExito.style.color = 'red';
                    mensajeExito.textContent = resultado?.message || 'Error al iniciar sesión ❌';
                }
            } catch (error) {
                console.error('Error al iniciar sesión:', error);
                mensajeExito.style.color = 'red';
                mensajeExito.textContent = 'Error al iniciar sesión ❌';
            }
        });
    }


    function activarLoginForm() {
        const loginCard = document.getElementById('card-login');
        const registerCard = document.getElementById('card-registro');
        const loginForm = loginCard ? loginCard.querySelector('.login-form') : null;
        const registerForm = registerCard ? registerCard.querySelector('.register-form') : null;

        if (!loginCard || !registerCard || !loginForm || !registerForm) return;

        if (loginCard.style.display !== 'none') {
            loginForm.style.opacity = '0';
            setTimeout(() => {
                loginCard.style.display = 'none';
                registerCard.style.display = 'flex';
                setTimeout(() => registerForm.style.opacity = '1', 50);
            }, 500);
        } else {
            registerForm.style.opacity = '0';
            setTimeout(() => {
                registerCard.style.display = 'none';
                loginCard.style.display = 'flex';
                setTimeout(() => loginForm.style.opacity = '1', 50);
            }, 500);
        }
        registerCard.style.backgroundColor = '#B2C8DF';
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

    async function loginUsuario(datosLogin) {
        try {
            const response = await axios.post(
                'http://localhost:8080/api/usuarios/login',
                datosLogin,
                { headers: { 'Content-Type': 'application/json' } }
            );

            const data = response.data;

            // Normalizamos lo que nos interesa
            return {
                id: data.usuario.id,
                email: data.usuario.email,
                nombre: data.usuario.first_name + " " + data.usuario.last_name,
                token: data.token
            };
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            throw error;
        }
    }

}
