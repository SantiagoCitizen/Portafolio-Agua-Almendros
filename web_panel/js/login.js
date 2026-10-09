import { environment } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const inputTelefono = document.getElementById('inputTelefono');
    const inputPassword = document.getElementById('inputPassword');
    const btnSubmit = document.getElementById('btnSubmit');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');
    const alertaError = document.getElementById('alertaError');
    const mensajeError = document.getElementById('mensajeError');

    //Envio de formulario
    loginForm.addEventListener('submit', async (evento) => {
        //Prevenir que la pagina se recargue por defecto
        evento.preventDefault();

        //Limpiar alertas previas y quitar validaciones visuales
        ocultarError();
        loginForm.classList.remove('was-validated');

        //Validaciones del lado del cliente
        //1. Verificar que el telefono sea de 10 digitos
        const regexTelefono = /^[0-9]{10}$/;
        const telefonoValido = regexTelefono.test(inputTelefono.value.trim());

        //Verificar que la constraseña no quede vacia
        const passwordValido = inputPassword.value.trim().length > 0;

        //Errores por si no cumple las validaciones
        if(!telefonoValido || !passwordValido) {
            loginForm.classList.add('was-validated');
            //Si el telefono no es valido
            if (!telefonoValido) inputTelefono.setCustomValidity("Invalido");
            else inputTelefono.setCustomValidity("");
            return;
        }
        //Si todo ta bien, preparemos la peticiones al servidor
        cambiarEstadoBoton(true);

        try {
            //Se hace la peticion a fastapi usando la variable de entorno
            const respuesta = await fetch(`${environment.apiUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    telefono: inputTelefono.value.trim(),
                    password: inputPassword.value.trim()
                })
            });

            const datos = await respuesta.json();

            //Si el servidor responde con un codigo distinto a 200, ejemplo: 401
            if (!respuesta.ok) {
                throw new Error(datos.detail || datos.error || "Telefono o contraseña incorrectos")
            }
            //Se valida que el usuario tenga el rol de administrador
            if (datos.usuario.id_rol !== 1){
                throw new Error("Acceso denegado: No tienes permisos de administrador")
            }

            //Guardar los datos en el navegador
            sessionStorage.setItem('usuarioLogueado', JSON.stringify(datos.usuario));
            sessionStorage.setItem('tokenVIP', datos.token);
            //redirigir al panel principal
            window.location.href="index.html"
        } catch (error) {
            //Mostrar el error si el backend falla o la red esta caida
            mostrarError(error.message === "Failed to fetch"
                ? "No se pudo conectar con el servidor. Verifica que la API este corriendo"
                : error.message);
            cambiarEstadoBoton(false);
        }
    });
    //Validar en tiempo real mientras el usuario escribe para limpiar errores
    inputTelefono.addEventListener('input', () => inputTelefono.setCustomValidity(""));
    inputPassword.addEventListener('input', () => inputPassword.setCustomValidity(""));

    //Funciones auxiliares

    //Deshabilitar el boton y mostrar el loader
    function cambiarEstadoBoton(cargando) {
        if (cargando) {
            btnSubmit.disabled = true;
            btnText.innerText = "Verificando...";
            btnSpinner.classList.remove('d-none');
        } else {
            btnSubmit.disabled = false;
            btnText.innerText= "Ingresar al Sistema";
            btnSpinner.classList.add('d-none');
        }
    }
    //Manejar la alerta visual de error+
    function mostrarError(mensaje) {
        mensajeError.innerText = mensaje;
        alertaError.classList.remove('d-none');
        inputPassword.value = '' //Limpiar la contraseña por seguridad
        inputPassword.focus();
    }
    function ocultarError() {
        alertaError.classList.add('d-none');
    }
});