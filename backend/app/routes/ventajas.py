# routes/ventajas.py
# Rutas para manejar las ventajas (ventajas)

from fastapi import APIRouter, HTTPException, status
from typing import List
from bson import ObjectId
from ..models import Ventaja, VentajaDB
from ..database import get_database

router = APIRouter(prefix="/ventajas", tags=["Ventajas"])

def ventaja_helper(ventaja) -> dict:
    """Convierte un documento de MongoDB a diccionario JSON"""
    return {
        "id": str(ventaja["_id"]),
        "imagen": ventaja["imagen"],
        "nombre": ventaja["nombre"],
        "precio": ventaja["precio"],
        "efecto": ventaja["efecto"],
        "juegos": ventaja["juegos"],
    }

@router.get("/", response_model=List[dict])
async def obtener_todas_ventajas():
    """Obtener todas las ventajas"""
    db = get_database()
    ventajas = []
    async for ventaja in db["ventajas"].find({}):
        ventajas.append(ventaja_helper(ventaja))
    return ventajas

@router.get("/{ventaja_id}", response_model=dict)
async def obtener_ventaja_id(ventaja_id: str):
    """Obtener una ventaja por ID"""
    db = get_database()
    ventaja = await db["ventajas"].find_one({"_id": ObjectId(ventaja_id)})
    if not ventaja:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ventaja con ID {ventaja_id} no encontrado"
        )
    return ventaja_helper(ventaja)

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def crear_ventaja(ventaja: VentajaDB):
    """Crear una nueva ventaja"""
    db = get_database()
    ventaja_dict = ventaja.model_dump(by_alias=True, exclude={"id"})
    result = await db["ventajas"].insert_one(ventaja_dict)
    nueva_ventaja = await db["ventajas"].find_one({"_id": result.inserted_id})
    return ventaja_helper(nueva_ventaja)

@router.put("/{ventaja_id}", response_model=dict)
async def actualizar_ventaja(ventaja_id: str, ventaja_actualizar: Ventaja):
    """Actualizar una ventaja existente"""
    db = get_database()
    datos_actualizar = {k: v for k, v in ventaja_actualizar.model_dump().items() if v is not None}
    
    if not datos_actualizar:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay datos para actualizar"
        )
    
    result = await db["ventajas"].update_one(
        {"_id": ObjectId(ventaja_id)},
        {"$set": datos_actualizar}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ventaja con ID {ventaja_id} no encontrado"
        )
    
    ventaja_actualizada = await db["ventajas"].find_one({"_id": ObjectId(ventaja_id)})
    return ventaja_helper(ventaja_actualizada)

@router.delete("/{ventaja_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_ventaja(ventaja_id: str):
    """Eliminar una ventaja"""
    db = get_database()
    result = await db["ventajas"].delete_one({"_id": ObjectId(ventaja_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ventaja con ID {ventaja_id} no encontrado"
        )
    
    return None