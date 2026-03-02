from fastapi import APIRouter, Depends, HTTPException, status
from datetime import timedelta, datetime
from app.models import Usuario, UsuarioDB, UsuarioEnDB, Token, LoginRequest, TokenData
from passlib.hash import argon2
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.database import get_database
import os
from dotenv import load_dotenv

# ====================================================================
# CONFIGURACIÓN
# ====================================================================

# IMPORTANTE: En producción, usa una clave secreta segura y guárdala en variables de entorno
load_dotenv()
SECRET_KEY =  os.getenv("SECRET_KEY") # Cámbiala!
ALGORITHM = os.getenv("JWT_ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # El token expira en 30 minutos

# ====================================================================
# PASO 1: Configurar el contexto de encriptación
# ====================================================================
# EXPLICACIÓN: CryptContext usa bcrypt para hashear contraseñas
# bcrypt es un algoritmo muy seguro que hace que sea prácticamente
# imposible descifrar las contraseñas

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# ====================================================================
# PASO 2: Configurar OAuth2
# ====================================================================
# EXPLICACIÓN: oauth2_scheme extrae el token del header "Authorization"
# El cliente enviará: Authorization: Bearer <token>

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# ====================================================================
# FUNCIONES DE CONTRASEÑAS
# ====================================================================

def verificar_password(password_plano: str, hashed_password: str) -> bool:
    """
    Verifica si una contraseña en texto plano coincide con el hash.
    
    Args:
        password_plano: La contraseña que el usuario escribe
        hashed_password: El hash guardado en la base de datos
        
    Returns:
        True si coinciden, False si no
    """
    return pwd_context.verify(password_plano, hashed_password)

#def hash_password(password: str) -> str:
    """
    Convierte una contraseña en texto plano a un hash seguro.
    
    Args:
        password: Contraseña en texto plano
        
    Returns:
        Hash de la contraseña (string largo y aleatorio)
    """
    #return pwd_context.hash(password)

# ====================================================================
# FUNCIONES DE JWT (TOKENS)
# ====================================================================

def crear_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    print("SECRET_KEY:", os.getenv("SECRET_KEY"))
    print("JWT_ALGORITHM:", os.getenv("JWT_ALGORITHM"))
    """
    Crea un token JWT con los datos del usuario.
    
    Args:
        data: Diccionario con los datos a incluir en el token (ej: username)
        expires_delta: Tiempo hasta que expire el token
        
    Returns:
        String con el token JWT
    """
    # Copiar los datos para no modificar el original
    to_encode = data.copy()
    
    # Calcular la fecha de expiración
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    # Añadir la fecha de expiración al token
    to_encode.update({"exp": expire})
    
    # Crear el token JWT
    encoded_jwt = jwt.encode(to_encode, os.getenv("SECRET_KEY"), algorithm=os.getenv("JWT_ALGORITHM"))
    return encoded_jwt

# ====================================================================
# FUNCIONES DE BASE DE DATOS
# ====================================================================

async def obtener_usuario(username: str) -> Optional[UsuarioEnDB]:
    """
    Busca un usuario en la base de datos por su username.
    
    Args:
        username: Nombre de usuario
        
    Returns:
        Usuario si existe, None si no
    """
    db = get_database()
    usuario_dict = await db["users"].find_one({"username": username})
    if usuario_dict:
        usuario_dict.pop("id", None)  # ← elimina el campo id: null duplicado
        return UsuarioEnDB(**usuario_dict)
    return None

async def autenticar_usuario(username: str, password: str) -> Optional[UsuarioEnDB]:
    """
    Verifica que el usuario y contraseña sean correctos.
    
    Args:
        username: Nombre de usuario
        password: Contraseña en texto plano
        
    Returns:
        Usuario si las credenciales son correctas, None si no
    """
    usuario = await obtener_usuario(username)
    
    if not usuario:
        return None
    
    if not verificar_password(password, usuario.hashed_password):
        return None
    
    return usuario

# ====================================================================
# DEPENDENCIAS DE FASTAPI
# ====================================================================

async def obtener_usuario_actual(token: str = Depends(oauth2_scheme)) -> UsuarioEnDB:
    """
    Extrae y valida el usuario actual desde el token JWT.
    Esta función se usa como dependencia en las rutas protegidas.
    
    Args:
        token: Token JWT extraído del header Authorization
        
    Returns:
        Usuario actual
        
    Raises:
        HTTPException si el token es inválido o expiró
    """
    # Definir la excepción para credenciales inválidas
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decodificar el token JWT
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        
        if username is None:
            raise credentials_exception
        
        token_data = TokenData(username=username)
        
    except JWTError:
        raise credentials_exception
    
    # Buscar el usuario en la base de datos
    usuario = await obtener_usuario(username=token_data.username)
    
    if usuario is None:
        raise credentials_exception
    
    return usuario

async def obtener_usuario_activo_actual(
    usuario_actual: UsuarioEnDB = Depends(obtener_usuario_actual)
) -> UsuarioEnDB:
    """
    Verifica que el usuario actual esté activo (no deshabilitado).
    
    Args:
        usuario_actual: Usuario obtenido del token
        
    Returns:
        Usuario si está activo
        
    Raises:
        HTTPException si el usuario está deshabilitado
    """
    if not usuario_actual.activo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario deshabilitado"
        )
    
    return usuario_actual

