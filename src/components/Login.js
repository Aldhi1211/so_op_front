import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import './Login.css';
import API_BASE_URL from '../config/config';
import logoWhite from '../assets/iconpti.png';

const Login = ({ setIsAuthenticated }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const Auth = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${API_BASE_URL}/login`, {
                email,
                password,
            });
            const accessToken = response.data.accessToken;
            setIsAuthenticated(true);
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem("accessToken", accessToken);
            navigate('/');
        } catch (error) {
            if (error.response) {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: error.response.data.msg,
                    confirmButtonText: 'OK',
                });
            }
        }
    };

    return (
        <div className="auth-page">
            {/* Sidebar */}
            <div className="auth-sidebar">
                <div className="auth-sidebar-logo">
                    <img src={logoWhite} alt="PTI Logo" className="auth-logo-img" />
                    PTI
                </div>
                <h2 className="auth-sidebar-title">Selamat datang kembali</h2>
                <p className="auth-sidebar-desc">
                    Masuk untuk mengakses dashboard dan semua fitur manajemen PT Pangan Terbaik Indonesia.
                </p>
                <div className="auth-sidebar-features">
                    <div className="auth-feature-item">
                        <span className="auth-feat-dot"></span> Kelola produk &amp; galeri
                    </div>
                    <div className="auth-feature-item">
                        <span className="auth-feat-dot"></span> Dashboard real-time
                    </div>
                    <div className="auth-feature-item">
                        <span className="auth-feat-dot"></span> Manajemen tim &amp; stok
                    </div>
                </div>
            </div>

            {/* Form area */}
            <div className="auth-form-area">
                <div className="auth-form-inner">
                    <h3 className="auth-form-title">Masuk ke Akun</h3>
                    <p className="auth-form-subtitle">
                        Belum punya akun?{' '}
                        <a href="/register" className="auth-link">Daftar gratis</a>
                    </p>

                    <form onSubmit={Auth}>
                        <div className="auth-field">
                            <label>Alamat Email</label>
                            <div className="auth-input-row">
                                <span className="auth-input-icon">✉</span>
                                <input
                                    type="email"
                                    placeholder="contoh@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="auth-field">
                            <label>Kata Sandi</label>
                            <div className="auth-input-row">
                                <span className="auth-input-icon">🔒</span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Masukkan kata sandi"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <span
                                    className="auth-input-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    title={showPassword ? "Sembunyikan" : "Tampilkan"}
                                >
                                    {showPassword ? "🙈" : "👁"}
                                </span>
                            </div>
                        </div>

                        <button type="submit" className="auth-primary-btn">
                            Masuk Sekarang
                        </button>
                    </form>

                    <p className="auth-switch-link">
                        Belum punya akun?{' '}
                        <a href="/register" className="auth-link">Daftar di sini</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
