// src/components/VentajaCard.jsx

function VentajaCard({ usuario, ventaja, onEditar, onEliminar }) {

    const obtenerClaseCoste = (precio) => {
        if (precio <= 1500) return 'coste-bajo';
        if (precio <= 2500) return 'coste-medio';
        return 'coste-alto';
    };

    return (
        <div className="perk-card">
            <div className="perk-icon">
                <img src={ventaja.imagen} alt={ventaja.nombre} />
            </div>

            <h3 className="perk-name">{ventaja.nombre}</h3>

            <div className="perk-info">
                <div className="info-row">
                    <span className="label">Precio:</span>
                    <span className={`value ${obtenerClaseCoste(ventaja.precio)}`}>
                        {ventaja.precio}
                    </span>
                </div>
                <div className="info-row">
                    <span className="label">Efecto:</span>
                    <span className="value">{ventaja.efecto}</span>
                </div>
                <div className="game-tags">
                    {ventaja.juegos?.map((juego, index) => (
                        <span key={index} className="game-tag">{juego}</span>
                    ))}
                </div>
            </div>

            {onEditar && onEliminar && (
                <div className="card-actions">
                    {usuario && <button className="btn-edit" onClick={() => onEditar(ventaja)}>
                        ✏️ Editar
                    </button>
                    }
                    {usuario && <button className="btn-delete" onClick={() => onEliminar(ventaja.id)}>
                        🗑️ Eliminar
                    </button>}
                </div>
            )}
        </div>
    );
}

export default VentajaCard;