# ====================================================================
# CREAR EL ROUTER
# ====================================================================
# EXPLICACIÓN: APIRouter agrupa rutas relacionadas
# Todas las rutas aquí empezarán con /auth

router = APIRouter(
    prefix="/auth",
    tags=["Autenticación"]
)

# ====================================================================
# RUTA 1: REGISTRAR USUARIO
# ====================================================================

@router.post("/register", response_model=UsuarioDB, status_code=status.HTTP_201_CREATED)
async def registrar_usuario(usuario: Usuario):
    """
    Registra un nuevo usuario en el sistema.
    
    Proceso:
    1. Verifica que el username no exista
    2. Verifica que el email no exista
    3. Hashea la contraseña
    4. Guarda el usuario en la base de datos
    
    Args:
        usuario: Datos del nuevo usuario
        
    Returns:
        Datos del usuario creado (sin contraseña)
    """
    db = get_database()
    users_collection = db["users"]
    
    # PASO 1: Verificar si el username ya existe
    usuario_existente = await users_collection.find_one({"username": usuario.username})
    if usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario ya está en uso"
        )
    
    # PASO 2: Verificar si el email ya existe
    email_existente = await users_collection.find_one({"email": usuario.email})
    if email_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    # PASO 3: Crear el usuario con la contraseña hasheada
    usuario_db = UsuarioEnDB(
        username=usuario.username,
        email=usuario.email,
        nombre_completo=usuario.nombre_completo,
        hashed_password=argon2.hash(usuario.password),  # Hashear la contraseña
        activo=True,
        fecha_registro=datetime.now().isoformat()
    )
    
    # PASO 4: Guardar en la base de datos
    usuario_dict = usuario_db.model_dump(exclude={"id"})
    await users_collection.insert_one(usuario_dict)
    
    # PASO 5: Devolver los datos del usuario (sin la contraseña)
    return UsuarioDB(
        username=usuario_db.username,
        email=usuario_db.email,
        nombre_completo=usuario_db.nombre_completo,
        activo=usuario_db.activo,
        fecha_registro=usuario_db.fecha_registro
    )

# ====================================================================
# RUTA 2: LOGIN
# ====================================================================

@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest):
    """
    Inicia sesión y devuelve un token JWT.
    
    Proceso:
    1. Verifica que el usuario y contraseña sean correctos
    2. Crea un token JWT
    3. Devuelve el token
    
    Args:
        login_data: Username y password
        
    Returns:
        Token JWT de acceso
    """
    # PASO 1: Autenticar al usuario
    usuario = await autenticar_usuario(login_data.username, login_data.password)
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # PASO 2: Crear el token JWT
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = crear_access_token(
        data={"sub": usuario.username},
        expires_delta=access_token_expires
    )
    
    # PASO 3: Devolver el token
    return Token(
        access_token=access_token,
        token_type="bearer",
        username=usuario.username,
        es_admin=usuario.es_admin
    )

# ====================================================================
# RUTA 3: OBTENER PERFIL DEL USUARIO ACTUAL
# ====================================================================

@router.get("/me", response_model=UsuarioDB)
async def obtener_perfil(
    usuario_actual: UsuarioEnDB = Depends(obtener_usuario_activo_actual)
):
    """
    Obtiene el perfil del usuario que está autenticado.
    
    Esta ruta está PROTEGIDA: solo funciona si envías un token válido.
    
    Args:
        usuario_actual: Usuario extraído del token JWT (automático)
        
    Returns:
        Datos del usuario actual
    """
    return UsuarioDB(
        username=usuario_actual.username,
        email=usuario_actual.email,
        nombre_completo=usuario_actual.nombre_completo,
        activo=usuario_actual.activo,
        fecha_registro=usuario_actual.fecha_registro,
        es_admin=usuario_actual.es_admin
    )