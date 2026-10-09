import { environment } from './config.js';

// VER COLONIAS REGISTRADAS
async function cargarColonias() {
    const tabla = document.getElementById('tablaColonias');
    //Si no encuentra la tabla, detenemos la funcion
    if (!tabla) return;

    try {
        const respuesta = await fetch(`${environment.apiUrl}/colonias`);
        if (!respuesta) {
            throw new Error('Error en la respuesta del servidor');
        }
        const colonias = await respuesta.json();
        //Quitar el spinner
        tabla.innerHTML = '';
        //Si la bd esta vacia
        if (colonias.length === 0) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="2" class="text-center py-4 text-muted">
                        No hay colonias registradas aún.
                    </td>
                </tr>`;
            return;
        }
        //Recorrer el arreglo de colonias y poner una fila por cada una
        colonias.forEach(colonia => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td class="px-4 py-3 fw-medium text-dark">${colonia.nombre_colonia}</td>
                <td class="px-4 py-3">
                    <button class="btn btn-sm btn-outline-primary me-1 btn-editar" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-eliminar" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            //Boton eliminar
            const btnEliminar = fila.querySelector('.btn-eliminar');
            btnEliminar.addEventListener('click', async () => {
                //Confirmacion del usuario
                const confirmacion = confirm(`¿Estás seguro de eliminar la colonia "${colonia.nombre_colonia}"?`);
                if (confirmacion) {
                    try {
                        //Peticion a FastAPI que borre
                        const respuestaDelete = await fetch(`${environment.apiUrl}/colonias/${colonia.id_colonia}`, {
                            method: 'DELETE'
                        });
                        if (respuestaDelete.ok) {
                            alert('Colonia eliminada');
                            cargarColonias();
                        } else {
                            const errorData = await respuestaDelete.json();
                            alert(`Alerta_ ${errorData.detail}`);
                        }
                    } catch (error) {
                        console.error('Error al eliminar', error);
                        alert('No se pudo conectar con el servidor');
                    }
                }
            });
            //Boton editar
            const btnEditar = fila.querySelector('.btn-editar');
            btnEditar.addEventListener('click', async () => {
                //Pedir el nuevo nombre
                const nuevoNombre = prompt(`Editar el nombre de la colonia:`, colonia.nombre_colonia);
                //cancelar
                if (nuevoNombre === null) {
                    return;
                }
                //limpiar espacios en blanco al inicio y final
                const nombreLimpio = nuevoNombre.trim();
                //validar que no este vacio
                if (nombreLimpio === '') {
                    alert('El nombre de la colonia no puede estar vacio');
                    return;
                }
                //validar que si sea un nombre nuevo
                if (nombreLimpio === colonia.nombre_colonia) {
                    return;
                }
                try {
                    //peticion put a fastapi
                    const respuestaPUT = await fetch(`${environment.apiUrl}/colonias/${colonia.id_colonia}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ nombre_colonia: nombreLimpio })
                    });
                    if (respuestaPUT.ok) {
                        alert('Colonia actualizada con exito');
                        //Volver a cargar la tabla
                        cargarColonias();
                    } else {
                        const errorData = await respuestaPUT.json();
                        alert(`Error al actualizar: ${errorData.detail}`);
                    }
                } catch (error) {
                    console.error('Error al editar:', error);
                    alert('No se pudo conectar con el servidor')
                }
            });
            tabla.appendChild(fila);
        });
    } catch (error) {
        console.error('Error al cargar colonias:', error);
        tabla.innerHTML = `
            <tr>
                <td colspan="2" class="text-center py-4 text-danger">
                    <i class="bi bi-exclamation-triangle"></i> Error al conectar con el servidor.
                </td>
            </tr>`;
    }
}

//REGISTRAR COLONIA
document.addEventListener('DOMContentLoaded', () => {

    cargarColonias();

    const btnGuardarColonia = document.getElementById('btnGuardarColonia');
    const inputNombreColonia = document.getElementById('inputNombreColonia');

    if(btnGuardarColonia) {
        btnGuardarColonia.addEventListener('click', async () => {
            const nombreColonia = inputNombreColonia.value.trim();
            //Validar que el campo no este vacio
            if(!nombreColonia) {
                alert('Por favor, escribe el nombre de la colonia');
                return;
            }
            try {
                //Peticion POST a FastAPI
                const respuesta = await fetch(`${environment.apiUrl}/colonias`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nombre_colonia: nombreColonia
                    })
                });
                const datos = await respuesta.json();
                if (respuesta.ok) {
                    alert('Colonia registrada con éxito');
                    //Limpiar el campo de texto
                    inputNombreColonia.value = '';
                    //Cerrar el modal automaticamente con bootstrap
                    const modalElemento = document.getElementById('nuevaColonia');
                    const modalInstancia = bootstrap.Modal.getInstance(modalElemento);
                    if (modalInstancia) {
                        modalInstancia.hide();
                    }
                    cargarColonias();
                } else {
                    alert(`Error al guardar: ${datos.detail || 'Ocurrio un problema'}`);
                }
            } catch (error) {
                console.error('Error en la peticion:', error);
                alert('No se pudo conectar con el servidor backend')
            }
        });
    }
})

