from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pathlib import Path
import shutil
import uuid

router = APIRouter(tags=["Imágenes"])

@router.post("/imagen-mapas")
async def subir_imagen(imagen: UploadFile = File(...), juego: str = Form(...), nombre: str = Form(...)):

    BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
    carpeta_imagenes = BASE_DIR / f"frontend/public/img/MAPAS/{juego.upper()}"
    carpeta_imagenes.mkdir(parents=True, exist_ok=True)

    extension = imagen.filename.split(".")[-1]
    nombre = nombre.replace(" ", "_")
    nombre_imagen = f"{nombre}.{extension}"
    ruta_completa = carpeta_imagenes / nombre_imagen

    # Guardar archivo
    with ruta_completa.open("wb") as buffer:
        shutil.copyfileobj(imagen.file, buffer)

    # Devuelve la ruta **relativa al frontend**
    return {
        "ruta": f"/img/mapas/{juego.upper()}/{nombre_imagen}",
        "mensaje": "Imagen subida exitosamente"
    }