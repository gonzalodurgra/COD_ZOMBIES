// src/components/Auth.jsx
// Componente unificado de Login y Registro - COD Zombies Theme

import React, { useState } from 'react';
import servicioAuth from '../services/servicioAuth';
import './auth.css';

// ============================================================
// SUBCOMPONENTE: LOGIN
// ============================================================
function Login({ onLoginExitoso, irARegistro }) {
    const [form, setForm] = useState({ username: '', password: '' });
    const [errores, setErrores] = useState({});
    const [errorGeneral, setErrorGeneral] = useState('');
    const [cargando, setCargando] = useState(false);

    const validar = () => {
        const nuevosErrores = {};
        if (!form.username.trim()) nuevosErrores.username = 'El usuario es obligatorio';
        if (!form.password) nuevosErrores.password = 'La contraseña es obligatoria';
        return nuevosErrores;
    };

    const manejarCambio = (e) => {
        const { id, value } = e.target;
        setForm(prev => ({ ...prev, [id]: value }));
        // Limpiar error del campo al escribir
        if (errores[id]) setErrores(prev => ({ ...prev, [id]: '' }));
    };

    const manejarSubmit = async (e) => {
        e.preventDefault();
        setErrorGeneral('');

        const nuevosErrores = validar();
        if (Object.keys(nuevosErrores).length > 0) {
            setErrores(nuevosErrores);
            return;
        }

        setCargando(true);
        try {
            const datos = await servicioAuth.login(form.username, form.password);
            onLoginExitoso(datos);
        } catch (err) {
            setErrorGeneral(err.message);
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">

                {/* Cabecera */}
                <div className="auth-header">
                    <div className="auth-logo">🧟 COD ZOMBIES</div>
                    <p className="auth-subtitle">Accede a tu cuenta</p>
                </div>

                {/* Formulario */}
                <div className="auth-body">
                    {errorGeneral && (
                        <div className="auth-error-banner">⚠️ {errorGeneral}</div>
                    )}

                    <form className="auth-form" onSubmit={manejarSubmit} noValidate>

                        {/* Usuario */}
                        <div className="auth-field">
                            <label className="auth-label" htmlFor="username">Usuario</label>
                            <div className="auth-input-wrapper">
                                <input
                                    className={`auth-input ${errores.username ? 'error' : ''}`}
                                    type="text"
                                    id="username"
                                    value={form.username}
                                    onChange={manejarCambio}
                                    placeholder="Tu nombre de usuario"
                                    autoComplete="username"
                                />
                            </div>
                            {errores.username && (
                                <span className="auth-field-error">{errores.username}</span>
                            )}
                        </div>

                        {/* Contraseña */}
                        <div className="auth-field">
                            <label className="auth-label" htmlFor="password">Contraseña</label>
                            <div className="auth-input-wrapper">
                                <input
                                    className={`auth-input ${errores.password ? 'error' : ''}`}
                                    type="password"
                                    id="password"
                                    value={form.password}
                                    onChange={manejarCambio}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                />
                            </div>
                            {errores.password && (
                                <span className="auth-field-error">{errores.password}</span>
                            )}
                        </div>

                        {/* Botón */}
                        <button className="auth-btn" type="submit" disabled={cargando}>
                            {cargando && <span className="auth-spinner" />}
                            {cargando ? 'Accediendo...' : 'Iniciar Sesión'}
                        </button>

                    </form>
                </div>

                {/* Pie */}
                <div className="auth-footer">
                    ¿No tienes cuenta?
                    <button className="auth-link" onClick={irARegistro}>
                        Regístrate aquí
                    </button>
                </div>

            </div>
        </div>
    );
}

// ============================================================
// SUBCOMPONENTE: REGISTRO
// ============================================================
function Registro({ onRegistroExitoso, irALogin }) {
    const [form, setForm] = useState({
        username: '',
        email: '',
        nombre_completo: '',
        password: '',
        confirmarPassword: ''
    });
    const [errores, setErrores] = useState({});
    const [errorGeneral, setErrorGeneral] = useState('');
    const [exito, setExito] = useState('');
    const [cargando, setCargando] = useState(false);

    const validar = () => {
        const nuevosErrores = {};

        if (!form.username.trim())
            nuevosErrores.username = 'El usuario es obligatorio';
        else if (form.username.length < 3)
            nuevosErrores.username = 'Mínimo 3 caracteres';

        if (!form.email.trim())
            nuevosErrores.email = 'El email es obligatorio';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            nuevosErrores.email = 'Email no válido';

        if (!form.nombre_completo.trim())
            nuevosErrores.nombre_completo = 'El nombre completo es obligatorio';

        if (!form.password)
            nuevosErrores.password = 'La contraseña es obligatoria';
        else if (form.password.length < 6)
            nuevosErrores.password = 'Mínimo 6 caracteres';

        if (!form.confirmarPassword)
            nuevosErrores.confirmarPassword = 'Confirma tu contraseña';
        else if (form.password !== form.confirmarPassword)
            nuevosErrores.confirmarPassword = 'Las contraseñas no coinciden';

        return nuevosErrores;
    };

    const manejarCambio = (e) => {
        const { id, value } = e.target;
        setForm(prev => ({ ...prev, [id]: value }));
        if (errores[id]) setErrores(prev => ({ ...prev, [id]: '' }));
    };

    const manejarSubmit = async (e) => {
        e.preventDefault();
        setErrorGeneral('');
        setExito('');

        const nuevosErrores = validar();
        if (Object.keys(nuevosErrores).length > 0) {
            setErrores(nuevosErrores);
            return;
        }

        setCargando(true);
        try {
            // Enviamos solo los campos que espera la API
            const { confirmarPassword, ...datosParaApi } = form;
            await servicioAuth.registrar(datosParaApi);
            setExito('¡Cuenta creada! Redirigiendo al login...');
            setTimeout(() => onRegistroExitoso(), 1500);
        } catch (err) {
            setErrorGeneral(err.message);
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">

                {/* Cabecera */}
                <div className="auth-header">
                    <div className="auth-logo">🧟 COD ZOMBIES</div>
                    <p className="auth-subtitle">Crea tu cuenta</p>
                </div>

                {/* Formulario */}
                <div className="auth-body">
                    {errorGeneral && (
                        <div className="auth-error-banner">⚠️ {errorGeneral}</div>
                    )}
                    {exito && (
                        <div className="auth-success-banner">✅ {exito}</div>
                    )}

                    <form className="auth-form" onSubmit={manejarSubmit} noValidate>

                        {/* Username */}
                        <div className="auth-field">
                            <label className="auth-label" htmlFor="username">Usuario</label>
                            <input
                                className={`auth-input ${errores.username ? 'error' : ''}`}
                                type="text"
                                id="username"
                                value={form.username}
                                onChange={manejarCambio}
                                placeholder="Ej: DarkSlayer99"
                                autoComplete="username"
                            />
                            {errores.username && (
                                <span className="auth-field-error">{errores.username}</span>
                            )}
                        </div>

                        {/* Email */}
                        <div className="auth-field">
                            <label className="auth-label" htmlFor="email">Email</label>
                            <input
                                className={`auth-input ${errores.email ? 'error' : ''}`}
                                type="email"
                                id="email"
                                value={form.email}
                                onChange={manejarCambio}
                                placeholder="tu@email.com"
                                autoComplete="email"
                            />
                            {errores.email && (
                                <span className="auth-field-error">{errores.email}</span>
                            )}
                        </div>

                        {/* Nombre completo */}
                        <div className="auth-field">
                            <label className="auth-label" htmlFor="nombre_completo">Nombre completo</label>
                            <input
                                className={`auth-input ${errores.nombre_completo ? 'error' : ''}`}
                                type="text"
                                id="nombre_completo"
                                value={form.nombre_completo}
                                onChange={manejarCambio}
                                placeholder="Tu nombre y apellidos"
                                autoComplete="name"
                            />
                            {errores.nombre_completo && (
                                <span className="auth-field-error">{errores.nombre_completo}</span>
                            )}
                        </div>

                        {/* Contraseña */}
                        <div className="auth-field">
                            <label className="auth-label" htmlFor="password">Contraseña</label>
                            <input
                                className={`auth-input ${errores.password ? 'error' : ''}`}
                                type="password"
                                id="password"
                                value={form.password}
                                onChange={manejarCambio}
                                placeholder="Mínimo 6 caracteres"
                                autoComplete="new-password"
                            />
                            {errores.password && (
                                <span className="auth-field-error">{errores.password}</span>
                            )}
                        </div>

                        {/* Confirmar contraseña */}
                        <div className="auth-field">
                            <label className="auth-label" htmlFor="confirmarPassword">Confirmar contraseña</label>
                            <input
                                className={`auth-input ${errores.confirmarPassword ? 'error' : ''}`}
                                type="password"
                                id="confirmarPassword"
                                value={form.confirmarPassword}
                                onChange={manejarCambio}
                                placeholder="Repite tu contraseña"
                                autoComplete="new-password"
                            />
                            {errores.confirmarPassword && (
                                <span className="auth-field-error">{errores.confirmarPassword}</span>
                            )}
                        </div>

                        {/* Botón */}
                        <button className="auth-btn" type="submit" disabled={cargando}>
                            {cargando && <span className="auth-spinner" />}
                            {cargando ? 'Creando cuenta...' : 'Crear Cuenta'}
                        </button>

                    </form>
                </div>

                {/* Pie */}
                <div className="auth-footer">
                    ¿Ya tienes cuenta?
                    <button className="auth-link" onClick={irALogin}>
                        Inicia sesión
                    </button>
                </div>

            </div>
        </div>
    );
}

// ============================================================
// COMPONENTE PRINCIPAL: AUTH (controla Login/Registro)
// ============================================================
function Auth({ onLoginExitoso }) {
    const [vista, setVista] = useState('login'); // 'login' | 'registro'

    const handleLoginExitoso = (datos) => {
        if (onLoginExitoso) onLoginExitoso(datos);
    };

    const handleRegistroExitoso = () => {
        setVista('login');
    };

    if (vista === 'registro') {
        return (
            <Registro
                onRegistroExitoso={handleRegistroExitoso}
                irALogin={() => setVista('login')}
            />
        );
    }

    return (
        <Login
            onLoginExitoso={handleLoginExitoso}
            irARegistro={() => setVista('registro')}
        />
    );
}

export default Auth;