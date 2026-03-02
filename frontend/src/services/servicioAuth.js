// src/services/servicioAuth.js
// Servicio para manejar autenticación (login, registro, sesión)

const AUTH_URL = process.env.REACT_APP_API_URL_AUTH || 'http://localhost:8000/auth';

class ServicioAuth {

    // ========================================
    // REGISTRO
    // ========================================

    async registrar(datosUsuario) {
        /*
        Registra un nuevo usuario.
    
        Parámetros:
        - datosUsuario: { username, email, nombre_completo, password }
    
        Retorna: objeto UsuarioDB (sin password)
        */
        const response = await fetch(`${AUTH_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosUsuario)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Error al registrar usuario');
        }

        return data;
    }

    // ========================================
    // LOGIN
    // ========================================

    async login(username, password) {
        /*
        Inicia sesión y guarda el token en localStorage.
    
        Parámetros:
        - username: string
        - password: string
    
        Retorna: objeto Token { access_token, token_type, username, es_admin }
        */
        const response = await fetch(`${AUTH_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Usuario o contraseña incorrectos');
        }

        // Guardar token y datos de sesión
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('es_admin', data.es_admin);

        return data;
    }

    // ========================================
    // LOGOUT
    // ========================================

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('es_admin');
    }

    // ========================================
    // OBTENER PERFIL ACTUAL
    // ========================================

    async obtenerPerfil() {
        /*
        Obtiene el perfil del usuario autenticado (GET /auth/me).
    
        Retorna: objeto UsuarioDB
        */
        const token = this.obtenerToken();

        if (!token) throw new Error('No hay sesión activa');

        const response = await fetch(`${AUTH_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Error al obtener perfil');
        }

        return data;
    }

    // ========================================
    // HELPERS DE SESIÓN
    // ========================================

    obtenerToken() {
        return localStorage.getItem('token');
    }

    estaAutenticado() {
        return !!this.obtenerToken();
    }

    esAdmin() {
        return localStorage.getItem('es_admin') === 'true';
    }

    obtenerUsername() {
        return localStorage.getItem('username');
    }

    // Cabeceras con token para peticiones protegidas
    obtenerHeaders() {
        return {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.obtenerToken()}`
        };
    }
}

export default new ServicioAuth();