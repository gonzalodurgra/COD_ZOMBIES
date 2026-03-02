# routes/mapas.py
# Este archivo define todas las rutas (endpoints) para manejar los mapas

from fastapi import APIRouter, HTTPException, status
from typing import List
from bson import ObjectId
from ..models import MapaDB, Mapa
from ..database import get_database

# PASO 1: Crear el router para los mapas
router = APIRouter(prefix="/mapas", tags=["Mapas"])

# PASO 2: Helper para convertir ObjectId a string
def serializar_mapa(mapa) -> dict:
    """
    MongoDB devuelve el _id como ObjectId, pero JSON necesita strings.
    Esta función convierte el documento de MongoDB a un diccionario Python limpio.
    
    IMPORTANTE: Este helper también maneja las relaciones con armas y ventajas.
    Las tuplas se convierten a diccionarios para facilitar el uso en el frontend.
    """
    # Convertir armas de tupla a diccionario
    armas_formateadas = []
    for arma_data in mapa.get("armas", []):
        # arma_data es una tupla: (Arma, precio, en_caja_misteriosa)
        if isinstance(arma_data, dict) and len(arma_data) >= 3:
            armas_formateadas.append({
                "arma": arma_data.get("arma", {}),      # ← clave "arma"
                "precio": arma_data.get("precio", 0),   # ← clave "precio"
                "enCaja": arma_data.get("enCaja", "pared") 
            })
    
    # Convertir ventajas de tupla a diccionario
    ventajas_formateadas = []
    for ventaja_data in mapa.get("ventajas", []):
        # ventaja_data es una tupla: (Ventaja, precio)
        if isinstance(ventaja_data, dict) and len(ventaja_data) >= 2:
            ventajas_formateadas.append({
                "ventaja": ventaja_data.get("ventaja", {}),  # ← clave "ventaja"
                "precio": ventaja_data.get("precio", 0)  # int
            })
    
    return {
        "id": str(mapa["_id"]),
        "nombre": mapa["nombre"],
        "imagen": mapa["imagen"],
        "descripcion": mapa["descripcion"],
        "juego": mapa["juego"],
        "dificultad": mapa["dificultad"],
        "armas": armas_formateadas,
        "ventajas": ventajas_formateadas
    }

# PASO 3: GET - Obtener todos los mapas
@router.get("/", response_model=List[dict])
async def obtener_todos_mapas():
    """
    Ruta: GET /api/mapas/
    Retorna una lista con todos los mapas en la base de datos.
    """
    db = get_database()
    
    mapas = []
    async for mapa in db["mapas"].find({}):
        mapas.append(serializar_mapa(mapa))
    
    return mapas

# PASO 4: GET - Obtener un mapa por ID
@router.get("/{mapa_id}", response_model=dict)
async def get_map_by_id(mapa_id: str):
    """
    Ruta: GET /api/mapas/{mapa_id}
    Retorna un mapa específico buscándolo por su ID.
    Ejemplo: GET /api/mapas/507f1f77bcf86cd799439011
    """
    db = get_database()
    
    # Buscar el mapa por su _id
    mapa = await db["mapas"].find_one({"_id": ObjectId(mapa_id)})
    
    if not mapa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mapa con ID {mapa_id} no encontrado"
        )
    
    return serializar_mapa(mapa)

# PASO 5: GET - Filtrar mapas por dificultad
@router.get("/dificultad/{dificultad}", response_model=List[dict])
async def mapas_dificultad(dificultad: str):
    """
    Ruta: GET /api/maps/difficulty/{dificultad}
    Filtra mapas por nivel de dificultad.
    Ejemplo: GET /api/maps/difficulty/Alta
    """
    db = get_database()
    
    mapas = []
    async for mapa in db["mapas"].find({"dificultad": dificultad}):
        mapas.append(serializar_mapa(mapa))
    
    return mapas

# PASO 6: GET - Filtrar mapas por juego
@router.get("/juego/{juego}", response_model=List[dict])
async def mapas_juego(juego: str):
    """
    Ruta: GET /api/mapas/juego/{juego}
    Filtra mapas que aparecen en un juego específico.
    Ejemplo: GET /api/maps/game/BO1
    
    Usa $in porque 'juegos' es un array
    """
    db = get_database()
    
    mapas = []
    async for mapa in db["mapas"].find({"juegos": {"$in": [juego]}}):
        mapas.append(serializar_mapa(mapa))
    
    return mapas

