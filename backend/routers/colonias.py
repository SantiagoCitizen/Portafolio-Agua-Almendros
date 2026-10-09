from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import db_conexion
from mysql.connector import Error

#Prefix que hace que todas las rutas lleven /colonias
router = APIRouter(
    prefix="/colonias",
    tags=["Gestion de Colonias"]
)

#Clases base model
class NuevaColonia(BaseModel):
    nombre_colonia: str

class UpdateColonia(BaseModel):
    nombre_colonia: str

#----------------Panel de Logistica------------------
#Ver colonias ya registradas
@router.get("/")
def obtener_colonias():
    conexion = db_conexion()
    if conexion is None:
        raise HTTPException(status_code=500, detail="Error al conextar con la base de datos")

    try:
        #Datos listos para JSON
        cursor = conexion.cursor(dictionary=True)
        sql_query = "SELECT id_colonia, nombre_colonia FROM colonias ORDER BY nombre_colonia ASC"
        cursor.execute(sql_query)
        colonias = cursor.fetchall()
        return colonias
    except Error as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if conexion and conexion.is_connected():
            conexion.close()

#Agregar nuevas colonias
@router.post("/")
def agregar_colonia(datos: NuevaColonia):
    conexion = db_conexion()
    if conexion is None:
        raise HTTPException(status_code=500, detail="Error al conectar con la base de datos")
    
    try:
        cursor = conexion.cursor()
        #Agregar nueva colonia
        sql_query = """
            INSERT INTO colonias (nombre_colonia)
            VALUES (%s)
        """
        cursor.execute(sql_query, (datos.nombre_colonia,))
        conexion.commit()
        return {"mensaje": "Colonia registrada correctamente"}
    except Error as e:
        conexion.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if conexion and conexion.is_connected():
            conexion.close()

#Editar colonias
@router.put("/{id_colonia}")
def actualizar_colonia(id_colonia: int, datos: UpdateColonia):
    conexion = db_conexion()
    if conexion is None:
        raise HTTPException(status_code=500, detail="Error al conectar con la base de datos")
    try:
        cursor = conexion.cursor()
        sql_query = "UPDATE colonias SET nombre_colonia = %s WHERE id_colonia = %s"
        cursor.execute(sql_query, (datos.nombre_colonia, id_colonia))
        conexion.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Colonia no encontrada")
        return {"mensaje": "Colonia actualizada correctamente"}
    except Error as e:
        conexion.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if conexion and conexion.is_connected():
            conexion.close()

#Eliminar colonias
@router.delete("/{id_colonia}")
def eliminar_colonia(id_colonia: int):
    conexion = db_conexion()
    if conexion is None:
        raise HTTPException(status_code=500, detail="Error al conectar con la base de datos")
    try:
        cursor = conexion.cursor()
        sql_query = "DELETE FROM colonias WHERE id_colonia = %s"
        cursor.execute(sql_query, (id_colonia,))
        conexion.commit()
        return {"mensaje": "Colonia eliminada"}
    except Exception as e:
        if conexion:
            conexion.rollback()
        mensaje_error = str(e)
        print(f"Error en el backend al borrar: {str(e)}")
        #Si sucede el error 1451 de llave foranea
        if "1451" in mensaje_error:
            raise HTTPException(status_code=400, detail="No puedes borrar esta colonia porque ya está asignada a la ruta de un repartidor o a un cliente. Contacta a Soporte")
        raise HTTPException(status_code=500, detail="Error interno del servidor al intentar borrar")
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if conexion and conexion.is_connected():
            conexion.close()
