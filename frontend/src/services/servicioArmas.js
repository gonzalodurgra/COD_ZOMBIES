// src/services/servicioArmas.js
// Servicio para manejar todas las peticiones a la API de armas

// PASO 1: Configurar la URL base de la API
// En desarrollo: usa la variable de entorno o localhost
// En producción: Render configurará automáticamente la URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/armas';
const API_IMAGENES = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/imagen-armas'

// PASO 2: Clase para manejar todas las operaciones de armas
class ServicioArmas {

  // MÉTODO GET: Obtener todas las armas
  async obtenerArmas() {
    /*
    fetch() es la función nativa de JavaScript para hacer peticiones HTTP
    - Retorna una Promise (promesa)
    - await espera a que la promesa se resuelva
    - .json() convierte la respuesta a formato JSON
    */
    try {
      const response = await fetch(API_URL);

      // Verificar si la respuesta es exitosa (status 200-299)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener armas:', error);
      throw error; // Re-lanzar el error para manejarlo en el componente
    }
  }

  // MÉTODO GET: Obtener una arma por ID
  async obtenerArmaId(id) {
    try {
      const response = await fetch(`${API_URL}/${id}`);

      if (!response.ok) {
        throw new Error(`Arma no encontrada: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error al obtener arma ${id}:`, error);
      throw error;
    }
  }

  // MÉTODO GET: Filtrar armas por tipo
  async obtenerArmasTipo(tipo) {
    try {
      const response = await fetch(`${API_URL}/tipo/${tipo}`);

      if (!response.ok) {
        throw new Error(`Error al filtrar armas: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error al filtrar armas por tipo ${tipo}:`, error);
      throw error;
    }
  }

  // En tu archivo armaService.js

  async subirImagen(imagenFile, juego, nombre) {
    /*
    Sube una imagen al backend
    - No usa JSON, sino FormData para enviar archivos
    - FormData permite enviar archivos binarios
    - El navegador automáticamente pone el Content-Type correcto
    */
    try {
      // Crear FormData para enviar archivos
      const formData = new FormData();
      formData.append('imagen', imagenFile);  // El archivo
      formData.append('juego', juego);        // El juego (WAW, BO1, etc.)
      formData.append('nombre', nombre);        // El juego (WAW, BO1, etc.)

      const response = await fetch(`${API_IMAGENES}`, {
        method: 'POST',
        // NO ponemos Content-Type aquí, fetch lo hace automáticamente para FormData
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Error al subir imagen: ${response.status}`);
      }

      const data = await response.json();
      return data; // Devuelve { ruta: "/img/WAW/uuid.jpg", mensaje: "..." }
    } catch (error) {
      console.error('Error al subir imagen:', error);
      throw error;
    }
  }

  async crearArma(armaData) {
    /*
    POST envía datos al servidor para crear un nuevo recurso
    - method: 'POST' indica que es una creación
    - headers: especifica que enviamos JSON
    - body: los datos convertidos a string JSON
    */
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(armaData)
      });

      if (!response.ok) {
        throw new Error(`Error al crear arma: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al crear arma:', error);
      throw error;
    }
  }

  // MÉTODO PUT: Actualizar una arma existente
  async actualizarArma(id, armaData) {
    /*
    PUT actualiza un recurso existente
    - Similar a POST pero para actualizaciones
    */
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(armaData)
      });

      if (!response.ok) {
        throw new Error(`Error al actualizar arma: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error al actualizar arma ${id}:`, error);
      throw error;
    }
  }

  // MÉTODO DELETE: Eliminar un arma
  async eliminarArma(id) {
    /*
    DELETE elimina un recurso
    - No necesita body
    - Retorna 204 No Content si es exitoso
    */
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Error al eliminar arma: ${response.status}`);
      }

      // 204 No Content no tiene body
      return true;
    } catch (error) {
      console.error(`Error al eliminar arma ${id}:`, error);
      throw error;
    }
  }
}

// PASO 3: Exportar una instancia única del servicio (Singleton)
// Esto evita crear múltiples instancias del servicio
const weaponService = new ServicioArmas()
export default weaponService;

/*
CÓMO USAR ESTE SERVICIO EN UN COMPONENTE REACT:

1. Importar el servicio:
   import weaponsService from '../services/weaponsService';

2. Usar en una función async:
   const weapons = await weaponsService.getAllWeapons();

3. O con .then():
   weaponsService.getAllWeapons()
     .then(weapons => console.log(weapons))
     .catch(error => console.error(error));

4. Con useEffect (recomendado):
   useEffect(() => {
     weaponsService.getAllWeapons()
       .then(setWeapons)
       .catch(setError);
   }, []);
*/