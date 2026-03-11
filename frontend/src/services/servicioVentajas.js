// src/services/perksService.js
// Servicio para manejar todas las peticiones a la API de ventajas (perks)

const BASE = process.env.REACT_APP_API_BASE;
const API_URL = `${BASE}/api/ventajas`;
const API_IMAGENES = `${BASE}/api/imagen-ventajas`

class ServicioVentajas {

    // ========================================
    // OPERACIONES CRUD BÁSICAS
    // ========================================

    // MÉTODO GET: Obtener todas las ventajas
    async obtenerVentajas() {
        /*
        Obtiene todas las ventajas de la base de datos.
        Retorna un array de objetos perk.
        */
        try {
            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al obtener ventajas:', error);
            throw error;
        }
    }

    // MÉTODO GET: Obtener una ventaja por ID
    async obtenerVentajaId(id) {
        /*
        Obtiene una ventaja específica por su ID.
        
        Parámetros:
        - id: string - ID de la ventaja en MongoDB
        
        Retorna: objeto perk
        */
        try {
            const response = await fetch(`${API_URL}/${id}`);

            if (!response.ok) {
                throw new Error(`Perk no encontrado: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Error al obtener perk ${id}:`, error);
            throw error;
        }
    }

    // MÉTODO GET: Filtrar perks por juego
    async obtenerPerksJuego(juego) {
        /*
        Filtra ventajas que aparecen en un juego específico.
        
        Parámetros:
        - juego: string - Nombre del juego (WAW, BO1, BO2, BO3, BO4)
        
        Retorna: array de perks que aparecen en ese juego
        */
        try {
            const response = await fetch(`${API_URL}/juego/${juego}`);

            if (!response.ok) {
                throw new Error(`Error al filtrar ventajas: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Error al filtrar ventajas por juego ${juego}:`, error);
            throw error;
        }
    }

    // MÉTODO GET: Filtrar perks por rango de coste
    async obtenerVentajasCoste(minCost, maxCost) {
        /*
        Filtra ventajas por rango de precio.
        
        Parámetros:
        - minCost: number - Precio mínimo
        - maxCost: number - Precio máximo
        
        Retorna: array de perks en ese rango de precio
        */
        try {
            const response = await fetch(`${API_URL}/coste-rango?min=${minCost}&max=${maxCost}`);

            if (!response.ok) {
                throw new Error(`Error al filtrar ventajas por coste: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Error al filtrar ventajas por coste:`, error);
            throw error;
        }
    }

    async subirImagenVentaja(imagen, nombre) {
        const formData = new FormData();
        formData.append("imagen", imagen);
        formData.append("nombre", nombre);

        const response = await fetch(API_IMAGENES, {
            method: "POST",
            body: formData
        });

        const data = await response.json();
        console.log(data)
        return data.ruta;
    }

    // MÉTODO POST: Crear una nueva ventaja
    async crearVentaja(perkData) {
        /*
        Crea una nueva ventaja en la base de datos.
        
        Parámetros:
        - perkData: objeto con la estructura:
          {
            nombre: string,
            coste: string,
            efecto: string,
            descripcion: string,
            juegos: array[string]
          }
        
        Retorna: objeto perk creado con su ID
        */
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(perkData)
            });

            if (!response.ok) {
                throw new Error(`Error al crear ventaja: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al crear ventaja:', error);
            throw error;
        }
    }

    // MÉTODO PUT: Actualizar una ventaja existente
    async actualizarVentaja(id, ventajaData) {
        /*
        Actualiza los datos de una ventaja existente.
        
        Parámetros:
        - id: string - ID del perk a actualizar
        - perkData: objeto con los campos a actualizar
        
        Nota: Solo se actualizan los campos que se envíen
        
        Retorna: objeto perk actualizado
        */
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ventajaData)
            });

            if (!response.ok) {
                throw new Error(`Error al actualizar ventaja: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Error al actualizar ventaja ${id}:`, error);
            throw error;
        }
    }

    // MÉTODO DELETE: Eliminar una ventaja
    async eliminarVentaja(id) {
        /*
        Elimina una ventaja de la base de datos.
        
        Parámetros:
        - id: string - ID del perk a eliminar
        
        Retorna: true si se eliminó correctamente
        */
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`Error al eliminar ventaja: ${response.status}`);
            }

            return true;
        } catch (error) {
            console.error(`Error al eliminar ventaja ${id}:`, error);
            throw error;
        }
    }

    // ========================================
    // MÉTODOS HELPER Y UTILIDADES
    // ========================================

    // Buscar perks por nombre
    async buscarVentajaNombre(busqueda) {
        /*
        Busca ventajas cuyo nombre contenga el término de búsqueda.
        No distingue entre mayúsculas y minúsculas.
        
        Parámetros:
        - searchTerm: string - Término a buscar
        
        Retorna: array de perks que coinciden
        */
        try {
            const ventajas = await this.obtenerVentajas();
            return ventajas.filter(perk =>
                perk.nombre.toLowerCase().includes(busqueda.toLowerCase())
            );
        } catch (error) {
            console.error('Error al buscar ventajas:', error);
            throw error;
        }
    }

    // Obtener perks por efecto
    async buscarVentajasEfecto(efecto) {
        /*
        Busca ventajas por su efecto principal.
        
        Parámetros:
        - efecto: string - Efecto a buscar (ej: "Vida aumentada")
        
        Retorna: array de perks con ese efecto
        */
        try {
            const ventajas = await this.obtenerVentajas();
            return ventajas.filter(perk =>
                perk.efecto.toLowerCase().includes(efecto.toLowerCase())
            );
        } catch (error) {
            console.error('Error al buscar ventajas por efecto:', error);
            throw error;
        }
    }

    // Obtener perks más caros
    async obtenerVentajasCaras(limit = 5) {
        /*
        Obtiene las ventajas más caras ordenadas por precio.
        
        Parámetros:
        - limit: number - Cantidad de perks a retornar (default: 5)
        
        Retorna: array de los perks más caros
        */
        try {
            const ventajas = await this.obtenerVentajas();

            // Convertir coste string a número para ordenar
            const ventajasCoste = ventajas.map(perk => ({
                ...perk,
                costoNumerico: this.extraerCosteNumerico(perk.precio)
            }));

            return ventajasCoste
                .sort((a, b) => b.costoNumerico - a.costoNumerico)
                .slice(0, limit);
        } catch (error) {
            console.error('Error al obtener ventajas más caros:', error);
            throw error;
        }
    }

    // Obtener perks esenciales (los que aparecen en más juegos)
    async obtenerVentajasEsenciales() {
        /*
        Obtiene las ventajas que aparecen en 3 o más juegos.
        Estas son consideradas "esenciales" de la saga.
        
        Retorna: array de perks esenciales
        */
        try {
            const ventajas = await this.obtenerVentajas();
            return ventajas.filter(perk => perk.juegos.length >= 3);
        } catch (error) {
            console.error('Error al obtener ventajas esenciales:', error);
            throw error;
        }
    }

    // Agrupar perks por efecto
    async agruparVentajasEfecto() {
        /*
        Agrupa las ventajas por su efecto principal.
        Útil para estadísticas o visualizaciones.
        
        Retorna: objeto con efectos como claves y arrays de perks como valores
        Ejemplo:
        {
          "Vida aumentada": [perk1, perk2],
          "Recarga rápida": [perk3],
          ...
        }
        */
        try {
            const ventajas = await this.obtenerVentajas();
            const agrupadas = {};

            ventajas.forEach(ventaja => {
                const efecto = ventaja.efecto;
                if (!agrupadas[efecto]) {
                    agrupadas[efecto] = [];
                }
                agrupadas[efecto].push(ventaja);
            });

            return agrupadas;
        } catch (error) {
            console.error('Error al agrupar ventajas por efecto:', error);
            throw error;
        }
    }

    // Calcular coste total de todos los perks de un juego
    async obtenerCosteTotalVentajaJuego(juego) {
        /*
        Calcula el coste total de comprar todas las ventajas de un juego.
        
        Parámetros:
        - juego: string - Nombre del juego
        
        Retorna: objeto con información del coste total
        */
        try {
            const ventajasJuego = await this.obtenerPerksJuego(juego);

            const costeTotal = ventajasJuego.reduce((sum, ventaja) => {
                return sum + this.extraerCosteNumerico(ventaja.coste);
            }, 0);

            return {
                juego,
                totalPerks: ventajasJuego.length,
                totalCost: costeTotal,
                perks: ventajasJuego
            };
        } catch (error) {
            console.error(`Error al calcular coste total del juego ${juego}:`, error);
            throw error;
        }
    }

    // Comparar dos perks
    compararVentajas(ventaja1, ventaja2) {
        /*
        Compara dos ventajas y retorna información útil.
        
        Parámetros:
        - perk1: objeto perk
        - perk2: objeto perk
        
        Retorna: objeto con la comparación
        */
        const cost1 = this.extraerCosteNumerico(ventaja1.coste);
        const cost2 = this.extraerCosteNumerico(ventaja2.coste);

        return {
            perk1: {
                nombre: ventaja1.nombre,
                coste: cost1,
                juegos: ventaja1.juegos.length,
                efecto: ventaja1.efecto
            },
            perk2: {
                nombre: ventaja2.nombre,
                coste: cost2,
                juegos: ventaja2.juegos.length,
                efecto: ventaja2.efecto
            },
            masCara: cost1 > cost2 ? ventaja1.nombre : ventaja2.nombre,
            masComun: ventaja1.juegos.length > ventaja2.juegos.length ? ventaja1.nombre : ventaja2.nombre,
            DiferenciaCoste: Math.abs(cost1 - cost2)
        };
    }

    // Obtener estadísticas generales de perks
    async obtenerEstadisticasVentaja() {
        /*
        Calcula estadísticas generales de todas las ventajas.
        
        Retorna: objeto con estadísticas
        */
        try {
            const ventajas = await this.obtenerVentajas();

            const costs = ventajas.map(ventaja => this.extraerCosteNumerico(ventaja.coste));
            const totalJuegos = new Set(ventajas.flatMap(ventaja => ventaja.juegos));

            return {
                totalVentajas: ventajas.length,
                costePromedio: costs.reduce((a, b) => a + b, 0) / costs.length,
                minCost: Math.min(...costs),
                maxCost: Math.max(...costs),
                totalJuegos: totalJuegos.size,
                distribucionEfectos: await this.agruparVentajasEfecto()
            };
        } catch (error) {
            console.error('Error al calcular estadísticas:', error);
            throw error;
        }
    }

    // Recomendar perks para un mapa
    recomendacionVentajasMapa(puntosDisponibles, dificultadMapa = 'Media') {
        /*
        Recomienda qué perks comprar basándose en puntos disponibles y dificultad.
        
        Parámetros:
        - availablePoints: number - Puntos disponibles
        - mapDifficulty: string - Dificultad del mapa
        
        Retorna: array de perks recomendados en orden de prioridad
        */
        const recommendations = {
            'Baja': ['Quick Revive', 'Speed Cola', 'Double Tap'],
            'Media': ['Juggernog', 'Speed Cola', 'Double Tap', 'Quick Revive'],
            'Media-Alta': ['Juggernog', 'Double Tap', 'Speed Cola', 'Stamin-Up'],
            'Alta': ['Juggernog', 'Double Tap', 'Mule Kick', 'Speed Cola']
        };

        return recommendations[dificultadMapa] || recommendations['Media'];
    }

    // ========================================
    // FUNCIONES AUXILIARES PRIVADAS
    // ========================================

    // Extraer valor numérico del coste
    extraerCosteNumerico(coste) {
        /*
        Convierte el string de coste a número.
        Ejemplo: "2500 puntos" → 2500
        
        Parámetros:
        - costeString: string - Coste en formato string
        
        Retorna: number - Coste en formato numérico
        */
        return parseInt(coste);
    }

    // Formatear coste a string
    formatearCoste(cost) {
        /*
        Formatea un número a string de coste.
        Ejemplo: 2500 → "2500 puntos"
        
        Parámetros:
        - cost: number - Coste numérico
        
        Retorna: string - Coste formateado
        */
        return `${cost} puntos`;
    }

    // Validar datos de perk antes de enviar
    validarVentaja(ventajaData) {
        /*
        Valida que los datos del perk sean correctos antes de enviar a la API.
        
        Parámetros:
        - perkData: objeto - Datos del perk a validar
        
        Retorna: objeto con { valid: boolean, errors: array }
        */
        const errors = [];

        if (!ventajaData.nombre || ventajaData.nombre.trim() === '') {
            errors.push('El nombre es obligatorio');
        }

        if (!ventajaData.coste || ventajaData.coste.trim() === '') {
            errors.push('El coste es obligatorio');
        }

        if (!ventajaData.efecto || ventajaData.efecto.trim() === '') {
            errors.push('El efecto es obligatorio');
        }

        if (!ventajaData.descripcion || ventajaData.descripcion.trim() === '') {
            errors.push('La descripción es obligatoria');
        }

        if (!ventajaData.juegos || ventajaData.juegos.length === 0) {
            errors.push('Debe seleccionar al menos un juego');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

// Exportar una instancia única del servicio (Singleton)
export default new ServicioVentajas();

/*
========================================
EJEMPLOS DE USO EN COMPONENTES REACT
========================================

import perksService from '../services/perksService';

// 1. Obtener todos los perks
const perks = await perksService.getAllPerks();

// 2. Crear un nuevo perk
const newPerk = await perksService.createPerk({
  nombre: "Juggernog",
  coste: "2500 puntos",
  efecto: "Vida aumentada",
  descripcion: "Aumenta tu salud de 2 golpes a 5 golpes",
  juegos: ["WAW", "BO1", "BO2", "BO3", "BO4"]
});

// 3. Filtrar perks por juego
const wawPerks = await perksService.getPerksByGame('WAW');

// 4. Buscar por nombre
const searchResults = await perksService.searchByName('jugger');

// 5. Obtener perks esenciales
const essential = await perksService.getEssentialPerks();

// 6. Calcular coste total de un juego
const costInfo = await perksService.getTotalCostByGame('BO1');
console.log(costInfo);
// {
//   juego: "BO1",
//   totalPerks: 6,
//   totalCost: 15500,
//   perks: [...]
// }

// 7. Comparar dos perks
const comparison = perksService.compareTwoPerks(perk1, perk2);

// 8. Obtener estadísticas generales
const stats = await perksService.getPerksStatistics();

// 9. Recomendaciones para un mapa
const recommended = perksService.recommendPerksForMap(15000, 'Alta');

// 10. Validar antes de crear
const validation = perksService.validatePerkData(perkData);
if (validation.valid) {
  await perksService.createPerk(perkData);
} else {
  console.error('Errores:', validation.errors);
}

========================================
USO CON REACT HOOKS
========================================

function PerksComponent() {
  const [perks, setPerks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPerks = async () => {
      setLoading(true);
      try {
        const data = await perksService.getAllPerks();
        setPerks(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPerks();
  }, []);

  return (
    // ... tu JSX
  );
}
*/