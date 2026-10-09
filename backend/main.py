"""
FastAPI, HTTPException: Una crea el servidor y la otra devuelve error web formales como el 404 o 500 si falla algo
"""
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles 

#Importar modulos externos
from routers import colonias
from routers import repartidores
from routers import clientes
from routers import auth
from routers import finanzas
from routers import ajustes
from routers import analitica

# Asegurar que la carpeta de comprobantes exista al iniciar el servidor
os.makedirs("uploads/comprobantes", exist_ok=True)

"""
Se inicializa la aplicacion, la variable "app" es el servidor
title, description y version son leidos por FastAPI para construir automaticamente la documentacion grafica 
"""
app = FastAPI(
    title = "API Agua Los Almendros",
    description = "Backend oficial para la gestion de pedidos y repartidores de Agua Los Almendros",
    version = "1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Montar la carpeta uploads para que las imágenes puedan ser vistas por Finanzas y la App
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

#Conectar con los modulos externos
app.include_router(colonias.router)
app.include_router(repartidores.router)
app.include_router(clientes.router)
app.include_router(auth.router)
app.include_router(finanzas.router)
app.include_router(ajustes.router)
app.include_router(analitica.router)

"""
"@app.get("/")" es un decorador que le dice a la app: Cuando alguien entre a la raiz ("/") ejecuta la funcion de abajo y convierte el resultado en JSON automaticamente
"""
@app.get("/")
def raiz():
    return {"mensaje": "Agua Los Almendros En linea"}