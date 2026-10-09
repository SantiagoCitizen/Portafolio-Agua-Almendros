document.addEventListener("DOMContentLoaded", () => {
  // Detectar si estamos en la raíz (index.html) o dentro de la carpeta "paginas"
  const enCarpetaPaginas = window.location.pathname.includes("/paginas/");

  // Asignar la ruta correcta para encontrar el HTML de la barra
  const rutaSidebar = enCarpetaPaginas ? "../components/sidebar.html" : "./components/sidebar.html";

  fetch(rutaSidebar)
    .then((response) => response.text())
    .then((html) => {
      // Inyectar la barra en el HTML
      document.getElementById("contenedor-sidebar").innerHTML = html;

      const links = document.querySelectorAll("#contenedor-sidebar .nav-link");
      const paginaActual = window.location.pathname.split("/").pop() || "index.html";

      links.forEach((link) => {
        let href = link.getAttribute("href");

        //  Corregir los enlaces dinámicamente si estamos en el index.html
        if (!enCarpetaPaginas && href !== "#") {
          if (href === "../index.html") {
            link.setAttribute("href", "index.html"); // Quitar el retroceso
          } else {
            link.setAttribute("href", "paginas/" + href); // Agregar la carpeta a los demás
          }
        }

        // Pintar de azul la pestaña activa
        const hrefActualizado = link.getAttribute("href");
        if (hrefActualizado.includes(paginaActual) && paginaActual !== "") {
          link.classList.remove("text-muted");
          link.classList.add("active", "bg-light", "text-primary", "fw-bold");

          const icono = link.querySelector("i");
          if (icono) {
            icono.classList.remove("text-muted");
            icono.classList.add("text-dark");
          }
        }
      });

      // "Cerrar sesión"
      const botonSalir = document.getElementById("btnSalir");
      if (botonSalir) {
        botonSalir.addEventListener("click", (evento) => {
          evento.preventDefault();
          sessionStorage.removeItem("tokenVIP");
          sessionStorage.removeItem("usuarioLogeado");

          if (window.location.pathname.includes("/paginas/")) {
            window.location.replace("../login.html");
          } else {
            window.location.replace("login.html");
          }
        });
      }
    })
    .catch((error) => console.error("Error cargando el sidebar:", error));
});
