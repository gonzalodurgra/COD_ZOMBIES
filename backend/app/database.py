# database.py
# Este archivo maneja la conexión a MongoDB

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
import os
from dotenv import load_dotenv

# Cargar variables de entorno desde el archivo .env
load_dotenv()

# PASO 1: Obtener la URL de conexión de MongoDB desde las variables de entorno
# La URL debe tener este formato: mongodb+srv://usuario:password@cluster.mongodb.net/
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "cod_zombies_db")

# PASO 2: Variable global para almacenar la conexión a la base de datos
# Inicialmente es None (vacía)
database = None

# PASO 3: Función para conectar a MongoDB
async def conectar_mongo():
    """
    Esta función se ejecuta cuando inicia la aplicación.
    Crea la conexión a MongoDB y la guarda en la variable global 'database'
    """
    global database
    
    # Crear el cliente de MongoDB con la URL de conexión
    client = AsyncIOMotorClient(MONGODB_URL, server_api=ServerApi('1'))
    
    # Seleccionar la base de datos específica
    database = client[DATABASE_NAME]
    
    print(f"✅ Conectado a MongoDB - Base de datos: {DATABASE_NAME}")

# PASO 4: Función para cerrar la conexión cuando se apaga la aplicación
async def cerrar_conexion():
    """
    Esta función se ejecuta cuando se cierra la aplicación.
    Cierra la conexión a MongoDB de forma segura.
    """
    global database
    if database is not None:
        database.client.close()
        print("❌ Conexión a MongoDB cerrada")

# PASO 5: Función helper para obtener la base de datos en cualquier parte del código
def get_database():
    """
    Retorna la instancia de la base de datos.
    Se usa en las rutas para acceder a las colecciones.
    """
    return database