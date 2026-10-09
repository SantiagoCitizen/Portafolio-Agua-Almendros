from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import db_conexion

router = APIRouter(prefix="/ajustes", tags=["Ajustes"])

#Clases para recibir los datos del frontend en JSON
class NegocioUpdate(BaseModel):
    precio_garrafon: float
    whatsapp: str

class SeguridadUpdate(BaseModel):
    id_usuario: int
    telefono: str
    password_nueva: str = None #Se deja opcional pq a lo mejor solo quiere cambiar el telefono

#Obtener la configuracion actual
@router.get("/")
def get_configuracion():
    conexion = db_conexion()
    if conexion is None:
        raise HTTPException(status_code=500, detail="Error al conectar con la base de datos")
    try:
        cursor = conexion.cursor(dictionary = True)
        cursor.execute("SELECT precio_garrafon, whatsapp FROM configuracion WHERE id=1")
        config = cursor.fetchone()
        return config
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if conexion and conexion.is_connected():
            conexion.close()

#Actualizar al configuracion del negocio
@router.put("/negocio")
def update_negocio(datos: NegocioUpdate):
    conexion = db_conexion()
    if conexion is None:
        raise HTTPException(status_code=500, detail="Error al conectar con la base de datos")
    try:
        cursor = conexion.cursor()
        sql_query = "UPDATE configuracion SET precio_garrafon = %s, whatsapp = %s WHERE id = 1"
        cursor.execute(sql_query, (datos.precio_garrafon, datos.whatsapp))
        conexion.commit()
        return {"mensaje": "Configuraciones del negocio actualizadas"}
    except Exception as e:
        conexion.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if conexion and conexion.is_connected():
            conexion.close()

#Actualizar la configuracion de seguridad del negocio
@router.put("/seguridad")
def update_seguridad(datos: SeguridadUpdate):
    conexion = db_conexion()
    if conexion is None:
        raise HTTPException(status_code=500, detail="Error al conectar con la base de datos")
    try:
        cursor = conexion.cursor()
        #Si se escribio una nueva contraseña, se actualizan ambas cosas+
        if datos.password_nueva:
            sql_query = "UPDATE usuarios SET telefono = %s, password_hash = %s WHERE id_usuario = %s"
            cursor.execute(sql_query, (datos.telefono, datos.password_nueva, datos.id_usuario))
        #Si no hay una nueva contraseña, solo se actualiza el telefono
        else:
            sql_query = "UPDATE usuarios SET telefono = %s WHERE id_usuario = %s"
            cursor.execute(sql_query, (datos.telefono, datos.id_usuario))

        conexion.commit()
        return {"mensaje": "Configuraciones de seguridad actualizadas correctamente"}
    except Exception as e:
        conexion.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if conexion and conexion.is_connected():
            conexion.close()
        