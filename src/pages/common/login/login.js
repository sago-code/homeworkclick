document.addEventListener('DOMContentLoaded', function () {
    const contraseñaInput = document.getElementById('contraseña');
    const barra = document.getElementById('fuerza-contraseña');
    const mensaje = document.getElementById('mensaje-contraseña');
    const form = document.getElementById('form-login');
    const mensajeExito = document.getElementById('mensaje-exito');

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

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            mensajeExito.textContent = 'El ingreso se generó de manera exitosa';
        });
    }
     btnEntrar.addEventListener('click', function() {
        // Redireccionar a chatbot.html
        window.location.href = 'src/pages/common/login/chatbot.html';
    });
});