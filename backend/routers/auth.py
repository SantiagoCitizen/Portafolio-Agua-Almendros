from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from mysql.connector import Error
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import bcrypt
import jwt
from datetime import datetime, timedelta
import os
from database import db_conexion
from dotenv import load_dotenv

# Cargar las variables de entorno en la memoria
load_dotenv()

router = APIRouter(
    tags=["Autenticacion"]
)

#Clases BaseModel
class DatosLogin(BaseModel):
    telefono: str
    password: str

#------- Cambiar contraseña
class DatosCambioPassword(BaseModel):
    password_actual : str
    password_nueva : str

#-- Registro de nuevo cliente
class ClienteRegistro(BaseModel):
    nombre: str
    apellido_paterno: str
    apellido_materno: Optional[str] = None
    telefono: str
    password: str
    razon_social: Optional[str] = None
    rfc: Optional[str] = None

    #Datos de direccion
    id_colonia: int
    calle: str
    numero: str
    referencias_domicilio: Optional[str] = None

#Login
@router.post("/login")
def login(datos: DatosLogin):
    conexion = db_conexion()
    if conexion is None:
        raise HTTPException(status_code=500, detail="Error al conectar con la base de datos")

    try:
        cursor = conexion.cursor(dictionary=True)
        #Buscar si existe un usuario con el telefono ingresado
        #Solo se trae los datos que se necesitan, incluyendo el id_rol
        sql_query = """
            SELECT id_usuario, nombre, apellido_paterno, telefono, password_hash, id_rol
            FROM usuarios
            WHERE telefono = %s
        """
        #Ejecutar la consulta pasando el telefono que llego del forntend del login
        cursor.execute(sql_query, (datos.telefono,))
        usuario = cursor.fetchone()

        #Por si el usuario no existe
        if not usuario:
            raise HTTPException(status_code=401, detail="Telefono o contraseña incorrectos")

        #Validar la contraseña
        #Convertir ambas contraseñas en formato bytes para que la libreria bcrypt entienda
        password_ingresada = datos.password.encode('utf-8')
        password_bd = usuario['password_hash'].encode('utf-8')

        #Se compara la ingresada con la de la bd
        if not bcrypt.checkpw(password_ingresada, password_bd):
            raise HTTPException(status_code=401, detail="Telefono o contraseña incorrecta")

        #Token JWT 
        token_vip = {
            "id_usuario": usuario['id_usuario'],
            "rol": usuario['id_rol'],
            "exp": datetime.utcnow() + timedelta(hours=8)
        }
        #Firma con el secreto
        llave_secreta = os.getenv("JWT_SECRET")
        token = jwt.encode(token_vip, llave_secreta, algorithm="HS256")

        #Si pasa todas las verificaciones
        #Se borra la contraseña por seguridad
        del usuario['password_hash']
        #Enviar los datos del usuario al frontend
        return {"Mensaje": "Login exitoso", "token": token, "usuario": usuario}
    except Error as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if conexion and conexion.is_connected():
            conexion.close()

#---------------------Validación de Seguridad-------------------
security = HTTPBearer()

def get_usuario_actual(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    llave_secreta = os.getenv("JWT_SECRET")
    
    try:
        # Desencriptamos usando la misma llave del login
        payload = jwt.decode(token, llave_secreta, algorithms=["HS256"])
        
        # Extrae los datos en token_vip
        # Mapeamos 'rol' a 'id_rol' para que coincida con las validaciones
        return {
            "id_usuario": payload.get("id_usuario"), 
            "id_rol": payload.get("rol")
        }
        
    except Exception as e:
        # Esto imprimirá el error exacto en tu terminal negra de FastAPI
        print(f"FALLO DE DECODIFICACIÓN JWT: {e}")
        raise HTTPException(status_code=401, detail="Token inválido o corrupto.")


#------- Cambiar contraseña
@router.put("/cambiar-password")
def cambiar_password(datos: DatosCambioPassword, usuario_actual: dict = Depends(get_usuario_actual)):

    id_usuario = usuario_actual.get("id_usuario")
    conexion = db_conexion()

    if conexion is None:
        raise HTTPException(status_code=500, detail="Error al conectar con la base de datos")

    try:
        cursor = conexion.cursor(dictionary = True)

        #Obtener el hash actual desde la base de datos
        cursor.execute("SELECT password_hash FROM usuarios WHERE id_usuario = %s", (id_usuario,))
        usuario = cursor.fetchone()

        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        #Verificar que la contraseña actual ingresada coincida con la DB
        password_actual_bytes = datos.password_actual.encode('utf-8')
        hash_db_bytes = usuario['password_hash'].encode('utf-8')

        if not bcrypt.checkpw(password_actual_bytes, hash_db_bytes):
            raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")

        #Encriptar la nueva contraseña y actualizar el registro
        nuevo_hash = bcrypt.hashpw(datos.password_nueva.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        cursor.execute(
            "UPDATE usuarios SET password_hash = %s WHERE id_usuario = %s",
            (nuevo_hash, id_usuario)
        )
        conexion.commit()

        return {"mensaje": "contraseña actualizada exitosamente"}

    except Error as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if conexion and conexion.is_connected():
            conexion.close()

#--- Registro de clientes (App movil)
@router.post("/registro")
def registrar_cliente(datos: ClienteRegistro):
    conexion = db_conexion()
    if conexion is None:
        raise HTTPException(status_code=500, detail="Error al conectar con la base de datos")

    try:
        cursor = conexion.cursor(dictionary=True)

        # 1. Validar si el teléfono ya existe
        cursor.execute("SELECT id_usuario FROM usuarios WHERE telefono = %s", (datos.telefono,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Este teléfono ya está registrado")

        # 2. Encriptar contraseña en formato compatible con bcrypt
        password_bytes = datos.password.encode('utf-8')
        password_encriptada = bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode('utf-8')

        # 3. Asignar el rol (3 = Cliente)
        id_rol_asignado = 3 

        # 4. Insertar en tabla USUARIOS
        sql_usuario = """
            INSERT INTO usuarios 
            (nombre, apellido_paterno, apellido_materno, telefono, password_hash, id_rol, razon_social, rfc) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        valores_usuario = (
            datos.nombre, datos.apellido_paterno, datos.apellido_materno, 
            datos.telefono, password_encriptada, id_rol_asignado, 
            datos.razon_social, datos.rfc
        )
        cursor.execute(sql_usuario, valores_usuario)
        
        # 5. Capturar el ID que MySQL le dio al nuevo usuario
        nuevo_id_usuario = cursor.lastrowid

        # 6. Insertar en tabla DIRECCIONES_CLIENTES
        sql_direccion = """
            INSERT INTO direcciones_clientes 
            (id_usuario, id_colonia, calle, numero, referencias_domicilio) 
            VALUES (%s, %s, %s, %s, %s)
        """
        valores_direccion = (
            nuevo_id_usuario, datos.id_colonia, datos.calle, 
            datos.numero, datos.referencias_domicilio
        )
        cursor.execute(sql_direccion, valores_direccion)

        # 7. Sellar la transacción para que ambas tablas se guarden
        conexion.commit()
        
        return {"mensaje": "Cuenta creada exitosamente"}

    except Error as e:
        # Si falla la tabla direcciones, deshace la inserción de usuarios
        conexion.rollback()
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        if 'cursor' in locals() and cursor:
            cursor.close()
        if conexion and conexion.is_connected():
            conexion.close()