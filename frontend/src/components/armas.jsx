// src/components/Weapons.jsx
// Componente de armas con TailwindCSS

import React, { useState, useEffect } from 'react';
import armaService from '../services/servicioArmas';
import ArmaCard from './arma-card';
import "./armas.css"

function Armas({ usuario }) {

    // Estados del componente
    const [armas, setArmas] = useState([]);
    const [armasFiltradas, setArmasFiltradas] = useState([]);
    const [tipoSeleccionado, setTipoSeleccionado] = useState('all');
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [mostrarPAP, setMostrarPAP] = useState(false);
    const [tienePAP, setTienePAP] = useState(false);
    const [dañoInfinito, setDañoInfinito] = useState(false);
    const [municionInfinita, setMunicionInfinita] = useState(false);
    const [dañoPapInfinito, setDañoPapInfinito] = useState(false);
    const [reservaPapInfinita, setReservaPapInfinita] = useState(false)
    const [capacidadCampeoMaxima, setCapacidadCampeoMaxima] = useState(0);
    const [eficienciaMaximo, setEficienciaMaximo] = useState(0);
    const [dpsMaximo, setDpsMaximo] = useState(0);
    const agrupadas = [];

    const [armaActual, setArmaActual] = useState({
        nombre: '',
        tipo: 'fusil',
        imagen: '',
        imagenFile: null,
        daño: 100,
        multiplicadores: {
            cabeza: 4,
            torso: 1.5,
            abdomen: 1
        },
        cargador: 30,
        reserva: 120,
        cadencia: 625,
        recarga: 2.4,
        descripcion: '',
        juego: "WAW",
        papNombre: '',
        papDaño: 150,
        papMultiplicadores: { cabeza: 5, torso: 1.5, abdomen: 1 },
        papCargador: 40,
        papReserva: 200,
        papCadencia: 750,
        papRecarga: 2
    });

    const ARMAS_POR_PAGINA = 12;
    const [paginaActual, setPaginaActual] = useState(1);

    // Cargar armas al montar el componente
    useEffect(() => {
        cargarArmas();
    }, []);

    // Funciones del componente
    const cargarArmas = async () => {
        setCargando(true);
        setError('');

        try {
            const data = await armaService.obtenerArmas();

            const agrupadas = Object.values(
                data.reduce((acc, arma) => {
                    if (!acc[arma.nombre]) {
                        acc[arma.nombre] = { nombre: arma.nombre, imagen: arma.imagen, tipo: arma.tipo, iteraciones: [] };
                    }
                    acc[arma.nombre].iteraciones.push(arma);
                    return acc;
                }, {})
            );

            // Ahora sí tenemos datos reales
            const todasLasIteraciones = agrupadas.flatMap(g => g.iteraciones);

            setCapacidadCampeoMaxima(todasLasIteraciones.reduce((max, a) => {
                const daño = a.papDaño ?? a.daño;
                const cargador = a.papCargador ?? a.cargador;
                const recarga = a.papRecarga ?? a.recarga;
                const mults = a.papMultiplicadores ?? a.multiplicadores;
                if (daño === 'infinito') return max;
                const valor = ((cargador * daño * mults.cabeza) + (cargador * daño * mults.torso)) / recarga / 4;
                return Math.max(max, valor);
            }, 0));

            setEficienciaMaximo(todasLasIteraciones.reduce((max, a) => {
                const daño = a.papDaño ?? a.daño;
                const reserva = a.papReserva ?? a.reserva;
                const cargador = a.papCargador ?? a.cargador;
                const mults = a.papMultiplicadores ?? a.multiplicadores;
                if (daño === 'infinito' || reserva === 'infinito') return max;
                const valor = ((daño * mults.cabeza) + (daño * mults.torso)) * (reserva + cargador) / 4;
                return Math.max(max, valor);
            }, 0));

            setDpsMaximo(todasLasIteraciones.reduce((max, a) => {
                const daño = a.papDaño ?? a.daño;
                const cadencia = a.papCadencia ?? a.cadencia;
                const mults = a.papMultiplicadores ?? a.multiplicadores;
                if (daño === 'infinito') return max;
                const valor = ((daño * cadencia * mults.cabeza) + (daño * cadencia * mults.torso)) / 4;
                return Math.max(max, valor);
            }, 0));

            setArmas(agrupadas);
            setArmasFiltradas(agrupadas);
        } catch (err) {
            setError('Error al cargar las armas. Por favor, intenta de nuevo.');
            console.error('❌ Error:', err);
        } finally {
            setCargando(false);
        }
    };

    const filtrarTipo = (tipo) => {
        setTipoSeleccionado(tipo);
        setPaginaActual(1);
        if (tipo === 'all') {
            setArmasFiltradas(armas);
        } else if (tipo != 'normal') {
            const filtradas = armas.filter(arma => arma.tipo === tipo);
            setArmasFiltradas(filtradas);
        }
        else {
            const filtradas = armas.filter(arma => arma.tipo != "maravillosa")
            setArmasFiltradas(filtradas)
        }
    };

    const abrirFormularioCreacion = () => {
        setModoEdicion(false);
        setDañoInfinito(false);
        setMunicionInfinita(false);
        setArmaActual({
            nombre: '',
            tipo: 'fusil de asalto',
            daño: 100,
            multiplicadores: { cabeza: 4, torso: 1.5, abdomen: 1 },
            cargador: 30,
            reserva: 120,
            cadencia: 625,
            recarga: 2.4,
            descripcion: '',
            juego: 'WAW',
            papNombre: '',
            papDaño: 150,
            papMultiplicadores: { cabeza: 5, torso: 1.5, abdomen: 1 },
            papCargador: 40,
            papReserva: 200,
            papCadencia: 750,
            papRecarga: 2
        });
        setMostrarFormulario(true);
    };

    const editarArma = (arma) => {
        console.log('🔍 Todas las claves del arma:', Object.keys(arma));
        console.log('🔍 Arma completa:', JSON.stringify(arma, null, 2));
        console.log('🔍 Arma a editar:', arma);        // ¿Llegan los campos PAP?
        console.log('🔍 papNombre:', arma.papNombre);   // ¿Es null, undefined o tiene valor?
        console.log('🔍 mostrarPAP será:', !!arma.papNombre);
        setModoEdicion(true);
        setDañoInfinito(arma.daño == "infinito");
        setMunicionInfinita(arma.reserva == "infinito");
        setDañoPapInfinito(arma.papDaño == "infinito");
        setReservaPapInfinita(arma.papReserva == "infinito")
        setArmaActual({
            ...arma,
            papMultiplicadores: arma.papMultiplicadores ?? { cabeza: 4, torso: 1.5, abdomen: 1 },
            papNombre: arma.papNombre ?? '',
            papDaño: arma.papDaño ?? 150,
            papCargador: arma.papCargador ?? 40,
            papReserva: arma.papReserva ?? 200,
            papCadencia: arma.papCadencia ?? 750,
            papRecarga: arma.papRecarga ?? 2
        });
        setMostrarPAP(!!arma.papNombre);
        setTienePAP(!!arma.papNombre);
        setMostrarFormulario(true);
    };

    const manejarInputCambio = (e) => {
        const { id, value, files, type } = e.target;
        let valorFinal = value;
        // Si el campo es de tipo archivo (imagen)
        if (type === 'file' && files && files[0]) {
            // Guardar tanto el archivo como una URL temporal para preview
            setArmaActual({
                ...armaActual,
                imagenFile: files[0],  // Archivo real para subir después
                imagen: URL.createObjectURL(files[0])  // URL temporal para mostrar preview
            });
        } else {
            // Para todos los demás campos (texto, número, select, etc.)
            setArmaActual({
                ...armaActual,
                [id]: value  // Usamos id en lugar de name
            });
        }
        if (type === 'number') {
            // Para campos decimales
            if (id === 'recarga' || id === 'cadencia') {
                valorFinal = value === '' ? 0 : parseFloat(value);
            } else {
                // Para campos enteros
                valorFinal = value === '' ? 0 : parseInt(value);
            }
        }
    };

    const manejarCambioMultiplicador = (parte, valor) => {
        setArmaActual(prev => ({
            ...prev,
            multiplicadores: {
                ...prev.multiplicadores,
                [parte]: parseFloat(valor)
            }
        }));
    };

    const manejarCambioJuegos = (e) => {
        const juego = e.target.value;

        console.log('🎮 Juego seleccionado:', juego);
        console.log('🎮 Tipo:', typeof juego);

        setArmaActual({
            ...armaActual,
            juego: juego  // Singular, no plural
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

            setArmaActual({
                ...armaActual,
                imagenFile: archivo,  // Guardar el archivo
                imagen: URL.createObjectURL(archivo)  // Preview temporal
            });
        }
    };

    const manejarCambioMultiplicadorPAP = (parte, valor) => {
        setArmaActual(prev => ({
            ...prev,
            papMultiplicadores: {
                ...prev.papMultiplicadores,
                [parte]: parseFloat(valor)
            }
        }));
    };


    const guardarArma = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        console.log('🚀 guardarArma ejecutado - la página NO debería recargarse');
        setCargando(true);

        try {
            // Crear una copia del arma actual para trabajar con ella
            let armaParaGuardar = { ...armaActual };

            // PASO 1: Si hay una imagen nueva, subirla primero
            if (armaActual.imagenFile) {
                // Subir la imagen al servidor
                const resultadoImagen = await armaService.subirImagen(
                    armaActual.imagenFile,  // El archivo de imagen
                    armaActual.juego,
                    armaActual.nombre        // El juego seleccionado
                );

                // Actualizar la ruta de la imagen con la devuelta por el servidor
                armaParaGuardar.imagen = resultadoImagen.ruta;
            }

            // Aplicar valores infinitos si los checkboxes están marcados
            if (dañoInfinito) armaParaGuardar.daño = 'infinito';
            if (municionInfinita) armaParaGuardar.reserva = 'infinito';
            if (dañoPapInfinito) armaParaGuardar.papDaño = 'infinito';
            if (reservaPapInfinita) armaParaGuardar.papReserva = 'infinito';
            // DEPURACIÓN: Ver qué datos vamos a enviar
            console.log('📤 Datos a enviar:', armaParaGuardar);
            console.log('📋 Tipos de datos:', {
                nombre: typeof armaParaGuardar.nombre,
                tipo: typeof armaParaGuardar.tipo,
                imagen: typeof armaParaGuardar.imagen,
                daño: typeof armaParaGuardar.daño,
                multiplicadores: typeof armaParaGuardar.multiplicadores,
                cargador: typeof armaParaGuardar.cargador,
                reserva: typeof armaParaGuardar.reserva,
                cadencia: typeof armaParaGuardar.cadencia,
                recarga: typeof armaParaGuardar.recarga,
                descripcion: typeof armaParaGuardar.descripcion,
                juego: typeof armaParaGuardar.juego
            });

            delete armaParaGuardar.id;
            delete armaParaGuardar.imagenFile;

            console.log(armaParaGuardar)


            // PASO 2: Crear o actualizar el arma
            if (modoEdicion && armaActual.id) {
                // Si estamos editando, actualizar
                await armaService.actualizarArma(armaActual.id, armaParaGuardar);
            } else {
                // Si es nueva, crear
                await armaService.crearArma(armaParaGuardar);
            }

            // PASO 3: Recargar la lista y cerrar formulario
            await cargarArmas();
            cerrarFormulario();

        } catch (err) {
            // Manejar errores específicos
            if (err.message.includes('subir imagen')) {
                setError('Error al subir la imagen');
            } else if (modoEdicion) {
                setError('Error al actualizar el arma');
            } else {
                setError('Error al crear el arma');
            }
            console.error('Error completo:', err);
        } /*finally {
            setCargando(false);
        }*/
    };

    const eliminarArma = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta arma?')) {
            setCargando(true);

            try {
                await armaService.eliminarArma(id);
                await cargarArmas();
            } catch (err) {
                setError('Error al eliminar el arma');
            } finally {
                setCargando(false);
            }
        }
    };

    const cerrarFormulario = () => {
        setMostrarFormulario(false);
        setMostrarPAP(false);
        setTienePAP(false);
        setArmaActual({
            nombre: '',
            tipo: 'assault',
            daño: 3,
            multiplicadores: {},
            description: '',
            juegos: []
        });
    };

    // const getStars = (valor) => {
    //     return '★'.repeat(valor) + '☆'.repeat(5 - valor);
    // };

    const totalPaginas = Math.ceil(armasFiltradas.length / ARMAS_POR_PAGINA);
    const indiceInicio = (paginaActual - 1) * ARMAS_POR_PAGINA;
    const armasPagina = armasFiltradas.slice(indiceInicio, indiceInicio + ARMAS_POR_PAGINA);

    // Renderizar componente con TailwindCSS
    return (
        <div className="contenedor-armas">

            {/* Encabezado */}
            <header className="cabecera-armas">
                <h1>
                    ⚔️ Arsenal de Armas
                </h1>
                {usuario && <button
                    onClick={abrirFormularioCreacion}
                    className="btn-crear"
                >
                    ➕ Nueva Arma
                </button>}
            </header>

            {/* Mensajes de error */}
            {error && (
                <div className="mensaje-error">
                    ⚠️ {error}
                </div>
            )}

            {/* Filtros */}
            <div className="contenedor-filtro">
                <label>
                    Filtrar por tipo:
                </label>
                <select
                    value={tipoSeleccionado}
                    onChange={(e) => filtrarTipo(e.target.value)}
                    className="filtro-select"
                >
                    <option value="all">Todos los tipos</option>
                    <option value="fusil">Fusil de Asalto</option>
                    <option value="subfusil">Subfusil</option>
                    <option value="ametralladora">Ametralladora ligera</option>
                    <option value="francotirador">Francotirador</option>
                    <option value="escopeta">Escopeta</option>
                    <option value="pistola">Pistola</option>
                    <option value="lanzacohetes">Lanzacohetes</option>
                    <option value="especial">Especial</option>
                    <option value="maravillosa">Maravillosa</option>
                    <option value="normal">Normal</option>
                </select>
            </div>

            {/* Spinner de carga */}
            {cargando && (
                <div className="spinner-cargando">
                    <div className="spinner"></div>
                    <p className="mt-4 text-zombie-green text-lg">Cargando armas...</p>
                </div>
            )}

            {/* Grid de armas */}
            {!cargando && !mostrarFormulario && (
                <div className="armas-grid">
                    {
                        armasPagina.map((arma) => (
                            <ArmaCard
                                usuario={usuario}
                                key={arma.nombre}
                                iteraciones={arma.iteraciones}
                                onEditar={editarArma}
                                onEliminar={eliminarArma}
                                capacidadCampeoMaxima={capacidadCampeoMaxima}
                                eficienciaMaximo={eficienciaMaximo}
                                dpsMaximo={dpsMaximo}
                            />
                        ))}

                    {/* Mensaje cuando no hay armas */}
                    {armasFiltradas.length === 0 && (
                        <div className="sin-armas">
                            <p>No se encontraron armas</p>
                        </div>
                    )}
                </div>
            )}
            {/* Paginación */}
            {totalPaginas > 1 && (
                <div className="paginacion-contenedor">
                    <p className="paginacion-info">
                        Mostrando {indiceInicio + 1}–{Math.min(indiceInicio + ARMAS_POR_PAGINA, armasFiltradas.length)} de {armasFiltradas.length} armas
                    </p>
                    <div className="paginacion">
                        <button
                            className="btn-pag"
                            onClick={() => setPaginaActual(p => p - 1)}
                            disabled={paginaActual === 1}
                        >
                            ← Ant
                        </button>

                        {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPaginas || Math.abs(p - paginaActual) <= 1)
                            .reduce((acc, p, idx, arr) => {
                                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((p, i) =>
                                p === '...'
                                    ? <span key={`dots-${i}`} className="btn-pag btn-pag--puntos">…</span>
                                    : <button
                                        key={p}
                                        className={`btn-pag${p === paginaActual ? ' btn-pag--activa' : ''}`}
                                        onClick={() => setPaginaActual(p)}
                                    >
                                        {p}
                                    </button>
                            )
                        }

                        <button
                            className="btn-pag"
                            onClick={() => setPaginaActual(p => p + 1)}
                            disabled={paginaActual === totalPaginas}
                        >
                            Sig →
                        </button>
                    </div>
                </div>
            )}

            {/* Formulario de crear/editar */}
            {mostrarFormulario && (
                <div>
                    <h2>{modoEdicion ? '✏️ Editar Arma' : '➕ Nueva Arma'}</h2>

                    <form onSubmit={guardarArma} className="arma-form">

                        {/* ── SECCIÓN BASE ─────────────────────────────────────── */}
                        <h3>📦 Arma base</h3>

                        {/* Nombre y Tipo */}
                        <div className='form-group'>
                            <div>
                                <label htmlFor="nombre">Nombre del Arma *</label>
                                <input
                                    type="text"
                                    id="nombre"
                                    value={armaActual.nombre}
                                    onChange={manejarInputCambio}
                                    required
                                    placeholder="Ej: MP40"
                                />
                            </div>
                            <div>
                                <label htmlFor="tipo">Tipo *</label>
                                <select id="tipo" value={armaActual.tipo} onChange={manejarInputCambio} required>
                                    <option value="fusil">Fusil de Asalto</option>
                                    <option value="subfusil">Subfusil</option>
                                    <option value="ametralladora">Ametralladora ligera</option>
                                    <option value="francotirador">Francotirador</option>
                                    <option value="escopeta">Escopeta</option>
                                    <option value="pistola">Pistola</option>
                                    <option value="lanzacohetes">Lanzacohetes</option>
                                    <option value="especial">Especial</option>
                                    <option value="maravillosa">Maravillosa</option>
                                </select>
                            </div>
                        </div>

                        {/* Imagen y Juego */}
                        <div className='form-group'>
                            <div>
                                <label htmlFor="juego">Juego *</label>
                                <select id="juego" value={armaActual.juego} onChange={manejarCambioJuegos} required>
                                    <option value="WAW">World at War</option>
                                    <option value="BO1">Black Ops 1</option>
                                    <option value="BO2">Black Ops 2</option>
                                    <option value="BO3">Black Ops 3</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <div>
                                <label htmlFor="imagen">Imagen</label>
                                <input type="file" id="imagen" onChange={manejarCambioImagen} />
                                {armaActual.imagen && <img src={armaActual.imagen} alt="" />}
                            </div>
                        </div>
                        {/* Daño */}
                        <div className='form-group'>
                            <label className='toggle-label-normal'>
                                <input
                                    type="checkbox"
                                    checked={dañoInfinito}
                                    onChange={(e) => setDañoInfinito(e.target.checked)}
                                />
                                {' '} Daño infinito
                            </label>
                            {!dañoInfinito && (
                                <input
                                    type="number"
                                    id="daño"
                                    value={armaActual.daño === 'infinito' ? 0 : armaActual.daño}
                                    onChange={manejarInputCambio}
                                    required={!dañoInfinito}
                                />
                            )}
                        </div>

                        {/* Multiplicadores base */}
                        <div className='form-group'>
                            <label>Multiplicadores de Daño *</label>
                            <div>
                                {['cabeza', 'torso', 'abdomen'].map((parte) => (
                                    <div key={parte}>
                                        <label htmlFor={parte}>
                                            {parte.charAt(0).toUpperCase() + parte.slice(1)}
                                        </label>
                                        <input
                                            type="number"
                                            id={parte}
                                            value={armaActual.multiplicadores[parte]}
                                            onChange={(e) => manejarCambioMultiplicador(parte, e.target.value)}
                                            step="0.05"
                                            min="0"
                                            required
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Cargador, Reserva, Cadencia, Recarga */}
                        <div className='form-group'>
                            <div>
                                <label htmlFor="cargador">Cargador *</label>
                                <input type="number" id="cargador" value={armaActual.cargador} onChange={manejarInputCambio} min="1" required />
                            </div>
                            <div>
                                <label htmlFor="reserva">Reserva *</label>
                                <label className='toggle-label-normal' style={{ fontSize: '0.8rem', color: '#aaa' }}>
                                    <input
                                        type="checkbox"
                                        checked={municionInfinita}
                                        onChange={(e) => setMunicionInfinita(e.target.checked)}
                                    />
                                    {' '} Infinita
                                </label>
                                {!municionInfinita && (
                                    <input
                                        type="number"
                                        id="reserva"
                                        value={armaActual.reserva === 'infinito' ? 0 : armaActual.reserva}
                                        onChange={manejarInputCambio}
                                        min="0"
                                        required={!municionInfinita}
                                    />
                                )}
                            </div>
                            <div>
                                <label htmlFor="cadencia">Cadencia *</label>
                                <input type="number" id="cadencia" value={armaActual.cadencia} onChange={manejarInputCambio} min="0" required />
                            </div>
                            <div>
                                <label htmlFor="recarga">Recarga *</label>
                                <input type="number" id="recarga" value={armaActual.recarga} onChange={manejarInputCambio} min="0" step="0.01" required />
                            </div>
                        </div>

                        {/* Descripción */}
                        <div className='form-group'>
                            <label htmlFor="descripcion">Descripción *</label>
                            <textarea
                                id="descripcion"
                                value={armaActual.descripcion || ''}
                                onChange={manejarInputCambio}
                                required
                                placeholder="Descripción del arma"
                            />
                        </div>

                        {/* ── TOGGLE PACK-A-PUNCH ──────────────────────────────── */}
                        <div className="form-group pap-toggle">
                            <label className="toggle-label">
                                {/* El checkbox activa/desactiva la sección PAP */}
                                <input
                                    type="checkbox"
                                    checked={mostrarPAP}
                                    onChange={(e) => {
                                        setMostrarPAP(e.target.checked);
                                        setTienePAP(e.target.checked);
                                    }}
                                />
                                ⬆️ Incluir versión Pack-a-Punch
                            </label>
                        </div>

                        {/* ── SECCIÓN PAP (solo visible si el toggle está activo) ── */}
                        {mostrarPAP && (
                            <div className="pap-seccion">
                                <h3>⬆️ Pack-a-Punch</h3>

                                {/* Nombre PAP */}
                                <div className='form-group'>
                                    <label htmlFor="papNombre">Nombre PAP *</label>
                                    <input
                                        type="text"
                                        id="papNombre"
                                        value={armaActual.papNombre}
                                        onChange={manejarInputCambio}
                                        required={mostrarPAP}   // Solo obligatorio si el toggle está activo
                                        placeholder="Ej: The Afterburner"
                                    />
                                </div>

                                {/* Daño PAP */}
                                <div className='form-group'>
                                    <label className='toggle-label'>
                                        <input
                                            type="checkbox"
                                            checked={dañoPapInfinito}
                                            onChange={(e) => setDañoPapInfinito(e.target.checked)}
                                        />
                                        {' '} Daño infinito
                                    </label>
                                    {!dañoPapInfinito && (
                                        <input
                                            type="number"
                                            id="papDaño"
                                            value={armaActual.papDaño === 'infinito' ? 0 : armaActual.papDaño}
                                            onChange={manejarInputCambio}
                                            required={!dañoInfinito}
                                        />
                                    )}
                                </div>

                                {/* Multiplicadores PAP */}
                                <div className='form-group'>
                                    <label>Multiplicadores PAP *</label>
                                    <div>
                                        {['cabeza', 'torso', 'abdomen'].map((parte) => (
                                            <div key={parte}>
                                                <label htmlFor={`pap-${parte}`}>
                                                    {parte.charAt(0).toUpperCase() + parte.slice(1)}
                                                </label>
                                                <input
                                                    type="number"
                                                    // El id usa "pap-" para diferenciarlo de los multiplicadores base
                                                    id={`pap-${parte}`}
                                                    value={armaActual.papMultiplicadores[parte]}
                                                    onChange={(e) => manejarCambioMultiplicadorPAP(parte, e.target.value)}
                                                    step="0.05"
                                                    min="0"
                                                    required={mostrarPAP}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Cargador, Reserva, Cadencia, Recarga PAP */}
                                <div className='form-group'>
                                    <div>
                                        <label htmlFor="papCargador">Cargador PAP *</label>
                                        <input type="number" id="papCargador" value={armaActual.papCargador} onChange={manejarInputCambio} min="1" required={mostrarPAP} />
                                    </div>
                                    <div>
                                        <label htmlFor="papReserva">Reserva *</label>
                                        <label className='toggle-label' style={{ fontSize: '0.8rem', color: '#aaa' }}>
                                            <input
                                                type="checkbox"
                                                checked={reservaPapInfinita}
                                                onChange={(e) => setReservaPapInfinita(e.target.checked)}
                                            />
                                            {' '} Infinita
                                        </label>
                                        {!reservaPapInfinita && (
                                            <input
                                                type="number"
                                                id="papReserva"
                                                value={armaActual.papReserva === 'infinito' ? 0 : armaActual.papReserva}
                                                onChange={manejarInputCambio}
                                                min="0"
                                                required={!reservaPapInfinita}
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="papCadencia">Cadencia PAP *</label>
                                        <input type="number" id="papCadencia" value={armaActual.papCadencia} onChange={manejarInputCambio} min="0" required={mostrarPAP} />
                                    </div>
                                    <div>
                                        <label htmlFor="papRecarga">Recarga PAP *</label>
                                        <input type="number" id="papRecarga" value={armaActual.papRecarga} onChange={manejarInputCambio} min="0" step="0.01" required={mostrarPAP} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── BOTONES ──────────────────────────────────────────── */}
                        <div className="form-actions">
                            <button type="submit" className="btn-save" disabled={cargando}>
                                💾 {modoEdicion ? 'Actualizar' : 'Crear'} Arma
                            </button>
                            <button type="button" onClick={cerrarFormulario} className="btn-cancel">
                                ❌ Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default Armas;