# routes/armas.py
# Este archivo define todas las rutas (endpoints) para manejar las armas

from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from bson import ObjectId
from app.models import ArmaDB, Arma
from app.database import get_database
import shutil
from pathlib import Path

# PASO 1: Crear el router para las armas
# El prefijo "/weapons" significa que todas las rutas empezarán con /api/weapons
router = APIRouter(prefix="/armas", tags=["Armas"])

# PASO 2: Helper para convertir ObjectId a string
def arma_helper(arma) -> Optional[dict]:
    """
    MongoDB devuelve el _id como ObjectId, pero JSON necesita strings.
    Esta función convierte el documento de MongoDB a un diccionario Python limpio.
    """
    if not arma:
        return None
    
    resultado = {
        "id": str(arma["_id"]),
        "nombre": arma.get("nombre", ""),
        "tipo": arma.get("tipo", ""),
        "imagen": arma.get("imagen", ""),
        "daño": arma.get("daño", 0),
        "multiplicadores": arma.get("multiplicadores", {}),
        "cargador": arma.get("cargador", 0),
        "reserva": arma.get("reserva", 0),
        "cadencia": arma.get("cadencia", 0),
        "recarga": arma.get("recarga", 0),
        "descripcion": arma.get("descripcion", ""),
        "juego": arma.get("juego", "WAW"),
        "papNombre": arma.get("papNombre", None),
        "papDaño": arma.get("papDaño", None),
        "papMultiplicadores": arma.get("papMultiplicadores", None),
        "papCargador": arma.get("papCargador", None),
        "papReserva": arma.get("papReserva", None),
        "papCadencia": arma.get("papCadencia", None),
        "papRecarga": arma.get("papRecarga", None)
    }
    
    # DEBUG
    print("🔄 arma_helper resultado:")
    print(resultado)
    
    return resultado

# PASO 3: GET - Obtener todas las armas
@router.get("/", response_model=List[dict])
async def obtener_todas_armas():
    """
    Ruta: GET /api/armas/
    Retorna una lista con todas las armas en la base de datos.
    """
    # Obtener la base de datos
    db = get_database()
    
    # Buscar todas las armas en la colección "weapons"
    # .find({}) significa "buscar todo sin filtros"
    armas = []
    async for arma in db["armas"].find({}):
        armas.append(arma_helper(arma))
    
    return armas

# PASO 4: GET - Obtener una arma por ID
@router.get("/{arma_id}", response_model=dict)
async def obtener_arma_id(arma_id: str):
    """
    Ruta: GET /api/armas/{arma_id}
    Retorna una arma específica buscándola por su ID.
    Ejemplo: GET /api/armas/507f1f77bcf86cd799439011
    """
    db = get_database()
    
    # Buscar el arma por su _id
    arma = await db["armas"].find_one({"_id": ObjectId(arma_id)})
    
    # Si no existe, retornar error 404
    if not arma:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Arma con ID {arma_id} no encontrada"
        )
    
    return arma_helper(arma)

# PASO 5: GET - Filtrar armas por tipo
@router.get("/tipo/{arma_tipo}", response_model=List[dict])
async def obtener_armas_tipo(arma_tipo: str):
    """
    Ruta: GET /api/armas/tipo/{arma_tipo}
    Filtra armas por tipo (fusil de asalto, subfusil, etc.)
    Ejemplo: GET /api/armas/tipo/subfusil
    """
    db = get_database()
    
    # Buscar armas que coincidan con el tipo
    armas = []
    async for arma in db["weapons"].find({"tipo": arma_tipo.replace(" ", "_")}):
        armas.append(arma_helper(arma))
    
    return armas

# PASO 6: POST - Crear una nueva arma
@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def crear_arma(arma: ArmaDB):
    """
    Ruta: POST /api/armas/
    Crea una nueva arma en la base de datos.
    """
    db = get_database()
    
    # Convertir el modelo Pydantic a diccionario
    arma_dict = arma.model_dump(by_alias=True, exclude={"id"})
    
    # DEBUG: Ver qué se va a guardar
    print("=" * 50)
    print("📝 Datos a guardar en MongoDB:")
    print(arma_dict)
    print("=" * 50)
    
    # Insertar en MongoDB
    result = await db["armas"].insert_one(arma_dict)
    
    print(f"✅ Arma guardada con ID: {result.inserted_id}")
    
    # Obtener el arma recién creada
    nueva_arma = await db["armas"].find_one({"_id": result.inserted_id})
    
    print("📤 Arma que se devolverá:")
    print(nueva_arma)
    
    return arma_helper(nueva_arma)

# PASO 7: PUT - Actualizar un arma existente
@router.put("/{arma_id}", response_model=dict)
async def actualizar_arma(arma_id: str, arma_actualizar: Arma):
    """
    Ruta: PUT /api/weapons/{weapon_id}
    Actualiza los datos de un arma existente.
    Solo se actualizan los campos que se envíen en el body.
    """
    db = get_database()
    
    # Crear diccionario solo con los campos que no son None
    datos_actualizar = {k: v for k, v in arma_actualizar.model_dump().items() if v is not None}
    
    # Si no hay datos para actualizar, retornar error
    if not datos_actualizar:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay datos para actualizar"
        )
    
    # Actualizar el documento en MongoDB
    result = await db["armas"].update_one(
        {"_id": ObjectId(arma_id)},
        {"$set": datos_actualizar}
    )
    
    # Verificar si se encontró el documento
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Arma con ID {arma_id} no encontrada"
        )
    
    # Obtener el arma actualizada
    updated_weapon = await db["armas"].find_one({"_id": ObjectId(arma_id)})
    
    return arma_helper(updated_weapon)

# PASO 8: DELETE - Eliminar un arma
@router.delete("/{arma_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_arma(arma_id: str):
    """
    Ruta: DELETE /api/armas/{arma_id}
    Elimina un arma de la base de datos.
    Retorna 204 No Content si se elimina correctamente.
    """
    db = get_database()
    
    # Eliminar el documento
    result = await db["armas"].delete_one({"_id": ObjectId(arma_id)})
    
    # Verificar si se encontró y eliminó
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Arma con ID {arma_id} no encontrada"
        )
    
    # 204 No Content no retorna nada
    return None