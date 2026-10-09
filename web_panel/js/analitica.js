import { environment } from './config.js';

const url_analitica = `${environment.apiUrl}/analitica`;
let graficaVentas;

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar el input de fecha con el mes actual
    const inputFecha = document.getElementById('inputFechaFiltro');
    const hoy = new Date();
    // Formato obligatorio: YYYY-MM
    const mesStr = (hoy.getMonth() + 1).toString().padStart(2, '0');
    inputFecha.value = `${hoy.getFullYear()}-${mesStr}`;

    cargarInsights();
    cargarGrafica('mes');

    // Listeners
    document.getElementById('btnMes').addEventListener('change', () => cargarGrafica('mes'));
    document.getElementById('btnAnio').addEventListener('change', () => cargarGrafica('anio'));
    
    //Recargar si cambian el mes en el calendario
    inputFecha.addEventListener('change', () => {
        const filtroActivo = document.getElementById('btnMes').checked ? 'mes' : 'anio';
        cargarGrafica(filtroActivo);
    });

    document.getElementById('btnExportarExcel').addEventListener('click', exportarExcel);
    document.getElementById('btnExportarPDF').addEventListener('click', exportarPDF);
});

// Función para pedir los datos y dibujar la gráfica
async function cargarGrafica(filtroTiempo) {
    // Toma la fecha del input
    const fechaSeleccionada = document.getElementById('inputFechaFiltro').value;
    
    try {
        // Se pasa el filtro (mes/año) y la fecha exacta a Python
        const respuesta = await fetch(`${url_analitica}/tendencias?filtro=${filtroTiempo}&fecha=${fechaSeleccionada}`);
        if (respuesta.ok) {
            const datos = await respuesta.json();
            const ctx = document.getElementById('chartVentas').getContext('2d');

            if (graficaVentas) {
                graficaVentas.destroy();
            }

            graficaVentas = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: datos.etiquetas,
                    datasets: [
                        {
                            label: 'Ingresos Totales ($ MXN)',
                            data: datos.ingresos,
                            backgroundColor: 'rgba(13, 110, 253, 0.8)',
                            borderColor: 'rgba(13, 110, 253, 1)',
                            borderWidth: 1,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Volumen (Garrafones)',
                            data: datos.volumen,
                            type: 'line',
                            backgroundColor: 'rgba(25, 135, 84, 1)',
                            borderColor: 'rgba(25, 135, 84, 1)',
                            borderWidth: 2,
                            tension: 0.3, 
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Dinero ($)'} },
                        y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Cantidad' }, grid: { drawOnChartArea: false } }
                    }
                }
            });
        }
    } catch (error) {
        console.error("Error al cargar la gráfica de tendencias:", error);
    }
}

// Función para cargar el Análisis y la Predicción de Insumos
async function cargarInsights() {
    try {
        const respuesta = await fetch(`${url_analitica}/insights`);
        if (respuesta.ok) {
            const datos = await respuesta.json();

            // Insertar datos del pico de ventas
            document.getElementById('mesMayor').innerText = datos.mayor.mes;
            document.getElementById('detalleMayor').innerText = datos.mayor.detalle;

            // Insertar datos de la caída de ventas
            document.getElementById('mesMenor').innerText = datos.menor.mes;
            document.getElementById('detalleMenor').innerText = datos.menor.detalle;

            // Insertar el texto de inteligencia de negocios
            document.getElementById('textoPrediccion').innerText = datos.prediccion;
        }
    } catch (error) {
        console.error("Error al cargar los insights:", error);
        document.getElementById('textoPrediccion').innerText = "No se pudo conectar con el motor de proyecciones.";
    }
}

// Función para Exportar los datos actuales a Excel usando SheetJS
function exportarExcel() {
    if (!graficaVentas) return;

    // Extraer los datos crudos desde la gráfica activa
    const datosExcel = graficaVentas.data.labels.map((etiqueta, indice) => {
        return {
            "Periodo": etiqueta,
            "Ingresos Totales ($ MXN)": graficaVentas.data.datasets[0].data[indice],
            "Volumen (Garrafones)": graficaVentas.data.datasets[1].data[indice]
        };
    });

    // Crear la hoja y el libro de Excel
    const hoja = XLSX.utils.json_to_sheet(datosExcel);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Proyecciones");

    // Determinar el nombre del archivo según el botón activo
    const filtroActivo = document.getElementById('btnMes').checked ? 'Mensual' : 'Anual';
    
    // Descargar el archivo
    XLSX.writeFile(libro, `Reporte_Ventas_${filtroActivo}_Almendros.xlsx`);
}

// Función para Exportar la gráfica a PDF usando jsPDF
function exportarPDF() {
    if (!graficaVentas) return;

    // Tomar una "foto" del lienzo HTML de Chart.js
    const canvas = document.getElementById('chartVentas');
    const imagenGrafica = canvas.toDataURL('image/png', 1.0);

    // Iniciar jsPDF en formato horizontal (landscape)
    const { jsPDF } = window.jspdf;
    const documento = new jsPDF('landscape');

    // Agregar un título
    const filtroActivo = document.getElementById('btnMes').checked ? 'Mensual' : 'Anual';
    documento.setFontSize(16);
    documento.text(`Agua Los Almendros - Reporte ${filtroActivo} de Ventas y Volumen`, 15, 15);

    // Calcular dimensiones proporcionales para inyectar la imagen en el PDF
    const anchoPDF = 260; // Ancho máximo en hoja A4 horizontal
    const altoPDF = (canvas.height * anchoPDF) / canvas.width;

    // Pegar la imagen
    documento.addImage(imagenGrafica, 'PNG', 15, 25, anchoPDF, altoPDF);

    // Descargar PDF
    documento.save(`Grafica_Ventas_${filtroActivo}.pdf`);
}