# PASO 7: POST - Crear un nuevo mapa
@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def crear_mapa(mapa: Mapa):
    """
    Ruta: POST /api/mapas/
    Crea un nuevo mapa en la base de datos.
    
    El body debe contener:
    - nombre: str
    - imagen: str
    - descripcion: str
    - juegos: list[str]
    - dificultad: str
    - armas: list[dict] con formato:
        [
            {
                "arma": {...},  # Objeto arma completo
                "precio": 1000,
                "en_caja_misteriosa": true
            }
        ]
    - ventajas: list[dict] con formato:
        [
            {
                "ventaja": {...},  # Objeto ventaja completo
                "precio": 2500
            }
        ]
    """
    db = get_database()
    
    # Convertir el modelo Pydantic a diccionario
    # NOTA: Las armas y ventajas ya vienen como diccionarios desde el frontend
    mapa_dict = mapa.model_dump(by_alias=True, exclude={"id"})
    
    # Insertar en MongoDB
    result = await db["mapas"].insert_one(mapa_dict)
    
    # Obtener el mapa recién creado
    nuevo_mapa = await db["mapas"].find_one({"_id": result.inserted_id})
    
    return serializar_mapa(nuevo_mapa)

# PASO 8: PUT - Actualizar un mapa existente
@router.put("/{mapa_id}", response_model=dict)
async def actualizar_mapa(mapa_id: str, mapa_update: Mapa):
    """
    Ruta: PUT /api/mapas/{mapa_id}
    Actualiza los datos de un mapa existente.
    
    Todos los campos son opcionales en el update.
    Solo se actualizan los campos que se envíen en el body.
    """
    db = get_database()
    
    # Convertir el modelo a diccionario, excluyendo campos None
    datos_actualizar = {
        k: v for k, v in mapa_update.model_dump(by_alias=True, exclude={"id"}).items() 
        if v is not None
    }
    
    if not datos_actualizar:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay datos para actualizar"
        )
    
    # Actualizar el documento en MongoDB
    result = await db["mapas"].update_one(
        {"_id": ObjectId(mapa_id)},
        {"$set": datos_actualizar}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mapa con ID {mapa_id} no encontrado"
        )
    
    # Obtener el mapa actualizado
    updated_mapa = await db["mapas"].find_one({"_id": ObjectId(mapa_id)})
    
    return serializar_mapa(updated_mapa)

# PASO 9: DELETE - Eliminar un mapa
@router.delete("/{mapa_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_mapa(mapa_id: str):
    """
    Ruta: DELETE /api/mapas/{mapa_id}
    Elimina un mapa de la base de datos.
    Retorna 204 No Content si se elimina correctamente.
    """
    db = get_database()
    
    # Eliminar el documento
    result = await db["mapas"].delete_one({"_id": ObjectId(mapa_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mapa con ID {mapa_id} no encontrado"
        )
    
    return None

# PASO 10: GET - Obtener armas de un mapa específico
@router.get("/{mapa_id}/armas", response_model=List[dict])
async def obtener_armas_mapa(mapa_id: str):
    """
    Ruta: GET /api/mapas/{mapa_id}/armas
    Retorna solo las armas de un mapa específico.
    
    Útil para mostrar el arsenal disponible en un mapa.
    """
    db = get_database()
    
    mapa = await db["mapas"].find_one({"_id": ObjectId(mapa_id)})
    
    if not mapa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mapa con ID {mapa_id} no encontrado"
        )
    
    # Extraer y formatear solo las armas
    armas_formateadas = []
    for arma_data in mapa.get("armas", []):
        if isinstance(arma_data, (tuple, list)) and len(arma_data) >= 3:
            armas_formateadas.append({
                "arma": arma_data[0],
                "precio": arma_data[1],
                "en_caja_misteriosa": arma_data[2]
            })
    
    return armas_formateadas

# PASO 11: GET - Obtener ventajas de un mapa específico
@router.get("/{mapa_id}/ventajas", response_model=List[dict])
async def obtener_ventajas_mapa(mapa_id: str):
    """
    Ruta: GET /api/mapas/{mapa_id}/ventajas
    Retorna solo las ventajas de un mapa específico.
    
    Útil para mostrar las ventajas disponibles en un mapa.
    """
    db = get_database()
    
    mapa = await db["mapas"].find_one({"_id": ObjectId(mapa_id)})
    
    if not mapa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mapa con ID {mapa_id} no encontrado"
        )
    
    # Extraer y formatear solo las ventajas
    ventajas_formateadas = []
    for ventaja_data in mapa.get("ventajas", []):
        if isinstance(ventaja_data, (tuple, list)) and len(ventaja_data) >= 2:
            ventajas_formateadas.append({
                "ventaja": ventaja_data[0],
                "precio": ventaja_data[1]
            })
    
    return ventajas_formateadas

# PASO 12: POST - Añadir arma a un mapa
@router.post("/{mapa_id}/armas", response_model=dict)
async def add_arma_mapa(
    mapa_id: str, 
    arma: dict, 
    precio: int, 
    en_caja_misteriosa: bool
):
    """
    Ruta: POST /api/mapas/{mapa_id}/armas
    Añade un arma al arsenal de un mapa.
    
    Body esperado:
    {
        "arma": {...},  # Objeto arma completo
        "precio": 1000,
        "en_caja_misteriosa": true
    }
    """
    db = get_database()
    
    # Verificar que el mapa existe
    mapa = await db["mapas"].find_one({"_id": ObjectId(mapa_id)})
    
    if not mapa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mapa con ID {mapa_id} no encontrado"
        )
    
    # Crear la tupla de arma
    nueva_arma = [arma, precio, en_caja_misteriosa]
    
    # Añadir al array de armas usando $push
    await db["maps"].update_one(
        {"_id": ObjectId(mapa_id)},
        {"$push": {"armas": nueva_arma}}
    )
    
    # Obtener el mapa actualizado
    mapa_actualizado = await db["mapas"].find_one({"_id": ObjectId(mapa_id)})
    
    return serializar_mapa(mapa_actualizado)

