import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import './Layout.css';

const Layout = () => {
  const location = useLocation();

  return (
    <div className="layout">
      <header className="app-header">
        <div className="logo">
          <Link to="/">
            <span className="logo-icon">▶</span>
            <span className="logo-text">YouTube Clone</span>
          </Link>
        </div>
        
        <div className="header-controls">
          <input 
            type="text" 
            className="search-bar" 
            placeholder="Search videos..."
          />
          <div className="header-actions">
            <button className="upload-btn">
              <Link to="/add-video">Add Video</Link>
            </button>
            <button className="user-btn">👤</button>
          </div>
        </div>
      </header>

      <nav className="main-nav">
        <div className="nav-container">
<a 
  href="https://youtube.com" 
  target="_blank" 
  rel="noopener noreferrer"
  className="nav-link"
>
  Youtube
</a>

          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link 
            to="/my-library" 
            className={`nav-link ${location.pathname === '/my-library' ? 'active' : ''}`}
          >
            My Library
          </Link>
          <Link 
            to="/downloader" 
            className={`nav-link ${location.pathname === '/downloader' ? 'active' : ''}`}
          >
            Downloader
          </Link>

        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="app-footer">
        <p>YouTube Clone - Learning Project • Made with React & Vite</p>
        <div className="footer-links">
          <span>Spacebar: Play/Pause • Hold for 2x Speed</span>
          <span>K: Play/Pause • J/L: Skip 10s • F: Fullscreen</span>
        </div>
      </footer>
    </div>
  );
};

export default Layout;