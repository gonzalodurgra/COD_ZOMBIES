// src/App.js
// Aplicación principal con CSS Vanilla

import { React, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Armas from './components/armas';
import Ventajas from './components/ventajas';
import './App.css'; // Importamos nuestros estilos CSS
import Mapas from './components/mapas';
import Auth from './components/auth';
import servicioAuth from './services/servicioAuth';
import Navbar from './components/navbar';

function App() {
  // null = invitado, objeto = usuario autenticado
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [mostrarLogin, setMostrarLogin] = useState(false);

  // Al cargar, restaurar sesión si hay token guardado
  useEffect(() => {
    console.log('¿Hay token?', servicioAuth.estaAutenticado());

    if (servicioAuth.estaAutenticado()) {
      servicioAuth.obtenerPerfil()
        .then(perfil => {
          console.log('Perfil obtenido:');
          setUsuario(perfil);
        })
        .catch((err) => {
          console.log('Error perfil:', err);
          servicioAuth.logout();
        })
        .finally(() => {
          console.log('setCargando(false)');
          setCargando(false);
        });
    } else {
      console.log('Sin token, setCargando(false)');
      setCargando(false);
    }
  }, []);

  const handleLogin = (datos) => {
    setUsuario({ username: datos.username, es_admin: datos.es_admin });
    setMostrarLogin(false);
  };
  if (cargando) return null;


  // Si pulsa "Iniciar sesión" desde la pantalla de login
  if (mostrarLogin) {
    return <Auth onLoginExitoso={handleLogin} />;
  }

  return (
    <Router>
      <div className="app-container">
        <Navbar
          usuario={usuario}               // null = invitado
          onLogout={() => setUsuario(null)}
          onIrLogin={() => setMostrarLogin(true)}
        />
        {/* Navegación */}
        <Navigation />

        {/* Contenido principal */}
        <main>
          <Routes>
            <Route path="/" element={<Armas usuario={usuario} />} />
            <Route path="/armas" element={<Armas usuario={usuario} />} />
            <Route path="/ventajas" element={<Ventajas usuario={usuario} />} />
            <Route path="/mapas" element={<Mapas usuario={usuario} />} />
          </Routes>
        </main>
        {/* Footer */}
        <Footer />
      </div>
    </Router>
  );
}

// Componente de Navegación
function Navigation() {
  const location = useLocation();

  // Función para determinar si un link está activo
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navigation">
      <div className="nav-container">

        {/* Título principal */}
        <div className="nav-header">
          <h1 className="nav-title">
            🧟 CALL OF DUTY ZOMBIES 🧟
          </h1>
          <p className="nav-subtitle">
            World at War → Black Ops 4 | Treyarch Encyclopedia
          </p>
        </div>

        {/* Links de navegación */}
        <div className="nav-links">
          <NavLink to="/armas" isActive={isActive('/armas') || isActive('/')}>
            ⚔️ Armas
          </NavLink>
          <NavLink to="/ventajas" isActive={isActive('/ventajas')}>
            🥤 Ventajas
          </NavLink>
          <NavLink to="/mapas" isActive={isActive('/mapas')}>
            🗺️ Mapas
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

// Componente de Link de Navegación reutilizable
function NavLink({ to, isActive, children }) {
  return (
    <Link
      to={to}
      className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
    >
      {children}
    </Link>
  );
}

// Componente "Coming Soon" para páginas en desarrollo
function ComingSoon({ title }) {
  return (
    <div className="coming-soon-container">
      <div className="coming-soon-card">
        <h2 className="coming-soon-title">
          🚧 {title} - Próximamente 🚧
        </h2>
        <p className="coming-soon-text">
          Esta sección está en desarrollo. ¡Pronto estará disponible!
        </p>
        <div className="coming-soon-button-container">
          <Link to="/armas" className="coming-soon-button">
            ← Volver a Armas
          </Link>
        </div>
      </div>
    </div>
  );
}

// Componente de Footer
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p className="footer-title">
          🎮 Call of Duty Zombies Encyclopedia 🎮
        </p>
        <p className="footer-subtitle">
          World at War • Black Ops 1-4
        </p>
        <p className="footer-credits">
          Creado con ⚡ React + FastAPI + CSS
        </p>
      </div>
    </footer>
  );
}

export default App;