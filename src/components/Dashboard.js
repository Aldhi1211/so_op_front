import React, { useState } from 'react';
import './Dashboard.css';
import { Outlet, useNavigate } from 'react-router-dom';

const Dashboard = ({ setIsAuthenticated }) => {
    const navigate = useNavigate();
    const logout = async () => {
        try {
            localStorage.removeItem('isAuthenticated'); // Hapus status autentikasi dari localStorage
            setIsAuthenticated(false); // Set state menjadi false
            navigate('/');
        } catch (error) {
            console.log(error)
        }

    };

    const [isStockMenuOpen, setIsStockMenuOpen] = useState(false);

    const toggleStockMenu = () => {
        setIsStockMenuOpen(!isStockMenuOpen);
    };

    return (
        <div>
            <nav className="navbar has-background-dark has-text-white" role="navigation" aria-label="main navigation">
                <div id="navbarBasicExample" className="navbar-menu">
                    <div className="navbar-start">
                        <a className="navbar-item has-text-white" href='/'>
                            Admin Dashboard
                        </a>
                    </div>
                </div>

                <div className="navbar-end">
                    <div className="navbar-item">
                        <div className="buttons">
                            <button onClick={logout} className="button is-light">
                                Log out
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="dashboard">


                {/* Sidebar */}
                <div className="sidebar has-background-grey">
                    <ul>
                        <li><a href="/dashboard/overview">Overview</a></li>
                        <li><a href="/dashboard/product">Product</a></li>
                        <li><a href="/dashboard/gallery">Gallery</a></li>
                        <li><a href="/dashboard/teams">Teams</a></li>
                        <li><a href="/dashboard/barang">Barang</a></li>
                        <li>
                            <a
                                href="#stock"
                                onClick={(e) => {
                                    e.preventDefault();
                                    toggleStockMenu();
                                }}
                                className="has-text-white"
                            >
                                Stock
                            </a>
                            <ul className={`submenu ${isStockMenuOpen ? 'show' : ''}`}>
                                <li><a href="/dashboard/stock/overview">Stock Overview</a></li>
                                <li><a href="/dashboard/stock/in">Stock In</a></li>
                                <li><a href="/dashboard/stock/out">Stock Out</a></li>
                            </ul>
                        </li>
                        <li><a href="/dashboard/users">Users</a></li>
                    </ul>
                </div>


                {/* Main Content */}
                <div className="main-content">
                    <Outlet />
                </div>
            </div>
        </div>

    );
};

export default Dashboard;
