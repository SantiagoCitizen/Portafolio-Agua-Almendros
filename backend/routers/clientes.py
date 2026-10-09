from fastapi import APIRouter, HTTPException, Depends, Form, File, UploadFile
from pydantic import BaseModel
from typing import Optional
import shutil
import os
import uuid
from database import db_conexion
from routers.auth import get_usuario_actual
from mysql.connector import Error

router = APIRouter(
    prefix="/clientes",
    tags=["Gestion de Clientes"]
)

# Clases BaseModel
class ActualizarTarifa(BaseModel):
    tarifa_especial: float


# Obtener todos los clientes (Panel de Administración)
@router.get("/")
def get_clientes():
    conexion = db_conexion()
    if conexion is None:
        return {"error": "No se pudo conectar a la base de datos"}

    try:
        cursor = conexion.cursor(dictionary=True)
        sql_query = """
            SELECT
                id_usuario,
                CONCAT_WS(' ', nombre, apellido_paterno) AS cliente,
                CASE id_rol
                    WHEN 3 THEN 'Residencial'
                    WHEN 4 THEN 'Empresarial'
                END AS categoria,
                IFNULL(tarifa_especial, (SELECT precio_garrafon FROM configuracion WHERE id = 1)) AS tarifa
            FROM usuarios
            WHERE id_rol IN (3, 4);
        """
        cursor.execute(sql_query)
        clientes = cursor.fetchall()
        return clientes
    except Error as e:
        return {"error": str(e)}
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if conexion and conexion.is_connected():
            conexion.close()

# Obtener tarifa especifica del cliente logueado (App Móvil)
@router.get("/mi-tarifa")
def obtener_mi_tarifa(usuario_actual: dict = Depends(get_usuario_actual)):
    conexion = db_conexion()
    if not conexion:
        raise HTTPException(status_code=500, detail="Error de conexión")

    try:
        cursor = conexion.cursor(dictionary=True)
        # Revisa si tiene tarifa especial, si no, le da el precio base
        cursor.execute("""
            SELECT IFNULL(tarifa_especial, (SELECT precio_garrafon FROM configuracion WHERE id = 1)) AS tarifa_especial
            FROM usuarios
            WHERE id_usuario = %s
        """, (usuario_actual.get("id_usuario"),))
        
        resultado = cursor.fetchone()
        if not resultado:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
            
        return resultado
    finally:
        cursor.close()
        conexion.close()

# Pedidos del cliente Historial / Activos (App Móvil)
@router.get("/mis-pedidos")
def obtener_mis_pedidos(usuario_actual: dict = Depends(get_usuario_actual)):
    # Validar que sea cliente
    if usuario_actual.get("id_rol") not in [3, 4]:
        raise HTTPException(status_code=403, detail="Acceso solo para clientes")
        
    conexion = db_conexion()
    if not conexion:
        raise HTTPException(status_code=500, detail="Error de conexión")
        
    try:
        cursor = conexion.cursor(dictionary=True)
        # Traer pedidos del cliente ordenados por los más recientes (Añadimos tipo_pago y comprobante_url)
        cursor.execute("""
            SELECT 
                id_pedido, 
                cantidad_garrafones, 
                monto_total, 
                tipo_pago,
                comprobante_url,
                estatus_entrega, 
                fecha_hora_creacion
            FROM pedidos 
            WHERE id_cliente = %s 
            ORDER BY fecha_hora_creacion DESC
            LIMIT 50
        """, (usuario_actual.get("id_usuario"),))
        
        return cursor.fetchall()
    finally:
        cursor.close()
        conexion.close()

