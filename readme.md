# Sistema de Gestión - Agua Los Almendros

Ecosistema de software integral desarrollado para la logística, administración y venta de una purificadora de agua. El proyecto centraliza la operación mediante un panel administrativo web y dos aplicaciones móviles (repartidores y clientes), todo conectado a una API REST.

## Módulos del Sistema

1. **App Móvil (Cliente):** Generación de pedidos, selección de método de pago (efectivo/transferencia con carga de comprobante), historial de compras y tarifas dinámicas.
2. **App Móvil (Repartidor):** Recepción de pedidos en tiempo real por auto-asignación de ruta, gestión de entregas (efectivo, validación de transferencias, incidencias) y liquidación de caja.
3. **Panel Administrativo (Web):** 
   - **Logística:** Seguimiento de rutas y bitácoras de campo.
   - **Finanzas:** Conciliación diaria, auditoría de transferencias, cálculo de efectivo esperado y exportación de reportes (PDF/Excel).
4. **Backend (API):** Gestión centralizada de base de datos, autenticación JWT y roles de usuario.

## Tecnologías Utilizadas

* **Backend:** Python, FastAPI, MySQL, Uvicorn.
* **Frontend Móvil:** Ionic, Angular, TypeScript.
* **Frontend Web:** HTML5, CSS3, Vanilla JavaScript, Bootstrap 5.
* **Herramientas:** JWT, Axios/Fetch, SheetJS, jsPDF.

## Instalación y Despliegue Local

Sigue estos pasos para ejecutar el proyecto en tu entorno de desarrollo.

### 1. Requisitos Previos

* [Node.js](https://nodejs.org/) (para compilar la app de Ionic/Angular).
* [Python 3.8+](https://www.python.org/) (para el backend).
* Servidor MySQL (XAMPP, MySQL Workbench, etc.).
* Ionic CLI instalado globalmente (`npm install -g @ionic/cli`).

### 2. Configurar la Base de Datos
1. Inicia tu servidor MySQL.
2. Crea una base de datos vacía.
3. Importa el archivo de estructura `database/schema.sql` para generar las tablas necesarias.

### 3. Levantar el Backend (FastAPI)

Abre una terminal en la carpeta `backend/` y ejecuta:

```bash
# Crear un entorno virtual
python -m venv venv

# Activar el entorno virtual (Windows)
venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt
```

Crea un archivo `.env` en la raíz de la carpeta `backend/` basándote en el archivo `.env.example` y coloca tus credenciales de MySQL:

```env
DB_HOST=127.0.0.1
DB_USER=tu_usuario
DB_PASSWORD=tu_contrasena
DB_NAME=nombre_de_tu_bd
JWT_SECRET=tu_clave_secreta
```

Inicia el servidor de desarrollo:

```bash
uvicorn main:app --reload
```
*La API estará disponible en `http://127.0.0.1:8000`*

### 4. Levantar la App Móvil (Ionic/Angular)

Abre una nueva terminal en la carpeta `almendros-movil/` y ejecuta:

```bash
# Instalar los paquetes de Node
npm install

# Levantar el servidor de prueba de Ionic
ionic serve
```
*La aplicación se abrirá en tu navegador en `http://localhost:8100`*

### 5. Panel Administrativo Web

El panel está construido con Vanilla JS y no requiere compilación. Simplemente abre la carpeta `web_panel/` y utiliza un servidor estático (como la extensión Live Server de Visual Studio Code) sobre el archivo `index.html`.
