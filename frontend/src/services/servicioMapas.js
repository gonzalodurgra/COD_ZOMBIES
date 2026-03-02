// src/services/servicioMapas.js
// Servicio para manejar todas las peticiones a la API de mapas

const API_URL = process.env.REACT_APP_API_URL_MAPAS || 'http://localhost:8000/api/mapas';
const API_IMAGENES = process.env.REACT_APP_API_URL_IMAGEN_MAPAS || 'http://localhost:8000/api/imagen-mapas'

class ServicioMapas {

  // ========================================
  // OPERACIONES CRUD BÁSICAS
  // ========================================

  // MÉTODO GET: Obtener todos los mapas
  async obtenerMapas() {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener mapas:', error);
      throw error;
    }
  }

  // MÉTODO GET: Obtener un mapa por ID
  async obtenerMapaId(id) {
    try {
      const response = await fetch(`${API_URL}/${id}`);

      if (!response.ok) {
        throw new Error(`Mapa no encontrado: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error al obtener mapa ${id}:`, error);
      throw error;
    }
  }

  // MÉTODO GET: Filtrar mapas por dificultad
  async obtenerMapasDificultad(dificultad) {
    try {
      const response = await fetch(`${API_URL}/dificultad/${dificultad}`);

      if (!response.ok) {
        throw new Error(`Error al filtrar mapas: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error al filtrar mapas por dificultad ${dificultad}:`, error);
      throw error;
    }
  }

  // MÉTODO GET: Filtrar mapas por juego
  async obtenerMapasJuego(juego) {
    try {
      const response = await fetch(`${API_URL}/juegos/${juego}`);

      if (!response.ok) {
        throw new Error(`Error al filtrar mapas: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error al filtrar mapas por juego ${juego}:`, error);
      throw error;
    }
  }

  async subirImagenMapa(imagen, juego, nombre) {
    const formData = new FormData();
    formData.append("imagen", imagen);
    formData.append("juego", juego);
    formData.append("nombre", nombre);

    const response = await fetch(API_IMAGENES, {
      method: "POST",
      body: formData
    });

    const data = await response.json();
    console.log(data)
    return data.ruta;
  }

  // MÉTODO POST: Crear un nuevo mapa
  async crearMapa(mapaData) {
    /*
    mapData debe tener esta estructura:
    {
      nombre: "Kino der Toten",
      imagen: "/images/kino.jpg",
      descripcion: "Teatro abandonado...",
      juegos: ["BO1", "BO3"],
      dificultad: "Media",
      armas: [
        {
          arma: { name: "MP40", type: "smg", ... },
          precio: 1000,
          en_caja_misteriosa: false
        }
      ],
      ventajas: [
        {
          ventaja: { name: "Juggernog", ... },
          precio: 2500
        }
      ]
    }
    */
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapaData)
    });

    if (!response.ok) {
      const errorDetalle = await response.json();
      console.error("FastAPI dice:", errorDetalle); // ver el 422 detallado
      throw new Error(`Error ${response.status}`);  // sube el error al componente
    }

    return await response.json();
  }

  // MÉTODO PUT: Actualizar un mapa existente
  async actualizarMapa(id, mapaData) {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mapaData)
      });

      if (!response.ok) {
        throw new Error(`Error al actualizar mapa: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error al actualizar mapa ${id}:`, error);
      throw error;
    }
  }

  // MÉTODO DELETE: Eliminar un mapa
  async eliminarMapa(id) {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Error al eliminar mapa: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error(`Error al eliminar mapa ${id}:`, error);
      throw error;
    }
  }

  // ========================================
  // OPERACIONES ESPECÍFICAS DE MAPAS
  // ========================================

  // MÉTODO GET: Obtener solo las armas de un mapa
  async obtenerArmasMapa(mapaId) {
    try {
      const response = await fetch(`${API_URL}/${mapaId}/armas`);

      if (!response.ok) {
        throw new Error(`Error al obtener armas del mapa: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error al obtener armas del mapa ${mapaId}:`, error);
      throw error;
    }
  }

  // MÉTODO GET: Obtener solo las ventajas de un mapa
  async ObtenerVentajasMapa(mapaId) {
    try {
      const response = await fetch(`${API_URL}/${mapaId}/ventajas`);

      if (!response.ok) {
        throw new Error(`Error al obtener ventajas del mapa: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error al obtener ventajas del mapa ${mapaId}:`, error);
      throw error;
    }
  }

  // MÉTODO POST: Añadir un arma a un mapa
  async addArmaMapa(mapaId, armaData) {
    /*
    armaData debe tener esta estructura:
    {
      arma: { name: "MP40", type: "smg", damage: 3, ... },
      precio: 1000,
      en_caja_misteriosa: false
    }
    */
    try {
      const response = await fetch(`${API_URL}/${mapaId}/armas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(armaData)
      });

      if (!response.ok) {
        throw new Error(`Error al añadir arma al mapa: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error al añadir arma al mapa ${mapaId}:`, error);
      throw error;
    }
  }

  // MÉTODO POST: Añadir una ventaja a un mapa
  async addVentajaMapa(mapaId, ventajaData) {
    /*
    ventajaData debe tener esta estructura:
    {
      ventaja: { name: "Juggernog", effect: "Vida", ... },
      precio: 2500
    }
    */
    try {
      const response = await fetch(`${API_URL}/${mapaId}/ventajas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ventajaData)
      });

      if (!response.ok) {
        throw new Error(`Error al añadir ventaja al mapa: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error al añadir ventaja al mapa ${mapaId}:`, error);
      throw error;
    }
  }

  // ========================================
  // MÉTODOS HELPER
  // ========================================

  // Obtener mapas por rango de dificultad
  async obtenerMapasDificultadRango(dificultades) {
    /*
    dificultades: array de strings, ej: ["Baja", "Media"]
    */
    try {
      const mapas = await this.obtenerMapas();
      return mapas.filter(map => dificultades.includes(map.dificultad));
    } catch (error) {
      console.error('Error al filtrar mapas por rango de dificultad:', error);
      throw error;
    }
  }

  // Buscar mapas por nombre
  async buscarMapasNombre(busqueda) {
    try {
      const mapas = await this.obtenerMapas();
      return mapas.filter(map =>
        map.nombre.toLowerCase().includes(busqueda.toLowerCase())
      );
    } catch (error) {
      console.error('Error al buscar mapas:', error);
      throw error;
    }
  }

  // Obtener mapas que tienen un arma específica
  async buscarMapasArma(nombreArma) {
    try {
      const mapas = await this.obtenerMapas();
      return mapas.filter(map =>
        map.armas.some(a => a.arma.nombre === nombreArma)
      );
    } catch (error) {
      console.error('Error al buscar mapas con arma:', error);
      throw error;
    }
  }

  // Obtener mapas que tienen una ventaja específica
  async buscarMapasVentaja(nombreVentaja) {
    try {
      const mapas = await this.obtenerMapas();
      return mapas.filter(map =>
        map.ventajas.some(v => v.ventaja.nombre === nombreVentaja)
      );
    } catch (error) {
      console.error('Error al buscar mapas con perk:', error);
      throw error;
    }
  }

  // Calcular estadísticas de un mapa
  mapaStats(datosMapa) {
    return {
      totalArmas: datosMapa.armas.length,
      totalVentajas: datosMapa.ventajas.length,
      armasCaja: datosMapa.armas.filter(a => a.en_caja_misteriosa).length,
      armasParedIniciales: datosMapa.armas.filter(a => !a.en_caja_misteriosa).length,
      armaBarata: Math.min(...datosMapa.armas.map(a => a.precio)),
      armaCara: Math.max(...datosMapa.armas.map(a => a.precio)),
      costeVentajas: datosMapa.ventajas.reduce((sum, v) => sum + v.precio, 0)
    };
  }
}

