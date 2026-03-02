# backend/Dockerfile
# Dockerfile para el backend FastAPI

# PASO 1: Usar imagen base oficial de Python
# python:3.11-slim es una versión ligera de Python 3.11
FROM python:3.11-slim

# PASO 2: Establecer el directorio de trabajo dentro del contenedor
# Todos los comandos siguientes se ejecutarán desde /app
WORKDIR /app

# PASO 3: Copiar el archivo de dependencias
# Copiamos requirements.txt primero para aprovechar la caché de Docker
# Si requirements.txt no cambia, Docker reutiliza esta capa
COPY requirements.txt .

# PASO 4: Instalar dependencias de Python
# --no-cache-dir reduce el tamaño de la imagen
# pip install -r lee todas las dependencias del archivo
RUN pip install --no-cache-dir -r requirements.txt

# PASO 5: Copiar todo el código del backend
# Esto copia el directorio 'app' con todos los archivos Python
COPY ./app ./app

# PASO 6: Exponer el puerto donde correrá FastAPI
# Render asignará este puerto automáticamente
EXPOSE 10000

# PASO 7: Comando para ejecutar la aplicación
# uvicorn es el servidor ASGI para FastAPI
# --host 0.0.0.0 permite conexiones desde cualquier IP
# --port 8000 define el puerto
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "10000"]

# OPTIMIZACIONES PARA PRODUCCIÓN:
# - Imagen slim (más ligera)
# - Sin cache de pip (menos espacio)
# - Puerto expuesto para Render
# - Host 0.0.0.0 para aceptar conexiones externas