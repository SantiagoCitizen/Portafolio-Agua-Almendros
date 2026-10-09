import os
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv()) #<-- Carga de variables de entorno

def db_conexion():
    try:
        conexion = mysql.connector.connect(
            host = os.getenv('DB_HOST', '127.0.0.1'),
            user = os.getenv('DB_USER'),
            password = os.getenv('DB_PASSWORD'),
            database = os.getenv('DB_NAME')
        )
        if conexion.is_connected():
            return conexion

    except Error as e:
        print(f"Error al conectar la b.d: {e}")
        return None

