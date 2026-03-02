# main.py
# Este es el archivo principal de la aplicación FastAPI

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

# Importar las funciones de conexión a MongoDB
from app.database import conectar_mongo, cerrar_conexion

# Importar las rutas
from app.routes import armas, ventajas, mapas, subir_arma_imagen, subir_mapa_imagen, subir_ventaja_imagen, auth_routes

# PASO 1: Definir el ciclo de vida de la aplicación
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Esta función maneja lo que sucede cuando la app inicia y cuando se cierra.
    - Al iniciar: conecta a MongoDB
    - Al cerrar: cierra la conexión a MongoDB
    """
    # STARTUP: Código que se ejecuta al iniciar
    print("🚀 Iniciando aplicación...")
    await conectar_mongo()
    
    yield  # Aquí la aplicación está corriendo
    
    # SHUTDOWN: Código que se ejecuta al cerrar
    print("🛑 Cerrando aplicación...")
    await cerrar_conexion()

# PASO 2: Crear la aplicación FastAPI
app = FastAPI(
    title="COD Zombies API",
    description="API REST para información de Call of Duty Zombies (WaW - BO4)",
    version="1.0.0",
    lifespan=lifespan  # Vincular el ciclo de vida
)

# PASO 3: Configurar CORS (Cross-Origin Resource Sharing)
# Esto permite que Angular (que corre en http://localhost:4200) 
# pueda hacer peticiones a FastAPI (que corre en http://localhost:8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",  # Angular development server
        "http://localhost:3000",  # Por si usas otro puerto
        "https://cod-zombies.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Permitir todos los métodos (GET, POST, PUT, DELETE)
    allow_headers=["*"],  # Permitir todos los headers
)

# Esto permite que FastAPI sirva las imágenes guardadas
app.mount("/img", StaticFiles(directory="../frontend/public/img"), name="imagenes")

# PASO 4: Incluir las rutas de las diferentes secciones
# Todas las rutas de armas.py, ventajas.py y mapas.py se añadirán bajo /api
app.include_router(subir_arma_imagen.router, prefix="/api")
app.include_router(subir_mapa_imagen.router, prefix="/api")
app.include_router(subir_ventaja_imagen.router, prefix="/api")
app.include_router(armas.router, prefix="/api")
app.include_router(ventajas.router, prefix="/api")
app.include_router(mapas.router, prefix="/api")
app.include_router(auth_routes.router)

# Aquí puedes incluir más routers:

# PASO 5: Ruta raíz para verificar que la API funciona
@app.get("/")
async def root():
    """
    Ruta principal: GET /
    Retorna un mensaje de bienvenida.
    Útil para verificar que la API está funcionando.
    """
    return {
        "message": "🧟 Bienvenido a COD Zombies API 🧟",
        "version": "1.0.0",
        "endpoints": {
            "weapons": "/api/armas",
            "perks": "/api/ventajas",
            "maps": "/api/mapas",
            "docs": "/docs"  # Documentación automática de FastAPI
        }
    }

# PASO 6: Ruta de salud (health check)
@app.get("/health")
async def health_check():
    """
    Ruta de salud: GET /health
    Útil para verificar que el servidor está activo.
    Se usa en producción para monitoreo.
    """
    return {"status": "healthy", "service": "COD Zombies API"}


# PASO 7: Instrucciones para ejecutar
"""
Para ejecutar esta aplicación:

1. Instalar dependencias:
   pip install -r requirements.txt

2. Crear archivo .env con:
   MONGODB_URL=mongodb://localhost:27017
   DATABASE_NAME=cod_zombies_db

3. Ejecutar el servidor:
   uvicorn app.main:app --reload

4. Abrir documentación interactiva:
   http://localhost:8000/docs

5. La API estará disponible en:
   http://localhost:8000
"""

@app.get("/debug-rutas")
async def debug_rutas():
    rutas = []
    for route in app.routes:
        rutas.append(str(route.path))
    return {"rutas": rutas}