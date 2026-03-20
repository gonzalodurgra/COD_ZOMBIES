// src/components/ArmaCard.jsx
// Tarjeta individual de arma, extraída de Weapons.jsx

import { useState } from 'react';

function ArmaCard({ usuario, iteraciones, onEditar, onEliminar, capacidadCampeoMaxima, eficienciaMaximo, dpsMaximo }) {

    const [viendoPAP, setViendoPAP] = useState(false);
    const [juegoActivo, setJuegoActivo] = useState(iteraciones[0].juego);


    const arma = iteraciones.find(a => a.juego === juegoActivo) || iteraciones[0];
    // Según el modo, mostramos los datos base o los del Pack-a-Punch
    const nombre = viendoPAP && arma.papNombre ? arma.papNombre : arma.nombre;
    const imagen = arma.imagen;
    const daño = viendoPAP && arma.papDaño ? arma.papDaño : arma.daño;
    const multiplicadores = viendoPAP && arma.papMultiplicadores
        ? arma.papMultiplicadores
        : arma.multiplicadores;
    const cargador = viendoPAP && arma.papCargador ? arma.papCargador : arma.cargador;
    const reserva = viendoPAP && arma.papReserva ? arma.papReserva : arma.reserva;
    const cadencia = viendoPAP && arma.papCadencia ? arma.papCadencia : arma.cadencia;
    const recarga = viendoPAP && arma.papRecarga ? arma.papRecarga : arma.recarga;

    // Recalculamos las barras con los datos activos (base o PAP)
    const capacidadCampeo = ((cargador * daño * multiplicadores.cabeza) + (cargador * daño * multiplicadores.torso)) / recarga / 4;
    const eficiencia = ((daño * multiplicadores.cabeza) + (daño * multiplicadores.torso)) * (reserva + cargador) / 4;
    const dps = ((daño * cadencia * multiplicadores.cabeza) + (daño * cadencia * multiplicadores.torso)) / 4;

    const cambiarJuego = (juego) => {
        setJuegoActivo(juego);
        setViendoPAP(false);
    };

    return (
        <div className={`arma-card ${viendoPAP ? 'pap-activo' : ''}`}>

            <img src={imagen} alt={nombre} />

            {/* Nombre */}
            <h3>{nombre}</h3>

            {/* Botones de juego — uno por iteración */}
            <div className="game-tags">
                {iteraciones.map(it => (
                    <button
                        key={it.juego}
                        className={`${it.juego === juegoActivo ? 'game-tag--activo' : 'game-tag'}`}
                        onClick={() => cambiarJuego(it.juego)}
                    >
                        {it.juego}
                    </button>
                ))}
            </div>

            {/* Información del arma */}
            <div className="arma-info">

                <div className="info-row">
                    <span className="label">Tipo:</span>
                    <span className="value value-tipo">{arma.tipo}</span>
                </div>

                <div className="info-row">
                    <span className="label">Daño:</span>
                    <span className="value">{daño === 'infinito' ? '∞' : daño}</span>
                </div>

                <div className="info-row">
                    <div className="label">Cargador</div>
                    <span className="value">{cargador}</span>
                </div>

                <div className="info-row">
                    <span className="label">Recarga:</span>
                    <span className="value">{recarga}</span>
                </div>

                {/* Barra: Capacidad de campeo */}
                <div className="stats-bar">
                    <div
                        className="stats-fill"
                        style={{ width: `${daño != "infinito" ? (capacidadCampeo / capacidadCampeoMaxima) * 100 : 100}%` }}
                    ></div>
                </div>

                <div className="info-row">
                    <span className="label">Reserva:</span>
                    <span className="value">{reserva === 'infinito' ? '∞' : reserva}</span>
                </div>

                {/* Barra: Eficiencia */}
                <div className="stats-bar">
                    <div
                        className="stats-fill"
                        style={{ width: `${daño != "infinito" && reserva != "infinito" ? (eficiencia / eficienciaMaximo) * 100 : 100}%` }}
                    ></div>
                </div>

                <div className="info-row">
                    <span className="label">Cadencia:</span>
                    <span className="value">{cadencia}</span>
                </div>

                {/* Barra: DPS */}
                <div className="stats-bar">
                    <div
                        className="stats-fill"
                        style={{ width: `${daño != "infinito" ? (dps / dpsMaximo) * 100 : 100}%` }}
                    ></div>
                </div>

                <p className="descripcion">{arma.descripcion}</p>
            </div>

            {/* Botones de acción */}
            <div className="card-acciones">
                {usuario && <button onClick={() => onEditar(arma)} className="btn-edit">
                    ✏️ Editar
                </button>}
                {usuario && <button onClick={() => onEliminar(arma.id)} className="btn-delete">
                    🗑️ Eliminar
                </button>}
                {/* Botón para alternar */}
                <button onClick={() => setViendoPAP(!viendoPAP)} className={`btn-pap ${viendoPAP ? 'btn-pap--activo' : ''}`}>
                    {viendoPAP ? "⬇️ Base" : "⬆️ PAP"}
                </button>
            </div>
        </div>
    );
}

export default ArmaCard;