// Exportar una instancia única del servicio
const mapsService = new ServicioMapas()
export default mapsService;

/*
EJEMPLOS DE USO EN UN COMPONENTE REACT:

import mapsService from '../services/mapsService';

// 1. Obtener todos los mapas
const maps = await mapsService.getAllMaps();

// 2. Filtrar por dificultad
const hardMaps = await mapsService.getMapsByDifficulty('Alta');

// 3. Filtrar por juego
const bo1Maps = await mapsService.getMapsByGame('BO1');

// 4. Crear un mapa nuevo
const newMap = await mapsService.createMap({
  nombre: "Der Riese",
  imagen: "/images/der_riese.jpg",
  descripcion: "Fábrica alemana",
  juegos: ["WaW", "BO1", "BO3"],
  dificultad: "Media-Alta",
  armas: [
    {
      arma: {
        name: "MP40",
        type: "smg",
        damage: 3,
        damage_percent: 60,
        description: "Subfusil alemán"
      },
      precio: 1000,
      en_caja_misteriosa: false
    }
  ],
  ventajas: [
    {
      ventaja: {
        name: "Juggernog",
        cost: "2500",
        effect: "Más vida",
        description: "Aumenta resistencia"
      },
      precio: 2500
    }
  ]
});

// 5. Obtener armas de un mapa
const weapons = await mapsService.getMapWeapons(mapId);

// 6. Buscar mapas por nombre
const searchResults = await mapsService.searchMapsByName('kino');

// 7. Ver estadísticas de un mapa
const stats = mapsService.getMapStats(mapData);
console.log(stats);
// {
//   totalWeapons: 15,
//   totalPerks: 6,
//   weaponsInMysteryBox: 10,
//   wallWeapons: 5,
//   cheapestWeapon: 500,
//   mostExpensiveWeapon: 3000,
//   totalPerksCost: 15000
// }
*/