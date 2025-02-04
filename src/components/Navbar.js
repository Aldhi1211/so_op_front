import React from 'react'
import axios from 'axios'
import './Dashboard.css';
import { useNavigate } from 'react-router-dom'

const Navbar = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();

  const logout = async () => {
    try {
      localStorage.removeItem('isAuthenticated'); // Hapus status autentikasi dari localStorage
      setIsAuthenticated(false); // Set state menjadi false
      navigate('/');
    } catch (error) {
      console.log(error)
    }

  }
  return (
    <nav class="navbar" className="navbar is-light" role="navigation" aria-label="main navigation">
      <div className="container">
        <div className="navbar-brand">
          <a className="navbar-item" href="https://bulma.io">
            <img src="https://bulma.io/images/bulma-logo.png" width="112" height="28" alt='logo' />
          </a>

          <a href='/' role="button" className="navbar-burger burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </a>
        </div>

        <div id="navbarBasicExample" className="navbar-menu">
          <div className="navbar-start">
            <a href='/' className="navbar-item">
              Home
            </a>



          </div>

          <div className="navbar-end">
            <div className="navbar-item">
              <div className="buttons">

                <button onClick={logout} className="button is-light">
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
