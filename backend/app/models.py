from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional
from typing import Literal
from bson import ObjectId


class Arma(BaseModel):
    """
        Define todo el arma excepto el id recogido en la base de datos
    """
    nombre: str = Field(..., description="Nombre del arma")
    tipo: str = Field(..., description="Tipo: assault, smg, lmg, sniper, wonder")
    imagen: str = Field(..., description="Imagen del arma")
    daño: int = Field(..., ge=0, description="Daño de 1 a 5 estrellas")
    multiplicadores: dict[str, float] = Field(..., description="Diferentes multiplicadores de partes del cuerpo")
    cargador: int = Field(..., ge=1, description="Tamaño del cargador")
    reserva: int = Field(..., ge=0, description="Munición en la recámara")
    cadencia: float = Field(..., ge=0, description="Cadencia de disparo en balas por minuto")
    recarga: Optional[float] = Field(..., description="Tiempo de recarga del arma en segundos")
    descripcion: str = Field(..., description="Descripción corta del arma")
    juego: Literal["WAW", "BO1", "BO2", "BO3", "BO4"] = Field(..., description="Juego en el que aparece el arma")
    papNombre: Optional[str] = Field(None, description="Nombre del arma tras el Pack-a-Punch")
    papDaño: Optional[int] = Field(None, ge=0, description="Daño mejorado")
    papMultiplicadores: Optional[dict[str, float]] = Field(None, description="Multiplicadores mejorados")
    papCargador: Optional[int] = Field(None, ge=1, description="Cargador mejorado")
    papReserva: Optional[int] = Field(None, ge=0, description="Reserva mejorada")
    papCadencia: Optional[float] = Field(None, ge=0, description="Cadencia mejorada")
    papRecarga: Optional[float] = Field(None, description="Recarga mejorada en segundos")
    # mapas: dict[str, tuple[int, bool]] = Field(default=[], description="Lista de mapas donde aparece, junto a su precio")

class ArmaDB(Arma):
    """
    Define cómo debe verse un arma en la base de datos.
    Cada campo tiene un tipo de dato y puede ser opcional.
    """
    id: Optional[str] = Field(default=None, alias="_id")
    
    class Config:
        """
            Permite el uso de id en MongoDB como _id
        """
        populate_by_name = True
        
class Ventaja(BaseModel):
    """
        Define toda la ventaja excepto el id recogido en la base de datos
    """
    imagen: str = Field(..., description="Imagen de la ventaja")
    nombre: str = Field(..., description="Nombre de la ventaja")
    precio: int = Field(..., ge=500, description="Puntos que cuesta recibir la ventaja")
    efecto: str = Field(..., description="Descripción corta de lo que hace la ventaja")
    juegos : list[Literal["WAW", "BO1", "BO2", "BO3", "BO4"]] = Field(..., description="Juego en el que aparece la ventaja")
    # mapas: list[str] = Field(default=[], description="Lista de mapas donde aparece, junto a su precio")

class VentajaDB(Ventaja):
    """
    Define cómo debe verse una ventaja en la base de datos.
    Cada campo tiene un tipo de dato y puede ser opcional.
    """
    id: Optional[str] = Field(default=None, alias="_id")
    
    class Config:
        """
            Permite el uso de id en MongoDB como _id
        """
        populate_by_name = True
    
    class Config:
        json_schema_extra = {
            "example": {
                "arma": {
                    "nombre": "MP40",
                    "tipo": "smg",
                    "daño": 3,
                    "descripcion": "Subfusil alemán"
                },
                "precio": 1000,
                "en_caja_misteriosa": False
            }
        }

class VentajaEnMapa(BaseModel):
    """
    Representa una ventaja dentro de un mapa con su precio.
    """
    ventaja: dict = Field(..., description="Datos completos de la ventaja")
    precio: int = Field(..., description="Precio de la ventaja en el mapa")
    
    class Config:
        json_schema_extra = {
            "example": {
                "ventaja": {
                    "nombre": "Juggernog",
                    "efecto": "Más vida",
                    "descripcion": "Aumenta resistencia"
                },
                "precio": 2500
            }
        }

class Mapa(BaseModel):
    """
        Define todo el mapa menos su id de la base de datos
    """
    nombre: str = Field(..., description="Nombre del mapa")
    imagen: str = Field(..., description="Ruta de imagen del mapa")
    descripcion: str = Field(..., description="Descripción corta del mapa")
    juego: Literal["WAW", "BO1", "BO2", "BO3", "BO4"] = Field(..., description="Juego donde aparece el mapa")
    dificultad: str = Field(..., description="Dificultad de jugabilidad del mapa")
    armas: list[ArmaEnMapa] = Field(..., description="Armas del mapa con precio y aparición en la caja misteriosa, pared o inicial")
    ventajas: list[VentajaEnMapa] = Field(..., description="Ventajas que aparecen en el mapa con precio")

class MapaDB(Mapa):
    """
    Define cómo debe verse el mapa en la base de datos.
    Cada campo tiene un tipo de dato y puede ser opcional.
    """
    id: Optional[str] = Field(default=None, alias="_id")
    
    class Config:
        """
            Permite el uso de id en MongoDB como _id
        """
        populate_by_name = True
        
class MapaUpdate(BaseModel):
    """
    Modelo para actualizar mapas (todos los campos opcionales)
    """
    nombre: Optional[str] = None
    imagen: Optional[str] = None
    descripcion: Optional[str] = None
    juego: Optional[Literal["WAW", "BO1", "BO2", "BO3", "BO4"]] = None
    dificultad: Optional[str] = None
    armas: Optional[list[ArmaEnMapa]] = None
    ventajas: Optional[list[VentajaEnMapa]] = None

class ArmaEnMapa(BaseModel):
    arma: dict
    precio: int
    enCaja: Literal["pared", "caja", "inicial"]

# ====================================================================
# MODELOS DE USUARIO
# ====================================================================

class Usuario(BaseModel):
    """Modelo para crear un usuario nuevo"""
    email: EmailStr
    nombre_completo: str
    password: str
    username: str

class UsuarioDB(BaseModel):
    """Modelo de usuario en la base de datos (sin password)"""
    id: Optional[str] = Field(None, alias="_id")
    email: EmailStr
    nombre_completo: str
    es_admin: bool = False
    activo: bool = True
    fecha_registro: Optional[str] = None
    @field_validator("id", mode="before")
    def convertir_objectid(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        return v
    class Config:
        populate_by_name = True

class UsuarioEnDB(BaseModel):
    """Modelo de usuario en la base de datos (con password hasheado)"""
    id: Optional[str] = Field(None, alias="_id")
    email: EmailStr
    nombre_completo: str
    hashed_password: str
    es_admin: bool = False
    activo: bool = True
    fecha_registro: Optional[str] = None
    username: str
    @field_validator("id", mode="before")
    def convertir_objectid(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        return v

    class Config:
        populate_by_name = True

# ====================================================================
# MODELOS DE AUTENTICACIÓN
# ====================================================================

class Token(BaseModel):
    """Modelo para el token JWT"""
    access_token: str
    token_type: str
    username: str  # Info del usuario logueado
    es_admin: bool

class TokenData(BaseModel):
    """Datos almacenados en el token JWT"""
    username: Optional[str] = None

class LoginRequest(BaseModel):
    """Modelo para la solicitud de login"""
    username: str
    password: str
        