import { useState } from "react";

function MapaCard({ usuario, iteraciones, onEditar, onEliminar, colorDificultad, onVerArmas, onVerVentajas }) {

    const [juegoActivo, setJuegoActivo] = useState(iteraciones[0].juego);

    // Mapa activo según el juego seleccionado
    const mapa = iteraciones.find(m => m.juego === juegoActivo) || iteraciones[0];

    return (
        <div key={mapa.id} className="mapa-card">

            <div className="mapa-imagen-wrapper">
                <img src={mapa.imagen} alt={mapa.nombre} className="mapa-imagen" />
                <span
                    className="badge-dificultad"
                    style={{ color: colorDificultad(mapa.dificultad), borderColor: colorDificultad(mapa.dificultad) }}
                >
                    {mapa.dificultad}
                </span>
            </div>

            <div className="mapa-info">
                <h3>{mapa.nombre}</h3>

                {/* Botones de juego — uno por iteración */}
                <div className="game-tags">
                    {iteraciones.map(it => (
                        <button
                            key={it.juego}
                            className={`${it.juego === juegoActivo ? 'game-tag--activo' : 'game-tag'}`}
                            onClick={() => setJuegoActivo(it.juego)}
                        >
                            {it.juego}
                        </button>
                    ))}
                </div>


                <p className="mapa-descripcion">{mapa.descripcion}</p>

                <div className="mapa-stats">
                    <div className="stat-item" onClick={() => onVerArmas(mapa)}>
                        <span className="stat-icono">🔫</span>
                        <span className="stat-valor">{mapa.armas?.length ?? 0}</span>
                        <span className="stat-label">Armas</span>
                    </div>
                    <div className="stat-item" onClick={() => onVerVentajas(mapa)}>
                        <span className="stat-icono">💊</span>
                        <span className="stat-valor">{mapa.ventajas?.length ?? 0}</span>
                        <span className="stat-label">Ventajas</span>
                    </div>
                </div>

                <div className="card-acciones">
                    {usuario && <button onClick={() => onEditar(mapa)} className="btn-edit">✏️ Editar</button>}
                    {usuario && <button onClick={() => onEliminar(mapa.id)} className="btn-delete">🗑️ Eliminar</button>}
                </div>
            </div>
        </div>
    );
}

export default MapaCard