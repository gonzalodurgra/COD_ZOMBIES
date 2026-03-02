// src/components/Navbar.jsx
// Cabecera con perfil, dropdown y modo invitado

import React, { useState, useEffect, useRef } from 'react';
import servicioAuth from '../services/servicioAuth';
import './navbar.css';

function Navbar({ usuario, onLogout, onIrLogin }) {
    /*
    Props:
    - usuario: objeto con { username, nombre_completo, email, es_admin } | null si es invitado
    - onLogout: función a llamar al cerrar sesión
    - onIrLogin: función a llamar cuando el invitado pulse "Iniciar sesión"
    */

    const [dropdownAbierto, setDropdownAbierto] = useState(false);
    const dropdownRef = useRef(null);

    const esInvitado = !usuario;
    const esAdmin = usuario?.es_admin === true;

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickFuera = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownAbierto(false);
            }
        };
        document.addEventListener('mousedown', handleClickFuera);
        return () => document.removeEventListener('mousedown', handleClickFuera);
    }, []);

    const handleLogout = () => {
        setDropdownAbierto(false);
        servicioAuth.logout();
        onLogout();
    };

    // Obtener inicial del usuario para el avatar
    const obtenerInicial = () => {
        if (esInvitado) return '👤';
        return (usuario.nombre_completo || usuario.username || '?')[0].toUpperCase();
    };

    return (
        <nav className="navbar">

            {/* Logo */}
            <span className="navbar-logo">🧟 COD ZOMBIES</span>

            {/* Links de navegación */}
            <ul className="navbar-links">
                <li><a href="#armas">Armas</a></li>
                <li><a href="#ventajas">Ventajas</a></li>
                <li><a href="#mapas">Mapas</a></li>
            </ul>

            {/* Zona derecha */}
            <div className="navbar-right" ref={dropdownRef}>

                {/* Si es invitado: badge + botón login */}
                {esInvitado && (
                    <>
                        <span className="guest-badge">Invitado</span>
                        <button className="navbar-login-btn" onClick={onIrLogin}>
                            Iniciar sesión
                        </button>
                    </>
                )}

                {/* Si está autenticado: avatar con dropdown */}
                {!esInvitado && (
                    <>
                        <button
                            className="avatar-btn"
                            onClick={() => setDropdownAbierto(v => !v)}
                            aria-expanded={dropdownAbierto}
                            aria-haspopup="true"
                        >
                            <div className="avatar-icon">{obtenerInicial()}</div>
                            <div className="avatar-info">
                                <span className="avatar-username">{usuario.username}</span>
                                <span className={`avatar-role ${esAdmin ? 'admin' : 'user'}`}>
                                    {esAdmin ? '⭐ Admin' : 'Usuario'}
                                </span>
                            </div>
                            <span className="avatar-chevron">▼</span>
                        </button>

                        {/* Dropdown */}
                        {dropdownAbierto && (
                            <div className="profile-dropdown">

                                {/* Info del usuario */}
                                <div className="dropdown-header">
                                    <div className="dropdown-name">{usuario.nombre_completo}</div>
                                    {usuario.email && (
                                        <div className="dropdown-email">{usuario.email}</div>
                                    )}
                                    <span className={`dropdown-badge ${esAdmin ? 'admin' : 'user'}`}>
                                        {esAdmin ? '⭐ Administrador' : '🧟 Superviviente'}
                                    </span>
                                </div>

                                {/* Acciones */}
                                <button
                                    className="dropdown-item danger"
                                    onClick={handleLogout}
                                >
                                    <span className="dropdown-item-icon">🚪</span>
                                    Cerrar sesión
                                </button>

                            </div>
                        )}
                    </>
                )}

            </div>
        </nav>
    );
}

export default Navbar;