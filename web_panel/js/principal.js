import { environment } from './config.js';

//MODULO PRINCIPAL (VENTANA PRINCIPAL)

// Función: Cargar Repartidores
async function cargarRepartidores() {
    const select = document.getElementById('tablaRepartidores');
    if (!select) return;
    try {
        const respuesta = await fetch(`${environment.apiUrl}/repartidores`);
        const repartidores = await respuesta.json();

        //buscar la tabla en el html por su id
        const tabla = document.getElementById('tablaRepartidores');
        tabla.innerHTML = ''; //Limpiar el mensaje de cargando repartidores

        //Contar cuantos repartidores hjay en total para actualizar el estado
        const total = repartidores.length;
        document.getElementById('estadoServidor').innerText = "En línea";
        document.getElementById('estadoServidor').className = "display-6 fw-bold text-success mb-0";

        //recorrer la lista de repartidores
        repartidores.forEach(repartidor => {
            //cambiar el color de etiqueta dependiendo del estado
            let colorBadge = repartidor.estado === 'Libre' ? 'bg-secondary' : 'bg-success';

            //fila con los datos
            const fila = `
                <tr>
                    <td class="fw-semibold">${repartidor.nombre}</td>
                    <td><span class="badge ${colorBadge}">${repartidor.estado}</span></td>
                    <td>${repartidor.ruta}</td>
                    <td class="text-muted"><i class="bi bi-telephone"></i> ${repartidor.telefono}</td>
                </tr>
            `;
            tabla.innerHTML += fila; //Se añade la fila a la tabla
        });
    } catch (error) {
        console.error("Error al cargar los repartidores:", error);
        document.getElementById('estadoServidor').innerText = "Desconectado";
        document.getElementById('estadoServidor').className = "display-6 fw-bold text-danger mb-0";
    }
}

// Función: Cargar Clientes
async function cargarClientes() {
    const tablita = document.getElementById('tablaClientes');
    if (!tablita) return;

    try {
        //Se piden los clientes
        const respuesta = await fetch(`${environment.apiUrl}/clientes`);
        const clientes = await respuesta.json();

        const tabla = document.getElementById('tablaClientes');
        tabla.innerHTML = ''; //Se limpia el texto

        //Se recorre la lista de clientes
        clientes.forEach(cliente => {
            //Se quita la palabra Cliente para verse mas limpio
            let categoriaLimpia = cliente.categoria.replace('Cliente ', '');
            //La tarifa se muestra en dos decimales
            let tarifaFormateada = parseFloat(cliente.tarifa).toFixed(2);

            //fila
            const fila = `
                <tr>
                    <td class="fw-semibold">${cliente.cliente}</td>
                    <td>${categoriaLimpia}</td>
                    <td>$${tarifaFormateada}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="abrirBtnVerCliente(${cliente.id_usuario})"><i class="bi bi-eye"></i> Ver</button>
                    </td>
                </tr>
            `;
            tabla.innerHTML += fila;
        });
    } catch (error) {
        console.error("Error al cargar los clientes:", error);
    }
}

//Funcion para abrir el boton "Ver" en dashboard principal de cliente
//Se expone a window para que funcione con el onclick del HTML al usar type="module"
window.abrirBtnVerCliente = async function(idUsuario) {
    try{
        //Instanciar el modal de bootstrap para controlarlo
        const modal = new bootstrap.Modal(document.getElementById('btnVerCliente'));
        //mostrar en pantalla
        modal.show();
        //Texto de "cargando" por si el internet esta lento
        document.getElementById('nombreCliente').innerText = 'Cargando...';
        document.getElementById('telefonoCliente').innerText = '...';
        document.getElementById('direccionCliente').innerText = '...';
        document.getElementById('inputTarifa').value = "";
        //Pedir a FastAPI el JSON del cliente
        const respuesta = await fetch(`${environment.apiUrl}/clientes/${idUsuario}`);
        const datosCliente = await respuesta.json();

        //armar el nombre (si es empresa, se agrega la razon social)
        let nombreCompleto = `${datosCliente.nombre} ${datosCliente.apellido_paterno}`;
        if (datosCliente.id_rol === 4){
            nombreCompleto += ` - ${datosCliente.razon_social}`;
        }
        document.getElementById('nombreCliente').innerText = nombreCompleto;
        //poner telefono
        document.getElementById('telefonoCliente').innerText = datosCliente.telefono;
        //armar la direccion
        let direccionFisica = `${datosCliente.calle} #${datosCliente.numero}, Col. ${datosCliente.nombre_colonia}`;
        //si el cliente puso referencias, se concatenan
        if (datosCliente.referencias_domicilio) {
            direccionFisica += ` (Ref: ${datosCliente.referencias_domicilio})`;
        }
        document.getElementById('direccionCliente').innerText = direccionFisica;
        //poner la tarifa especial en el input
        document.getElementById('inputTarifa').value = datosCliente.tarifa_especial;
        document.getElementById('btnGuardarTarifa').setAttribute(`onclick`, `guardarNuevaTarifa(${idUsuario})`);
    } catch (error) {
        console.error("Error al cargar los detalles del cliente", error);
        document.getElementById('nombreCliente').innerText = "Error al cargar datos";
    }
}

//Funcion para guardar la nueva tarifa
//Se expone a window para que funcione con el onclick del HTML al usar type="module"
window.guardarNuevaTarifa = async function(idUsuario) {
    //Obtener el valor de la nueva tarifa
    const nuevaTarifa = document.getElementById('inputTarifa').value;
    //Cambiar el texto del boton para que parezca que esta pensando o procesando
    const btnGuardar = document.getElementById('btnGuardarTarifa');
    btnGuardar.innerText = 'Guardando...';
    btnGuardar.disabled = true; // Corregido el typo "disable" a "disabled"

    try {
        //Enviar el valor al backend
        const respuesta = await fetch(`${environment.apiUrl}/clientes/${idUsuario}/tarifa`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tarifa_especial: parseFloat(nuevaTarifa) })
        });

        if (respuesta.ok){
            //Si todo sale bien, recarga la tabla principal para mostrar el nuevo precio
            cargarClientes();
            //Aviso al usuario y se regresa el boton a la normalidad
            alert("Tarifa actualizada con éxito.");
            btnGuardar.innerText = "Guardar";
            btnGuardar.disabled = false;
        } else {
            alert("Error al guardar la tarifa.");
            btnGuardar.innerText = "Guardar";
            btnGuardar.disabled = false;
        }
    } catch (error) {
        console.error("Error en la petición PUT:", error);
        alert("Fallo en la conexion con el servidor");
        btnGuardar.innerText = "Guardar";
        btnGuardar.disabled = false;
    }
    
}

// Función: Cargar el precio base desde Ajustes
async function cargarPrecioBase() {
    try {
        const respuesta = await fetch(`${environment.apiUrl}/ajustes/`);
        if (respuesta.ok) {
            const datos = await respuesta.json();
            const precio = datos.precio_garrafon !== undefined ? datos.precio_garrafon : datos[0];
            
            document.getElementById('precioBaseDashboard').innerText = `$${parseFloat(precio).toFixed(2)} MXN`;
        }
    } catch (error) {
        console.error("Error al cargar el precio base:", error);
        document.getElementById('precioBaseDashboard').innerText = "Error";
    }
}

// Ejecutar las funciones al mismo tiempo
cargarRepartidores();
cargarClientes();
cargarPrecioBase();