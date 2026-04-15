import React from 'react';
import './Dashboard.css';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const Dashboard = ({ setIsAuthenticated }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const accessToken = localStorage.getItem('accessToken');
    let userName = 'Admin';
    let userRole = 'Admin';
    if (accessToken) {
        try {
            const decoded = jwtDecode(accessToken);
            userName = decoded.name || 'Admin';
            userRole = decoded.role || 'Admin';
        } catch (_) {}
    }
    const initials = userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    const logout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('accessToken');
        setIsAuthenticated(false);
        navigate('/login');
    };

    return (
        <div className="ds-shell">
            {/* Sidebar */}
            <aside className="ds-sidebar">
                <div className="ds-sb-logo">
                    <div className="ds-sb-logo-sq">
                        <svg viewBox="0 0 16 16"><path d="M2 2h5v5H2zm7 0h5v5H9zm-7 7h5v5H2zm7 0h5v5H9z" /></svg>
                    </div>
                    <div>
                        <div className="ds-sb-logo-name">PTI Admin</div>
                        <div className="ds-sb-logo-sub">Pangan Terbaik Indonesia</div>
                    </div>
                </div>

                <div className="ds-sb-section">Menu Utama</div>

                <Link to="/dashboard/overview" className={`ds-nav-item${isActive('/dashboard/overview') ? ' active' : ''}`}>
                    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h5v5H2zm7 0h5v5H9zm-7 7h5v5H2zm7 0h5v5H9z" /></svg>
                    Dashboard
                </Link>

                <Link to="/dashboard/product" className={`ds-nav-item${isActive('/dashboard/product') ? ' active' : ''}`}>
                    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm1 2v8h8V4H4zm1 1h6v1H5zm0 2h6v1H5zm0 2h4v1H5z" /></svg>
                    Product
                </Link>

                <Link to="/dashboard/gallery" className={`ds-nav-item${isActive('/dashboard/gallery') ? ' active' : ''}`}>
                    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M1 1h14v14H1V1zm1 1v12h12V2H2zm1 9l3-4 2 3 2-2 3 3H3z" /></svg>
                    Gallery
                </Link>

                <Link to="/dashboard/teams" className={`ds-nav-item${isActive('/dashboard/teams') ? ' active' : ''}`}>
                    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M5 4a3 3 0 100 6 3 3 0 000-6zm6 1a2 2 0 100 4 2 2 0 000-4zM2 12c0-2 1.5-3 3-3h1c.5 0 1 .1 1.5.3A4 4 0 005 13H2v-1zm7 0c0-1.2.6-2.2 1.5-2.8.3-.1.7-.2 1-.2h.5c1.5 0 3 1 3 3v1h-6v-1z" /></svg>
                    Teams
                </Link>

                <Link to="/dashboard/barang" className={`ds-nav-item${isActive('/dashboard/barang') ? ' active' : ''}`}>
                    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l7 4v6l-7 4-7-4V5l7-4zm0 2L2.5 6 8 9.1 13.5 6 8 3zM2 7.1v3.4L7.5 13V9.6L2 7.1zm7.5 2.5V13L15 10.5V7.1L9.5 9.6z" /></svg>
                    Barang
                </Link>

                <div className="ds-sb-section">Stok</div>

                <Link to="/dashboard/stock/in" className={`ds-nav-item${isActive('/dashboard/stock/in') ? ' active' : ''}`}>
                    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 2v9M4 7l4 4 4-4M3 13h10" /></svg>
                    Stok Masuk
                </Link>

                <Link to="/dashboard/stock/out" className={`ds-nav-item${isActive('/dashboard/stock/out') ? ' active' : ''}`}>
                    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 14V5M4 9l4-4 4 4M3 3h10" /></svg>
                    Stok Keluar
                </Link>

                <Link to="/dashboard/stock/overview" className={`ds-nav-item${isActive('/dashboard/stock/overview') ? ' active' : ''}`}>
                    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 12h12M2 8h12M2 4h12" /></svg>
                    Stock Overview
                </Link>

                <div className="ds-sb-section">Lainnya</div>

                <Link to="/dashboard/users" className={`ds-nav-item${isActive('/dashboard/users') ? ' active' : ''}`}>
                    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a3 3 0 100 6 3 3 0 000-6zM3 13c0-2.5 2-4 5-4s5 1.5 5 4v1H3v-1z" /></svg>
                    Users
                </Link>

                <Link to="/dashboard/messages" className={`ds-nav-item${isActive('/dashboard/messages') ? ' active' : ''}`}>
                    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h12a1 1 0 011 1v7a1 1 0 01-1 1H9l-3 3v-3H2a1 1 0 01-1-1V3a1 1 0 011-1z"/></svg>
                    Pesan
                </Link>

                <div className="ds-sb-bottom">
                    <div className="ds-user-row">
                        <div className="ds-user-av">{initials}</div>
                        <div>
                            <div className="ds-user-name">{userName}</div>
                            <div className="ds-user-role">{userRole}</div>
                        </div>
                        <button className="ds-logout-btn" onClick={logout} title="Logout">
                            ⎋
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main */}
            <div className="ds-main">
                <Outlet />
            </div>
        </div>
    );
};

export default Dashboard;
