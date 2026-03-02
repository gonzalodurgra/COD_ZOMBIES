from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pathlib import Path
import shutil

router = APIRouter(tags=["Imágenes"])

@router.post("/imagen-armas", response_model=dict)
async def subir_imagen_arma(
    imagen: UploadFile = File(...),
    juego: str = Form(...),
    nombre: str = Form(...)
):
    if not imagen.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")

    BASE_DIR = Path(__file__).resolve().parent.parent
    carpeta = BASE_DIR / f"img/{juego.upper()}"
    carpeta.mkdir(parents=True, exist_ok=True)

    extension = imagen.filename.split(".")[-1]
    nombre_limpio = nombre.replace(" ", "_")
    nombre_final = f"{nombre_limpio}.{extension}"

    ruta = carpeta / nombre_final

    with ruta.open("wb") as buffer:
        shutil.copyfileobj(imagen.file, buffer)

    return {
        "ruta": f"/img/{juego.upper()}/{nombre_final}"
    }