//Modulo: Ver repartidores en logistica:
// Función exclusiva para la vista de Logística
async function cargarRepartidoresLogistica() {
    const tabla = document.getElementById('tablaRepartidoresLogistica');
    
    // Si no estamos en la página de logística (no existe la tabla), detenemos la función
    if (!tabla) return; 

    try {
        const respuesta = await fetch(`${environment.apiUrl}/repartidores`);
        const repartidores = await respuesta.json();

        tabla.innerHTML = ''; // Limpiar el mensaje de "Cargando..."

        // Recorrer la lista de repartidores
        repartidores.forEach(repartidor => {
            
            // Unimos el nombre con su apellido (si tiene materno, se agrega, si no, se deja en blanco)
            const nombreCompleto = `${repartidor.nombre} ${repartidor.apellido_materno || ''}`.trim();
            
            // Lógica de colores 
            const colorTurno = repartidor.en_turno ? 'bg-success' : 'bg-secondary';
            const textoTurno = repartidor.en_turno ? 'En turno' : 'Inactivo';
            
            const colorContrato = repartidor.estatus_contrato ? 'bg-primary' : 'bg-danger';
            const textoContrato = repartidor.estatus_contrato ? 'Activo' : 'Baja';

            // Fila con los datos 
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td class="px-4 py-3 fw-medium text-dark">${nombreCompleto}</td>
                <td class="px-4 py-3 text-muted">${repartidor.ruta}</td> 
                <td class="px-4 py-3"><i class="bi bi-telephone"></i> ${repartidor.telefono}</td>
                <td class="px-4 py-3"><span class="badge ${colorTurno}">${textoTurno}</span></td>
                <td class="px-4 py-3"><span class="badge ${colorContrato}">${textoContrato}</span></td>
            `;
            
            tabla.appendChild(fila);
        });
    } catch (error) {
        console.error("Error al cargar los repartidores en logística:", error);
        tabla.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4 text-danger">
                    <i class="bi bi-exclamation-triangle"></i> Error al cargar los datos.
                </td>
            </tr>
        `;
    }
}

//Modulo: Alta de repartidores
const btnGuardarRepartidor = document.getElementById('btnGuardarRepartidor');

if(btnGuardarRepartidor) {
    btnGuardarRepartidor.addEventListener('click', async () => {
        //Capturar valores de los inputs y limpiar espacios en blanco
        const nombre = document.getElementById('inputNombreRepartidor').value.trim();
        const paterno = document.getElementById('inputPaternoRepartidor').value.trim();
        const materno = document.getElementById('inputMaternoRepartidor').value.trim();
        const telefono = document.getElementById('inputTelefonoRepartidor').value.trim();

        //Validacion de campos obligatorios
        if (nombre === '' || paterno === '' || telefono === '') {
            alert('Por favor, llena los campos obligatorios: Nombre, Apellido Paterno y Telefono');
            return;
        }
    //JSON: si el apellido materno esta vacio, se manda NULL
    const datosRepartidor = {
        nombre: nombre,
        apellido_paterno: paterno,
        apellido_materno: materno === '' ? null : materno,
        telefono: telefono
    };
    try {
        //Peticion post a FastAPI
        const respuesta = await fetch(`${environment.apiUrl}/repartidores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosRepartidor)
        });

        if (respuesta.ok) {
            alert('Repartidor registado con éxito');
            //Limpiar el formulario
            document.getElementById('inputNombreRepartidor').value = '';
            document.getElementById('inputPaternoRepartidor').value = '';
            document.getElementById('inputMaternoRepartidor').value = '';
            document.getElementById('inputTelefonoRepartidor').value = '';
            //Cerrar el modal
            const modalElement = document.getElementById('nuevoRepartidor');
            const modalInstancia = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
            modalInstancia.hide();
            
            cargarRepartidoresLogistica();

        } else {
            //Errores de fastapi, como telefono duplicado
            const errorData = await respuesta.json();
            alert(`Atencion: ${errorData.detail}`);
        }
    } catch (error) {
        alert('No se pudo conectar con el servidor')
    }
    });
}

// ==========================================
// MÓDULO: BAJA DE REPARTIDORES
// ==========================================

// 1. Llenar listas al abrir el modal
const modalBajaRepartidor = document.getElementById('bajaRepartidor');
let listaRepartidoresActivos = [];

if (modalBajaRepartidor) {
    modalBajaRepartidor.addEventListener('show.bs.modal', async () => {
        const selectDespedir = document.getElementById('selectRepartidorDespedir');
        const selectReemplazo = document.getElementById('selectReemplazoBaja');

        // Escudo: Si existen las listas, las modificamos
        if (selectDespedir && selectReemplazo) {
            selectDespedir.innerHTML = '<option value="">Cargando...</option>';
            selectReemplazo.innerHTML = '<option value="">-- Primero selecciona a quién dar de baja --</option>';
            selectReemplazo.disabled = true;

            try {
                const respuesta = await fetch(`${environment.apiUrl}/repartidores`);
                const repartidores = await respuesta.json();
                
                // Filtrar solo los que siguen trabajando
                listaRepartidoresActivos = repartidores.filter(r => r.estatus_contrato === 1);

                selectDespedir.innerHTML = '<option value="">-- Selecciona a quién dar de baja --</option>';
                listaRepartidoresActivos.forEach(rep => {
                    const nombre = `${rep.nombre_pila} ${rep.apellido_paterno}`.trim();
                    selectDespedir.innerHTML += `<option value="${rep.id_usuario}">${nombre}</option>`;
                });
            } catch (error) {
                console.error(error);
                selectDespedir.innerHTML = '<option value="">Error al cargar datos</option>';
            }
        }
    });
}

// 2. Evento cuando cambias de repartidor en la primera lista
const selectDespedirDOM = document.getElementById('selectRepartidorDespedir');

// Escudo: Solo agregamos el evento si el selector existe en la página
if (selectDespedirDOM) {
    selectDespedirDOM.addEventListener('change', (evento) => {
        const selectReemplazo = document.getElementById('selectReemplazoBaja');
        if (!selectReemplazo) return; // Escudo extra por si acaso

        const idDespedido = parseInt(evento.target.value); 

        // Si se regresa a la opción por defecto
        if (!idDespedido) {
            selectReemplazo.innerHTML = '<option value="">-- Primero selecciona a quién dar de baja --</option>';
            selectReemplazo.disabled = true;
            return;
        }

        // Se habilita y se llena la lista de reemplazo
        selectReemplazo.disabled = false;
        selectReemplazo.innerHTML = '<option value="">-- Dejar rutas sin asignar --</option>';

        listaRepartidoresActivos.forEach(rep => {
            // Llenar todos menos al que se despide
            if (rep.id_usuario !== idDespedido) {
                const nombre = `${rep.nombre_pila} ${rep.apellido_paterno}`.trim();
                selectReemplazo.innerHTML += `<option value="${rep.id_usuario}">${nombre}</option>`;
            }
        });
    });
}

// 3. Confirmar baja y mandarlo a FastAPI
const btnConfirmarBaja = document.getElementById('btnConfirmarBaja');

// Escudo: Solo escucha el clic si el botón existe
if (btnConfirmarBaja) {
    btnConfirmarBaja.addEventListener('click', async () => {
        const selectDespedir = document.getElementById('selectRepartidorDespedir');
        const selectReemplazo = document.getElementById('selectReemplazoBaja');
        
        // Verificamos de nuevo que existan en el momento del clic
        if (!selectDespedir || !selectReemplazo) return;

        const idUsuario = selectDespedir.value;
        const idReemplazo = selectReemplazo.value;

        if (!idUsuario) {
            alert('Por favor, selecciona al repartidor que deseas dar de baja');
            return;
        }
        
        const textoOriginal = btnConfirmarBaja.innerHTML;
        btnConfirmarBaja.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Procesando...';
        btnConfirmarBaja.disabled = true;

        try {
            const payload = {
                id_reemplazo: idReemplazo === "" ? null : parseInt(idReemplazo)
            };

            const respuesta = await fetch(`${environment.apiUrl}/repartidores/${idUsuario}/baja`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });

            if (respuesta.ok) {
                alert('Baja procesada y rutas actualizadas correctamente');
                // Cerrar modal y actualizar la tabla
                const modalInstancia = bootstrap.Modal.getInstance(document.getElementById('bajaRepartidor'));
                if(modalInstancia) modalInstancia.hide();
                cargarRepartidoresLogistica();
            } else {
                const errorData = await respuesta.json();
                alert(`Error: ${errorData.detail}`);
            }
        } catch (error) {
            console.error("Error:", error);
            alert('No se pudo conectar con el servidor');
        } finally {
            btnConfirmarBaja.innerHTML = textoOriginal;
            btnConfirmarBaja.disabled = false;
        }
    });
}
//Asignacion de rutas en logistica

const asignarRutas = document.getElementById('asignarRutas');

if (asignarRutas) {
    //Evento que se dispara solo cuando el modal se abre
    asignarRutas.addEventListener('show.bs.modal', async () => {
        await cargarSelectRepartidores();
        await cargarCheckboxesColonias();
    });
}
// Cargar repartidores en el menu de rutas
async function cargarSelectRepartidores() {
    const select = document.getElementById('selectRepartidorAsignar');
    select.innerHTML = '<option value="">Cargando...</option>';

    try {
        const respuesta = await fetch(`${environment.apiUrl}/repartidores`);
        const repartidores = await respuesta.json();
        //Filtrar solo los empleados con contrato activo
        const repartidoresActivos = repartidores.filter(rep => rep.estatus_contrato === 1);
        select.innerHTML = '<option value="">-- Selecciona un repartidor --</option>';
        
        repartidoresActivos.forEach(rep => {
            //misma logica que en la tabla principal con el nombre
            const nombreCompleto = `${rep.nombre} ${rep.apellido_materno || ''}`.trim();
            //guardar el id_usuario en el value para saber a que repartidor se asigna
            select.innerHTML += `<option value="${rep.id_usuario}">${nombreCompleto}</option>`
        });
    } catch (error) {
        console.error("Error al cargar repartidores en el select:", error);
        select.innerHTML = '<option value="">Error al cargar datos</option>';
    }
}
//Cargar rutas con checkboxes en menu de rutas

async function cargarCheckboxesColonias() {
    const contenedor = document.getElementById('contenedorCheckboxesColonias');
    contenedor.innerHTML = '<div class="text-center text-muted"><div class="spinner-border spinner-border-sm me-2"></div> Cargando colonias...</div>';
    
    try{
        const respuesta = await fetch(`${environment.apiUrl}/colonias`);
        const colonias = await respuesta.json();
        //limpiar texto de cargando...
        contenedor.innerHTML = '';

        if (colonias.length === 0) {
            contenedor.innerHTML = '<p class="text-muted text-center mb-0">No hay colonias registradas en el sistema.</p>';
            return;
        }
        //Crear checkbox por cada colonia
        colonias.forEach(colonia => {
            const div = document.createElement('div');
            div.className = 'form-check mb-2';
            div.innerHTML = `
                <input class="form-check-input colonia-checkbox" type="checkbox" value="${colonia.id_colonia}" id="checkColonia_${colonia.id_colonia}">
                <label class="form-check-label user-select-none" style="cursor: pointer;" for="checkColonia_${colonia.id_colonia}">
                    ${colonia.nombre_colonia}
                </label>
            `;
            contenedor.appendChild(div);
        });
    } catch (error) {
        console.error("Error al cargar las colonias en checkboxes:", error);
        contenedor.innerHTML = '<p class="text-danger text-center mb-0"><i class="bi bi-x-circle"></i> Error al cargar las rutas</p>';
    }
}
//Boton de guardar rutas

const btnGuardarRutas = document.getElementById('btnGuardarRutas');

if (btnGuardarRutas) {
    btnGuardarRutas.addEventListener ('click', async () => {
        //Verificar que repartidor selecciono
        const selectRepartidor = document.getElementById('selectRepartidorAsignar');
        const idUsuario = selectRepartidor.value;

        if(!idUsuario) {
            alert('Por favor, selecciona un repartidor en el paso 1');
            return;
        }
        //Recolectar todos los checkbox marcados
        const checkboxesMarcados = document.querySelectorAll('.colonia-checkbox:checked');
        //Se convierte la lista de cuadritos en un arreglo de puros ids
        const coloniasIds = Array.from(checkboxesMarcados).map(checkbox => parseInt(checkbox.value));
        //Bloquear el boton temporalmente para evitar el doble clic
        const textoOriginal = btnGuardarRutas.innerHTML;
        btnGuardarRutas.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';
        btnGuardarRutas.disabled = true;

        try {
            //hacer envio post a la ruta de fastapi
            const respuesta = await fetch(`${environment.apiUrl}/repartidores/${idUsuario}/rutas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ colonias: coloniasIds})
            });
            if (respuesta.ok) {
                alert('Rutas asignadas y actualizadas correctamente');
                //Cerrar la ventana
                const modalElement = document.getElementById('asignarRutas');
                const modalInstancia = bootstrap.Modal.getInstance(modalElement);
                modalInstancia.hide();
                //Volver a cargar la tabla para que aparezcan las colonias sin tener que recargar la pagina
                cargarRepartidoresLogistica();
            } else {
                const errorData = await respuesta.json();
                alert(`Error al guardar: ${errorData.detail}`);
            }
        } catch (error) {
            console.error("Error al asignar las rutas:", error);
            alert('Error con la conexion con el servidor');
        } finally {
            //devolver el boton a la normalidad sin importar que pase
            btnGuardarRutas.innerHTML = textoOriginal;
            btnGuardarRutas.disabled = false;
        }
    });
}
cargarColonias();
cargarRepartidoresLogistica();