# PASO 13: POST - Añadir ventaja a un mapa
@router.post("/{mapa_id}/ventajas", response_model=dict)
async def add_perk_to_map(mapa_id: str, ventaja: dict, precio: int):
    """
    Ruta: POST /api/maps/{map_id}/perks
    Añade una ventaja a un mapa.
    
    Body esperado:
    {
        "ventaja": {...},  # Objeto ventaja completo
        "precio": 2500
    }
    """
    db = get_database()
    
    # Verificar que el mapa existe
    mapa = await db["mapas"].find_one({"_id": ObjectId(mapa_id)})
    
    if not mapa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mapa con ID {mapa_id} no encontrado"
        )
    
    # Crear la tupla de ventaja
    nueva_ventaja = [ventaja, precio]
    
    # Añadir al array de ventajas usando $push
    await db["mapas"].update_one(
        {"_id": ObjectId(mapa_id)},
        {"$push": {"ventajas": nueva_ventaja}}
    )
    
    # Obtener el mapa actualizado
    mapa_actualizado = await db["mapas"].find_one({"_id": ObjectId(mapa_id)})
    
    return serializar_mapa(mapa_actualizado)

"""
RUTAS DISPONIBLES:

GET    /api/mapas/                     - Obtener todos los mapas
GET    /api/mapas/{mapa_id}             - Obtener un mapa por ID
GET    /api/mapas/dificultad/{dificultad}     - Filtrar por dificultad
GET    /api/mapas/juegos/{juego}         - Filtrar por juego
POST   /api/mapas/                     - Crear nuevo mapa
PUT    /api/mapas/{mapa_id}             - Actualizar mapa
DELETE /api/mapas/{mapa_id}             - Eliminar mapa
GET    /api/mapas/{mapa_id}/armas     - Obtener armas de un mapa
GET    /api/mapas/{mapa_id}/ventajas       - Obtener ventajas de un mapa
POST   /api/mapas/{mapa_id}/armas     - Añadir arma a mapa
POST   /api/mapas/{mapa_id}/ventajas       - Añadir ventaja a mapa

EJEMPLO DE USO:

# Crear un mapa completo
POST /api/mapas/
{
    "nombre": "Kino der Toten",
    "imagen": "/images/kino.jpg",
    "descripcion": "Teatro abandonado en Berlín",
    "juegos": ["BO1", "BO3"],
    "dificultad": "Media",
    "armas": [
        {
            "arma": {
                "nombre": "MP40",
                "tipo": "smg",
                "daño": 3
            },
            "precio": 1000,
            "en_caja_misteriosa": false
        }
    ],
    "ventajas": [
        {
            "ventaja": {
                "nombre": "Juggernog",
                "efecto": "Más vida"
            },
            "precio": 2500
        }
    ]
}
"""