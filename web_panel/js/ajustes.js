import { environment } from './config.js';

const url = `${environment.apiUrl}/ajustes`;

document.addEventListener('DOMContentLoaded', () => {
    //Cargar el precio y el nuero de telefono nada mas entrar a la pagina
    cargarConfiguracion();
});

//Obtener la configuracion actual y llenado del formulario
async function cargarConfiguracion() {
    try {
        const respuesta = await fetch(`${url}/`);
        if (respuesta.ok) {
            const datos = await respuesta.json();

            //LLenado de los inputs con python
            document.getElementById('inputPrecioGarrafon').value = datos.precio_garrafon;
            document.getElementById('inputWhatsapp').value = datos.whatsapp;
            
        } else {
            console.error("Error al cargar la configuracion");
        }
    } catch (error) {
        console.error("Fallo en la conexion al cargar los ajustes", error);
    }
}

//Guardar configuraciones de negocio
document.getElementById('formAjustesNegocio').addEventListener('submit', async (e) => {
    //Con esto se evita que la pagina se recargue al dar clic
    e.preventDefault();

    const precio = document.getElementById('inputPrecioGarrafon').value;
    const whatsapp = document.getElementById('inputWhatsapp').value;

    try {
        const respuesta = await fetch(`${url}/negocio`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                precio_garrafon: parseFloat(precio) || 0,
                whatsapp: whatsapp
            })
        });

        if (respuesta.ok) {
            alert("Configuracion de negocio guardada con exito");
        } else {
            alert("Error al intentar guardar la configuracion del negocio");
        }
    } catch (error) {
        alert("Fallo de conexion con el servidor");
    }
});

//Guardar configuracion de seguridad del negocio
document.getElementById('formSeguridad').addEventListener('submit', async (e) => {
    e.preventDefault();

    const telefono = document.getElementById('inputNewTelefono').value;
    const passNueva = document.getElementById('inputNuevaPass').value;
    const passConfirmar = document.getElementById('inputConfirmarPass').value;

    //Validacion basica de contraseñas
    if (passNueva !== passConfirmar) {
        alert("Las contraseñas no coinciden. Por favor, verificalas");
        return;
    }

    const idUsuario = localStorage.getItem('id_usuario') || 1;
    
    const paqueteDatos = {
        id_usuario: parseInt(idUsuario),
        telefono: telefono,
        //si no se escribio una contraseña nueva, se le manda null a python para que no cambie la contraseña
        password_nueva: passNueva === "" ? null: passNueva
    };

    try {
        const respuesta = await fetch(`${url}/seguridad`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paqueteDatos)
        });

        if (respuesta.ok) {
            alert("La configuracion de seguridad del sistea ha sido actualizada");
            //Se limpian los campos por seguridad
            document.getElementById('inputNuevaPass').value = "";
            document.getElementById('inputConfirmarPass').value = "";

            //Se actualiza el telefono en el navegador
            localStorage.setItem('telefono_usuario', telefono);
        } else {
            alert("Error al intentar actualizar la configuracion de seguridad");
        }
    } catch (error) {
        alert("Fallo en la conexion con el servidor");
    }
});