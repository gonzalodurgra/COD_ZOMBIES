// src/components/Perks.jsx
// Componente para gestionar ventajas (perks) con CSS vanilla

import React, { useState, useEffect } from 'react';
import ventajaService from '../services/servicioVentajas';
import "./ventajas.css"
import VentajaCard from './ventaja-card';

function Ventajas({ usuario }) {

  // Estados del componente
  const [ventajas, setVentajas] = useState([]);
  const [ventajasFiltradas, setVentajasFiltradas] = useState([]);
  const [juegosSeleccionados, setJuegosSeleccionados] = useState('all');
  const [seleccionarRangoCoste, setSeleccionarRangoCoste] = useState('all');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Estado inicial de un perk vacío
  const obtenerVentajaVacia = () => ({
    imagen: '',
    nombre: '',
    precio: 500,
    efecto: '',
    juegos: []
  });

  const [ventajaActual, setVentajaActual] = useState(obtenerVentajaVacia());

  // Cargar perks al montar el componente
  useEffect(() => {
    obtenerVentajas();
  }, []);

  // Aplicar filtros cuando cambian
  useEffect(() => {
    aplicarFiltros();
  }, [juegosSeleccionados, seleccionarRangoCoste, ventajas]);

  // Cargar todos los perks
  const obtenerVentajas = async () => {
    setCargando(true);
    setError('');

    try {
      const data = await ventajaService.obtenerVentajas();
      setVentajas(data);
      setVentajasFiltradas(data);
    } catch (err) {
      setError('Error al cargar los perks. Por favor, intenta de nuevo.');
      console.error('❌ Error:', err);
    } finally {
      setCargando(false);
    }
  };

  // Aplicar filtros combinados
  const aplicarFiltros = () => {
    let filtradas = ventajas;

    // Filtrar por juego
    if (juegosSeleccionados !== 'all') {
      filtradas = filtradas.filter(ventaja => ventaja.juegos.includes(juegosSeleccionados));
    }

    // Filtrar por rango de coste
    if (seleccionarRangoCoste !== 'all') {
      filtradas = filtradas.filter(ventaja => {
        const cost = ventajaService.extraerCosteNumerico(ventaja.precio);
        switch (seleccionarRangoCoste) {
          case 'cheap':
            return cost <= 1500;
          case 'medium':
            return cost > 1500 && cost <= 2500;
          case 'expensive':
            return cost > 2500;
          default:
            return true;
        }
      });
    }

    setVentajasFiltradas(filtradas);
  };

  // Abrir formulario de creación
  const abrirFormCrear = () => {
    setEditMode(false);
    setVentajaActual(obtenerVentajaVacia());
    setMostrarForm(true);
  };

  // Abrir formulario de edición
  const editVentaja = (ventaja) => {
    setEditMode(true);
    setVentajaActual({ ...ventaja });
    setMostrarForm(true);
  };

  // Manejar cambios en inputs
  const manejarInputCambio = (e) => {
    const { id, value, files, type } = e.target;
    let valorFinal = value;
    if (type === 'number') {
      // Para campos decimales
      if (id === 'coste' || id === 'cadencia') {
        valorFinal = value === '' ? 0 : parseInt(value);
      }
    }
    setVentajaActual({
      ...ventajaActual,
      [id]: valorFinal
    });
  };

  // Manejar cambios en juegos (checkboxes)
  const manejarCambioJuego = (juego) => {
    setVentajaActual(prev => {
      const juegos = prev.juegos.includes(juego)
        ? prev.juegos.filter(j => j !== juego)
        : [...prev.juegos, juego];
      return { ...prev, juegos };
    });
  };

  // Manejador específico para la imagen
  const manejarCambioImagen = (e) => {
    const archivo = e.target.files[0];

    if (archivo) {
      // Validar que sea una imagen
      if (!archivo.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen');
        e.target.value = ''; // Limpiar el input
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (archivo.size > 5 * 1024 * 1024) {
        alert('La imagen es muy grande. Máximo 5MB');
        e.target.value = ''; // Limpiar el input
        return;
      }

      setVentajaActual({
        ...ventajaActual,
        imagenFile: archivo,  // Guardar el archivo
        imagen: URL.createObjectURL(archivo)  // Preview temporal
      });
    }
  };

  // Guardar perk (crear o actualizar)
  const guardarVentaja = async (e) => {
    e.preventDefault();
    setCargando(true);

    try {
      let ventajaParaGuardar = { ...ventajaActual };

      // PASO 1: Subir imagen si hay una nueva
      if (ventajaActual.imagenFile) {
        const ruta = await ventajaService.subirImagenVentaja(
          ventajaActual.imagenFile,
          ventajaActual.nombre
        );
        ventajaParaGuardar.imagen = ruta;
      }

      // PASO 2: Limpiar campos que la API no necesita
      delete ventajaParaGuardar.imagenFile;
      delete ventajaParaGuardar.id; // si existe, el PUT lo usa por URL no por body

      // PASO 3: Convertir precio a número entero
      ventajaParaGuardar.precio = parseInt(ventajaParaGuardar.precio);

      // PASO 4: Crear o actualizar
      if (editMode && ventajaActual.id) {
        await ventajaService.actualizarVentaja(ventajaActual.id, ventajaParaGuardar);
      } else {
        await ventajaService.crearVentaja(ventajaParaGuardar);
      }

      await obtenerVentajas();
      cerrarForm();

    } catch (err) {
      console.error(err);
      setError(editMode ? 'Error al actualizar ventaja' : 'Error al crear ventaja');
    } finally {
      setCargando(false);
    }
  };

  // Eliminar perk
  const eliminarVentaja = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta ventaja?')) {
      setCargando(true);

      try {
        await ventajaService.eliminarVentaja(id);
        await obtenerVentajas();
      } catch (err) {
        setError('Error al eliminar ventaja');
      } finally {
        setCargando(false);
      }
    }
  };

  // Cerrar formulario
  const cerrarForm = () => {
    setMostrarForm(false);
    setVentajaActual(obtenerVentajaVacia());
  };

  // Obtener icono según el nombre del perk
  const obtenerIconoVentaja = (nombre) => {
    const icons = {
      'Juggernog': '🟥',
      'Speed Cola': '🟢',
      'Quick Revive': '🔵',
      'Double Tap': '🟡',
      'Stamin-Up': '🟠',
      'PhD Flopper': '🟣',
      'Mule Kick': '🟢',
      'Deadshot': '🟡',
      'Widow\'s Wine': '🟣',
      'Electric Cherry': '🔵',
      'Vulture Aid': '🟤',
      'Tombstone': '⚫',
      'Who\'s Who': '🔵'
    };

    const claveVentaja = Object.keys(icons).find(clave => nombre.includes(clave));
    return icons[claveVentaja] || '🥤';
  };

  // Obtener clase de coste
  const obtenerClaseCoste = (coste) => {
    const cost = ventajaService.extraerCosteNumerico(coste);
    if (cost <= 1500) return 'cost-cheap';
    if (cost <= 2500) return 'cost-medium';
    return 'cost-expensive';
  };

  // Renderizar componente
  return (
    <div className="perks-container">

      {/* Encabezado */}
      <header className="perks-header">
        <h1>🥤 Ventajas</h1>
        {usuario && <button className="btn-create" onClick={abrirFormCrear}>
          ➕ Nueva Ventaja
        </button>}
      </header>

      {/* Mensajes de error */}
      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {/* Filtros */}
      <div className="filters-container">
        <div className="filter-group">
          <label>Filtrar por juego:</label>
          <select
            value={juegosSeleccionados}
            onChange={(e) => setJuegosSeleccionados(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos los juegos</option>
            <option value="WAW">World at War</option>
            <option value="BO1">Black Ops 1</option>
            <option value="BO2">Black Ops 2</option>
            <option value="BO3">Black Ops 3</option>
            <option value="BO4">Black Ops 4</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Filtrar por coste:</label>
          <select
            value={seleccionarRangoCoste}
            onChange={(e) => setSeleccionarRangoCoste(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos</option>
            <option value="cheap">Baratos (&le;1500)</option>
            <option value="medium">Medios (1500-2500)</option>
            <option value="expensive">Caros (&gt;2500)</option>
          </select>
        </div>
      </div>

      {/* Spinner de carga */}
      {cargando && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando perks...</p>
        </div>
      )}

      {/* Grid de perks */}
      {!cargando && !mostrarForm && (
        <div className="perks-grid">
          {ventajasFiltradas.map((ventaja) => (
            <VentajaCard
              usuario={usuario}
              key={ventaja.id}
              ventaja={ventaja}
              onEditar={editVentaja}
              onEliminar={eliminarVentaja}
            />
          ))}

          {/* Mensaje cuando no hay perks */}
          {ventajasFiltradas.length === 0 && (
            <div className="no-perks">
              <p>No se encontraron ventajas con los filtros seleccionados</p>
            </div>
          )}
        </div>
      )}

      {/* Formulario de crear/editar */}
      {mostrarForm && (
        <div className="perk-form-container">
          <div className="perk-form">
            <h2>{editMode ? '✏️ Editar Ventaja' : '➕ Nueva Ventaja'}</h2>

            <form onSubmit={guardarVentaja}>

              {/* Nombre */}
              <div className="form-group">
                <label htmlFor="nombre">Nombre de la ventaja *</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={ventajaActual.nombre}
                  onChange={manejarInputCambio}
                  required
                  placeholder="Ej: Juggernog"
                />
              </div>
              <div className="form-group">
                <div>
                  <label htmlFor="imagen">Imagen</label>
                  <input type="file" id="imagen" onChange={manejarCambioImagen} />
                  {ventajaActual.imagen && <img src={ventajaActual.imagen} alt="" />}
                </div>
              </div>
              {/* Coste y Efecto */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="precio">Coste *</label>
                  <input
                    type="text"
                    id="precio"
                    name="precio"
                    value={ventajaActual.precio}
                    onChange={manejarInputCambio}
                    required
                    placeholder="Ej: 2500 puntos"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="efecto">Efecto Principal *</label>
                  <input
                    type="text"
                    id="efecto"
                    name="efecto"
                    value={ventajaActual.efecto}
                    onChange={manejarInputCambio}
                    required
                    placeholder="Ej: Vida aumentada"
                  />
                </div>
              </div>

              {/* Juegos (checkboxes) */}
              <div className="form-group">
                <label>Juegos donde aparece *</label>
                <div className="checkboxes-container">
                  {['WAW', 'BO1', 'BO2', 'BO3', 'BO4'].map(game => (
                    <label key={game} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={ventajaActual.juegos.includes(game)}
                        onChange={() => manejarCambioJuego(game)}
                      />
                      <span>{game}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Botones del formulario */}
              <div className="form-actions">
                <button type="submit" className="btn-save">
                  💾 {editMode ? 'Actualizar' : 'Crear'}
                </button>
                <button type="button" className="btn-cancel" onClick={cerrarForm}>
                  ❌ Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Ventajas;