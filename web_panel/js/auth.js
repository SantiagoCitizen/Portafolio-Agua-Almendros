// Evitar que entren sin logearse
function verificarAcceso() {
    if (!sessionStorage.getItem('tokenVIP')) {
        // Detecta si vamos a una pantalla dentro de la carpeta "paginas"
        if (window.location.pathname.includes('/paginas/')) {
            window.location.replace('../login.html');
        } else {
            window.location.replace('login.html')
        }
    }
}

// Revisión al cargar la página
verificarAcceso();

// Si el usuario usa los botones de "atrás o adelante" del navegador
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        verificarAcceso();
    }
});

const usuarioLogeado = JSON.parse(sessionStorage.getItem('usuarioLogeado'));