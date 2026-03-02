from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pathlib import Path
import shutil

router = APIRouter(tags=["Imágenes"])

@router.post("/imagen-ventajas")
async def subir_imagen_ventaja(
    imagen: UploadFile = File(...),
    nombre: str = Form(...)
):
    BASE_DIR = Path(__file__).resolve().parent.parent
    carpeta_imagenes = BASE_DIR / f"img/VENTAJAS"
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
        "ruta": f"/img/VENTAJAS/{nombre_imagen}",
        "mensaje": "Imagen subida exitosamente"
    }