# Crear un nuevo pedido con carga de comprobante y auto-asignación (App Móvil)
@router.post("/pedidos")
def crear_pedido(
    cantidad_garrafones: int = Form(...),
    tipo_pago: str = Form(...),
    monto_total: float = Form(...),
    notas_cliente: str = Form(""),
    comprobante: Optional[UploadFile] = File(None),
    usuario_actual: dict = Depends(get_usuario_actual)
):
    # Validar que sea cliente (rol 3 o 4)
    if usuario_actual.get("id_rol") not in [3, 4]:
        raise HTTPException(status_code=403, detail="Solo los clientes pueden hacer pedidos")

    conexion = db_conexion()
    if not conexion:
        raise HTTPException(status_code=500, detail="Error de conexión")

    # 1. Procesar y guardar el comprobante si existe
    comprobante_url = None
    if comprobante and tipo_pago == 'Transferencia':
        # Crea la carpeta si no existe
        os.makedirs("uploads/comprobantes", exist_ok=True)
        # Genera un nombre único para que no se sobreescriban imágenes
        ext = comprobante.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = f"uploads/comprobantes/{filename}"
        
        # Guarda el archivo en el disco duro
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(comprobante.file, buffer)
            
        # Genera la URL para la base de datos
        comprobante_url = f"http://127.0.0.1:8000/uploads/comprobantes/{filename}"

    try:
        cursor = conexion.cursor(dictionary=True)
        
        # 2. Buscar la dirección Y LA COLONIA registrada del cliente
        cursor.execute("SELECT id_direccion, id_colonia FROM direcciones_clientes WHERE id_usuario = %s LIMIT 1", (usuario_actual.get("id_usuario"),))
        direccion = cursor.fetchone()
        
        if not direccion:
            raise HTTPException(status_code=400, detail="No tienes una dirección registrada en el sistema.")
            
        id_direccion = direccion["id_direccion"]
        id_colonia = direccion["id_colonia"]
        
        # 3. AUTO-ASIGNACIÓN: Buscar qué repartidor cubre la colonia de este cliente
        cursor.execute("""
            SELECT id_usuario_repartidor 
            FROM repartidores_rutas 
            WHERE id_colonia = %s AND estatus_disponibilidad = 1 
            LIMIT 1
        """, (id_colonia,))
        repartidor = cursor.fetchone()
        
        # Si encuentra un repartidor, toma su ID. Si no, lo deja en None (NULL)
        id_repartidor_asignado = repartidor["id_usuario_repartidor"] if repartidor else None

        precio_unitario = monto_total / cantidad_garrafones

        # 4. Insertar el pedido incluyendo id_repartidor_asignado
        sql = """
            INSERT INTO pedidos (
                id_cliente, id_direccion, cantidad_garrafones, precio_unitario, 
                monto_total, tipo_pago, estatus_entrega, notas_cliente, comprobante_url, id_repartidor_asignado
            )
            VALUES (%s, %s, %s, %s, %s, %s, 'Pendiente', %s, %s, %s)
        """
        valores = (
            usuario_actual.get("id_usuario"),
            id_direccion,
            cantidad_garrafones,
            precio_unitario,
            monto_total,
            tipo_pago,
            notas_cliente,
            comprobante_url,
            id_repartidor_asignado 
        )
        cursor.execute(sql, valores)
        conexion.commit()

        return {"mensaje": "Pedido creado con éxito", "id_pedido": cursor.lastrowid}
    except Error as e:
        conexion.rollback()
        print("ERROR SQL:", str(e)) 
        raise HTTPException(status_code=500, detail="Ocurrió un error en el servidor al guardar el pedido")
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if conexion and conexion.is_connected():
            conexion.close()

# Boton "Ver" en dashboard principal de cliente
@router.get("/{id_usuario}")
def get_detalle_clientes(id_usuario: int):
    conexion = db_conexion()
    if conexion is None:
        raise HTTPException(status_code=500, detail="Error al conectar con la base de datos")

    try:
        cursor = conexion.cursor(dictionary=True)
        # Consulta sql con joins
        sql_query = """
            SELECT
                u.id_usuario,
                u.nombre,
                u.apellido_paterno,
                u.apellido_materno,
                u.telefono,
                u.id_rol,
                u.razon_social,
                u.rfc,
                IFNULL(u.tarifa_especial, (SELECT precio_garrafon FROM configuracion WHERE id = 1)) AS tarifa_especial,
                dc.calle,
                dc.numero,
                dc.referencias_domicilio,
                c.nombre_colonia
            FROM usuarios u
            LEFT JOIN direcciones_clientes dc ON u.id_usuario = dc.id_usuario
            LEFT JOIN colonias c ON dc.id_colonia = c.id_colonia
            WHERE u.id_usuario = %s AND u.id_rol IN (3, 4)
        """
        cursor.execute(sql_query, (id_usuario,))
        cliente = cursor.fetchone()

        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        return cliente
    except Error as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if conexion and conexion.is_connected():
            conexion.close()

# Actualizar la tarifa especial de un cliente
@router.put("/{id_usuario}/tarifa")
def actualizar_tarifa_cliente(id_usuario: int, datos: ActualizarTarifa):
    conexion = db_conexion()
    if conexion is None:
        raise HTTPException(status_code=500, detail="Error al conectar con la base de datos")

    try:
        cursor = conexion.cursor()
        # Actualizar la tarifa del usuario especifico
        sql_query = """
            UPDATE usuarios
            SET tarifa_especial = %s
            WHERE id_usuario = %s AND id_rol IN (3, 4);
        """
        cursor.execute(sql_query, (datos.tarifa_especial, id_usuario))
        # Hacer commit para guardar los cambios
        conexion.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Cliente no encontrado o la tarifa no fue modificada")
        return {"mensaje": "Tarifa actualizada correctamente"}

    except Error as e:
        conexion.rollback() 
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if conexion and conexion.is_connected():
            conexion.close()