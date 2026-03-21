// src/components/Mapas.jsx
// Componente de lista de mapas — vista en grid de tarjetas

import { useState, useEffect } from 'react';
import servicioMapas from '../services/servicioMapas';
import servicioArmas from '../services/servicioArmas';
import servicioVentajas from '../services/servicioVentajas';
import './mapas.css';
import MapaCard from './mapa-card';

const JUEGOS_DISPONIBLES = ['WAW', 'BO1', 'BO2', 'BO3', 'BO4'];

const MAPA_VACIO = {
    nombre: '',
    imagen: '',
    imagenFile: null,
    descripcion: '',
    juego: 'WAW',
    dificultad: 'Media',
    armas: [],
    ventajas: []
};

function Mapas({ usuario }) {

    // ─── Estados ────────────────────────────────────────────────
    const [mapas, setMapas] = useState([]);
    const [mapasFiltrados, setMapasFiltrados] = useState([]);
    const [juegoSeleccionado, setJuegoSeleccionado] = useState('all');
    const [dificultadSeleccionada, setDificultadSeleccionada] = useState('all');
    const [cargando, setCargando] = useState(false);
    // Añade este estado nuevo, separado de "cargando"
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [mapaActual, setMapaActual] = useState(MAPA_VACIO);

    // ─── Estados para armas y ventajas disponibles ──────────────
    // Estas listas vienen de la API y se filtran por el juego seleccionado
    const [todasLasArmas, setTodasLasArmas] = useState([]);
    const [todasLasVentajas, setTodasLasVentajas] = useState([]);
    const [cargandoExtras, setCargandoExtras] = useState(false);

    // Para abrir el modal
    const [mapaDetalleArmas, setMapaDetalleArmas] = useState(null);
    const [mapaDetalleVentajas, setMapaDetalleVentajas] = useState(null);

    // ─── Efectos ────────────────────────────────────────────────
    useEffect(() => {
        cargarMapas();
    }, []);

    // Cuando se abre el formulario, cargamos inmediatamente
    useEffect(() => {
        if (mostrarFormulario) {
            cargarArmasYVentajas(mapaActual.juego);
        }
    }, [mostrarFormulario]);

    // Cuando cambia el juego del formulario, recargamos las listas filtradas
    useEffect(() => {
        if (mostrarFormulario && mapaActual.juego) {
            cargarArmasYVentajas(mapaActual.juego);
        }
    }, [mapaActual.juego, mostrarFormulario]);

    // ─── Funciones ──────────────────────────────────────────────
    const cargarMapas = async () => {
        setCargando(true);
        setError('');
        try {
            const data = await servicioMapas.obtenerMapas();

            const agrupados = Object.values(
                data.reduce((acc, mapa) => {
                    if (!acc[mapa.nombre]) {
                        acc[mapa.nombre] = { nombre: mapa.nombre, imagen: mapa.imagen, iteraciones: [] };
                    }
                    acc[mapa.nombre].iteraciones.push(mapa);
                    return acc;
                }, {})
            );

            setMapas(agrupados);
            setMapasFiltrados(agrupados);
        } catch (err) {
            setError('Error al cargar los mapas. Por favor, intenta de nuevo.');
            console.error('❌ Error:', err);
        } finally {
            setCargando(false);
        }
    };

    // Carga armas y ventajas filtradas por el juego seleccionado en el formulario
    const cargarArmasYVentajas = async (juego) => {
        setCargandoExtras(true);
        try {
            const [armas, ventajas] = await Promise.all([
                servicioArmas.obtenerArmas(),
                servicioVentajas.obtenerVentajas(),
            ]);
            // Filtramos solo las que pertenecen al juego del mapa
            setTodasLasArmas(armas.filter(a => a.juego === juego));
            setTodasLasVentajas(ventajas.filter(v => v.juegos.includes(juego)));
        } catch (err) {
            console.error('Error al cargar armas/ventajas:', err);
        } finally {
            setCargandoExtras(false);
        }
    };

    // Filtra por juego Y dificultad al mismo tiempo
    const aplicarFiltros = (juego, dificultad) => {
        let resultado = mapas;

        if (juego !== 'all') {
            resultado = resultado.filter(grupo =>
                grupo.iteraciones.some(m => m.juego === juego)
            );
        }
        if (dificultad !== 'all') {
            resultado = resultado.filter(grupo =>
                grupo.iteraciones.some(m => m.dificultad === dificultad)
            );
        }

        setMapasFiltrados(resultado);
    };

    const filtrarJuego = (juego) => {
        setJuegoSeleccionado(juego);
        aplicarFiltros(juego, dificultadSeleccionada);
    };

    const filtrarDificultad = (dificultad) => {
        setDificultadSeleccionada(dificultad);
        aplicarFiltros(juegoSeleccionado, dificultad);
    };

    // ─── Formulario ─────────────────────────────────────────────
    const abrirFormularioCreacion = () => {
        setModoEdicion(false);
        setMapaActual(MAPA_VACIO);
        setMostrarFormulario(true);
    };

    const editarMapa = (mapa) => {
        setModoEdicion(true);
        setMapaActual({ ...mapa, imagenFile: null });
        setMostrarFormulario(true);
    };

    const cerrarFormulario = () => {
        setMostrarFormulario(false);
        setMapaActual(MAPA_VACIO);
        setError('');
    };

    const manejarInputCambio = (e) => {
        const { id, value } = e.target;
        setMapaActual(prev => ({
            ...prev,
            [id]: value,
            ...(id === 'juego' && { armas: [], ventajas: [] })
        }));
    };

    const manejarCambioImagen = (e) => {
        const archivo = e.target.files[0];
        if (!archivo) return;

        if (!archivo.type.startsWith('image/')) {
            alert('Por favor selecciona un archivo de imagen');
            e.target.value = '';
            return;
        }
        if (archivo.size > 5 * 1024 * 1024) {
            alert('La imagen es muy grande. Máximo 5MB');
            e.target.value = '';
            return;
        }

        setMapaActual(prev => ({
            ...prev,
            imagenFile: archivo,
            imagen: URL.createObjectURL(archivo),
        }));
    };

    // Maneja el check/uncheck de cada juego
    // Un mapa puede aparecer en varios juegos a la vez, por eso usamos checkboxes
    const manejarCambioJuego = (juego) => {
        setMapaActual(prev => ({
            ...prev,
            juego: juego,       // ← "juego" singular, igual que el modelo
            armas: [],
            ventajas: []
        }));
        cargarArmasYVentajas(juego);
    };

    // ─── Formulario: selección de armas ─────────────────────────
    // Comprueba si un arma ya está seleccionada en el mapa
    const armaEstaSeleccionada = (armaId) =>
        mapaActual.armas.some(a => a.arma?.id === armaId);

    const manejarSeleccionArma = (arma) => {
        setMapaActual(prev => {
            const yaSeleccionada = armaEstaSeleccionada(arma.id);

            if (yaSeleccionada) {
                // Si ya estaba, la quitamos
                return { ...prev, armas: prev.armas.filter(a => a.arma.id !== arma.id) };
            } else {
                // Si no estaba, la añadimos con valores por defecto
                return {
                    ...prev,
                    armas: [...prev.armas, { arma, precio: 500, enCaja: "pared" }]
                };
            }
        });
    };

    // Actualiza el precio o el campo enCaja de un arma ya seleccionada
    const manejarDatosArma = (arma_id, campo, valor) => {
        setMapaActual(prev => ({
            ...prev,
            armas: prev.armas.map(a =>
                a.arma?.id === arma_id
                    ? { ...a, [campo]: valor }  // ✅ Conserva toda la estructura de "a"
                    : a
            )
        }));
    };

    // ─── Formulario: selección de ventajas ──────────────────────
    const ventajaEstaSeleccionada = (ventajaId) =>
        mapaActual.ventajas.some(v => v.ventaja.id === ventajaId);

    const manejarSeleccionVentaja = (ventaja) => {
        setMapaActual(prev => {
            const yaSeleccionada = ventajaEstaSeleccionada(ventaja.id);
            if (yaSeleccionada) {
                return { ...prev, ventajas: prev.ventajas.filter(v => v.ventaja.id !== ventaja.id) };
            } else {
                return {
                    ...prev,
                    ventajas: [...prev.ventajas, { ventaja, precio: ventaja.precio }]
                };
            }
        });
    };

    // ─── Guardar ────────────────────────────────────────────────
    const guardarMapa = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        setGuardando(true);
        setError('');

        try {
            let mapaParaGuardar = { ...mapaActual };
            delete mapaParaGuardar.imagenFile;  // ← primero eliminamos esto
            delete mapaParaGuardar.id;

            if (mapaActual.imagenFile) {
                const rutaImagen = await servicioMapas.subirImagenMapa(
                    mapaActual.imagenFile,
                    mapaActual.juego,
                    mapaActual.nombre
                );
                if (rutaImagen) {
                    mapaParaGuardar.imagen = rutaImagen;
                }
            }

            // console.log("Enviando:", JSON.stringify(mapaParaGuardar, null, 2));

            if (modoEdicion && mapaActual.id) {
                await servicioMapas.actualizarMapa(mapaActual.id, mapaParaGuardar);
            } else {
                await servicioMapas.crearMapa(mapaParaGuardar);
            }

            await cargarMapas();
            cerrarFormulario();

        } catch (err) {
            console.error("Error capturado:", err);
            setError(modoEdicion ? 'Error al actualizar el mapa.' : 'Error al crear el mapa.');
        } finally {
            setGuardando(false);
        }
    };

    // ─── Eliminar ───────────────────────────────────────────────
    const eliminarMapa = async (id) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este mapa?')) return;

        setCargando(true);
        try {
            await servicioMapas.eliminarMapa(id);
            await cargarMapas();
        } catch (err) {
            setError('Error al eliminar el mapa.');
        } finally {
            setCargando(false);
        }
    };

    // Devuelve color según dificultad
    const colorDificultad = (dificultad) => {
        const colores = {
            'Baja': '#00ff00',
            'Media': '#ffff00',
            'Media-Alta': '#ff8c00',
            'Alta': '#ff4444',
        };
        return colores[dificultad] || '#aaa';
    };

    // ─── Render ─────────────────────────────────────────────────
    return (
        <div className="contenedor-mapas">

            {/* Encabezado */}
            <header className="cabecera-mapas">
                <h1>🗺️ Mapas de Zombies</h1>
                {usuario && <button onClick={abrirFormularioCreacion} className="btn-crear">
                    ➕ Nuevo Mapa
                </button>}
            </header>

            {/* Error */}
            {error && (
                <div className="mensaje-error">⚠️ {error}</div>
            )}

            {/* Filtros — se ocultan cuando el formulario está abierto */}
            {!mostrarFormulario && (
                <div className="contenedor-filtros-mapas">
                    <div className="filtro-item">
                        <label>Juego:</label>
                        <select value={juegoSeleccionado} onChange={(e) => filtrarJuego(e.target.value)} className="filtro-select">
                            <option value="all">Todos</option>
                            {JUEGOS_DISPONIBLES.map(j => <option key={j} value={j}>{j}</option>)}
                        </select>
                    </div>
                    <div className="filtro-item">
                        <label>Dificultad:</label>
                        <select value={dificultadSeleccionada} onChange={(e) => filtrarDificultad(e.target.value)} className="filtro-select">
                            <option value="all">Todas</option>
                            <option value="Baja">Baja</option>
                            <option value="Media">Media</option>
                            <option value="Media-Alta">Media-Alta</option>
                            <option value="Alta">Alta</option>
                        </select>
                    </div>
                    <span className="contador-mapas">
                        {mapasFiltrados.length} mapa{mapasFiltrados.length !== 1 ? 's' : ''}
                    </span>
                </div>
            )}

            {/* Spinner */}
            {cargando && (
                <div className="spinner-cargando">
                    <div className="spinner"></div>
                    <p>Cargando mapas...</p>
                </div>
            )}

            {/* ── FORMULARIO ──────────────────────────────────────── */}
            {mostrarFormulario && (
                <div>
                    <h2 className="form-titulo">
                        {modoEdicion ? '✏️ Editar Mapa' : '➕ Nuevo Mapa'}
                    </h2>

                    <form onSubmit={guardarMapa} className="mapa-form">

                        {/* Nombre */}
                        <div className="form-group">
                            <label htmlFor="nombre">Nombre del Mapa *</label>
                            <input
                                type="text"
                                id="nombre"
                                value={mapaActual.nombre}
                                onChange={manejarInputCambio}
                                required
                                placeholder="Ej: Kino der Toten"
                            />
                        </div>

                        {/* Imagen */}
                        <div className="form-group">
                            <label htmlFor="imagen">Imagen</label>
                            <input type="file" id="imagen" onChange={manejarCambioImagen} />
                            {mapaActual.imagen && (
                                <img
                                    src={mapaActual.imagenFile ? URL.createObjectURL(mapaActual.imagenFile) : mapaActual.imagen}
                                    alt="preview"
                                    className="imagen-preview"
                                />
                            )}
                        </div>

                        {/* Descripción */}
                        <div className="form-group">
                            <label htmlFor="descripcion">Descripción *</label>
                            <textarea
                                id="descripcion"
                                value={mapaActual.descripcion}
                                onChange={manejarInputCambio}
                                required
                                placeholder="Descripción corta del mapa"
                            />
                        </div>

                        {/* Dificultad */}
                        <div className="form-group">
                            <label htmlFor="dificultad">Dificultad *</label>
                            <select
                                id="dificultad"
                                value={mapaActual.dificultad}
                                onChange={manejarInputCambio}
                                required
                            >
                                <option value="Baja">Baja</option>
                                <option value="Media">Media</option>
                                <option value="Media-Alta">Media-Alta</option>
                                <option value="Alta">Alta</option>
                            </select>
                        </div>

                        {/* Juegos — checkboxes para selección múltiple */}
                        <div className="form-group">
                            <label>
                                Juegos * <span className="form-hint">(selecciona uno)</span>
                            </label>
                            <select value={mapaActual.juego} onChange={(e) => manejarCambioJuego(e.target.value)}>
                                {JUEGOS_DISPONIBLES.map(juego => (
                                    <option key={juego} value={juego}>{juego}</option>
                                ))}
                            </select>
                        </div>

                        {/* ── SECCIÓN ARMAS ──────────────────────────────── */}
                        <div className="form-group">
                            <label>
                                🔫 Armas
                                <span className="form-hint"> — {mapaActual.armas.length} seleccionadas</span>
                            </label>

                            {cargandoExtras ? (
                                <p className="form-hint">Cargando armas...</p>
                            ) : todasLasArmas.length === 0 ? (
                                <p className="form-hint">No hay armas registradas para {mapaActual.juego}.</p>
                            ) : (
                                <div className="lista-seleccion">
                                    {todasLasArmas.map(arma => {
                                        const seleccionada = armaEstaSeleccionada(arma.id);
                                        // Buscamos los datos extra (precio, enCaja) del arma ya seleccionada
                                        const datosArma = mapaActual.armas.find(a => a.arma?.id === arma.id);

                                        return (
                                            <div
                                                key={arma.id}
                                                className={`item-seleccion ${seleccionada ? 'item-seleccionado' : ''}`}
                                            >
                                                {/* Fila principal: checkbox + nombre */}
                                                <label className="item-seleccion-label">
                                                    <span>{arma.nombre}</span>
                                                </label>
                                                <input
                                                    type="checkbox"
                                                    checked={seleccionada}
                                                    onChange={() => manejarSeleccionArma(arma)}
                                                    className="item-checkbox"
                                                />

                                                {/* Inputs extra — solo visibles si el arma está seleccionada */}
                                                {seleccionada && (
                                                    <div className="item-extras">
                                                        <div className="extra-field">
                                                            <label>Precio</label>
                                                            <input
                                                                type="number"
                                                                value={datosArma.precio}
                                                                onChange={(e) => manejarDatosArma(arma.id, 'precio', parseInt(e.target.value) || 0)}
                                                                min="0"
                                                            />
                                                        </div>
                                                        <div className="extra-field">
                                                            <label>Aparición</label>
                                                            <select
                                                                value={datosArma.enCaja}
                                                                onChange={(e) => manejarDatosArma(arma.id, 'enCaja', e.target.value)}
                                                            >
                                                                <option value="pared">Pared</option>
                                                                <option value="caja">Caja misteriosa</option>
                                                                <option value="inicial">Inicial</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* ── SECCIÓN VENTAJAS ───────────────────────────── */}
                        <div className="form-group">
                            <label>
                                💊 Ventajas
                                <span className="form-hint"> — {mapaActual.ventajas.length} seleccionadas</span>
                            </label>

                            {cargandoExtras ? (
                                <p className="form-hint">Cargando ventajas...</p>
                            ) : todasLasVentajas.length === 0 ? (
                                <p className="form-hint">No hay ventajas registradas para {mapaActual.juego}.</p>
                            ) : (
                                <div className="lista-seleccion">
                                    {todasLasVentajas.map(ventaja => {
                                        const seleccionada = ventajaEstaSeleccionada(ventaja.id);
                                        return (
                                            <div
                                                key={ventaja.id}
                                                className={`item-seleccion ${seleccionada ? 'item-seleccionado' : ''}`}
                                            >
                                                <label className="item-seleccion-label">
                                                    <span>{ventaja.nombre}</span>
                                                </label>
                                                <input
                                                    type="checkbox"
                                                    checked={seleccionada}
                                                    onChange={() => manejarSeleccionVentaja(ventaja)}
                                                    className="item-checkbox"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Botones */}
                        <div className="form-actions">
                            <button type="submit" className="btn-save" disabled={guardando}>
                                💾 {modoEdicion ? 'Actualizar' : 'Crear'} Mapa
                            </button>
                            <button type="button" onClick={cerrarFormulario} className="btn-cancel">
                                ❌ Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Grid de mapas */}
            {!cargando && !mostrarFormulario && (
                <div className="mapas-grid">
                    {mapasFiltrados.map((grupo) => (
                        <MapaCard
                            key={grupo.nombre}
                            usuario={usuario}
                            iteraciones={grupo.iteraciones}
                            onEditar={editarMapa}
                            onEliminar={eliminarMapa}
                            colorDificultad={colorDificultad}
                            onVerArmas={setMapaDetalleArmas}
                            onVerVentajas={setMapaDetalleVentajas}
                        />
                    ))}

                    {mapasFiltrados.length === 0 && (
                        <div className="sin-mapas">
                            <p>No se encontraron mapas</p>
                        </div>
                    )}
                </div>
            )}
            {mapaDetalleArmas && (
                <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && setMapaDetalleArmas(null)}>
                    <div className="modal">
                        <div className="modal-header">
                            <div className="modal-header-text">
                                <h2>{mapaDetalleArmas.nombre}</h2>
                                <p>{mapaDetalleArmas.descripcion}</p>
                            </div>
                            <button className="modal-close" onClick={() => setMapaDetalleArmas(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {/* --- ARMAS --- */}
                            <div className="modal-section">
                                <div className="section-title">
                                    Armas <span className="section-count">{mapaDetalleArmas.armas?.length ?? 0}</span>
                                </div>
                                <div className="armas-grid">
                                    {mapaDetalleArmas.armas?.map(({ arma, precio, enCaja }, i) => (
                                        <div key={i} className="arma-card">
                                            <div className="arma-nombre">{arma.nombre}</div>
                                            <div className="arma-imagen">
                                                <img src={arma.imagen} />
                                            </div>
                                            <span className={`arma-origen origen-${enCaja}`}>{enCaja}</span>
                                            <span className="arma-precio">{precio > 0 ? `${precio.toLocaleString()} pts` : '—'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {mapaDetalleVentajas && (
                <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && setMapaDetalleVentajas(null)}>
                    <div className="modal">
                        <div className="modal-header">
                            <div className="modal-header-text">
                                <h2>{mapaDetalleVentajas.nombre}</h2>
                                <p>{mapaDetalleVentajas.descripcion}</p>
                            </div>
                            <button className="modal-close" onClick={() => setMapaDetalleVentajas(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {/* --- VENTAJAS --- */}
                            <div className="modal-section">
                                <div className="section-title">
                                    Ventajas <span className="section-count">{mapaDetalleVentajas.ventajas?.length ?? 0}</span>
                                </div>
                                <div className="ventajas-grid">
                                    {mapaDetalleVentajas.ventajas?.map(({ ventaja, precio }, i) => (
                                        <div key={i} className="ventaja-card">
                                            <div className="ventaja-imagen">
                                                <img src={ventaja.imagen} />
                                            </div>
                                            <div className="ventaja-nombre">{ventaja.nombre}</div>
                                            <span className="ventaja-precio">{precio?.toLocaleString()} pts</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Mapas;