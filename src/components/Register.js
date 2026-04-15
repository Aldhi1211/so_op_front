import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './Login.css';
import './Register.css';
import API_BASE_URL from '../config/config';
import logoWhite from '../assets/iconpti.png';

const getPasswordStrength = (pwd) => {
    if (pwd.length === 0) return 0;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
};

const strengthLabel = ['', 'Lemah', 'Cukup', 'Kuat', 'Sangat Kuat'];
const strengthColor = ['', '#EF4444', '#F59E0B', '#4F46E5', '#22C55E'];

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confPassword, setconfPassword] = useState('');
    const [gender, setGender] = useState('Male');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfPassword, setShowConfPassword] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const navigate = useNavigate();

    const strength = getPasswordStrength(password);

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!name || !email || !password || !confPassword) {
            Swal.fire({ icon: 'error', title: 'Oops...', text: 'Semua field harus diisi!' });
            return;
        }

        if (password !== confPassword) {
            Swal.fire({ icon: 'error', title: 'Oops...', text: 'Password dan Konfirmasi Password tidak cocok!' });
            return;
        }

        try {
            const response = await axios.get(`${API_BASE_URL}/search?check_email=${email}`);
            if (response.data.response) {
                Swal.fire({ icon: 'error', title: 'Oops...', text: 'Email sudah terdaftar! Gunakan email lain.' });
                return;
            }

            await axios.post(`${API_BASE_URL}/users`, {
                name,
                email,
                password,
                confPassword,
                gender,
                role: 'Guest',
            });

            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: 'Akun berhasil dibuat!',
                confirmButtonText: 'OK',
            }).then(() => navigate('/login'));
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Gagal!', text: `Gagal membuat akun. ${error}` });
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
                <h2 className="auth-sidebar-title">Bergabung bersama kami</h2>
                <p className="auth-sidebar-desc">
                    Buat akun dan mulai nikmati layanan PT Pangan Terbaik Indonesia.
                </p>
                <div className="auth-sidebar-features">
                    <div className="auth-feature-item">
                        <span className="auth-feat-dot"></span> Gratis untuk mendaftar
                    </div>
                    <div className="auth-feature-item">
                        <span className="auth-feat-dot"></span> Akses fitur lengkap
                    </div>
                    <div className="auth-feature-item">
                        <span className="auth-feat-dot"></span> Setup dalam 2 menit
                    </div>
                </div>
            </div>

            {/* Form area */}
            <div className="auth-form-area">
                <div className="auth-form-inner">
                    <h3 className="auth-form-title">Buat Akun Baru</h3>
                    <p className="auth-form-subtitle">
                        Sudah punya akun?{' '}
                        <a href="/login" className="auth-link">Masuk di sini</a>
                    </p>

                    <form onSubmit={handleRegister}>
                        {/* Name */}
                        <div className="auth-field">
                            <label>Nama Lengkap</label>
                            <div className="auth-input-row">
                                <span className="auth-input-icon">👤</span>
                                <input
                                    type="text"
                                    placeholder="Nama lengkap kamu"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
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

                        {/* Gender */}
                        <div className="auth-field">
                            <label>Jenis Kelamin</label>
                            <div className="auth-input-row">
                                <span className="auth-input-icon">⚧</span>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                >
                                    <option value="Male">Laki-laki</option>
                                    <option value="Female">Perempuan</option>
                                </select>
                                <span className="auth-input-icon" style={{ opacity: 0.4, fontSize: 11 }}>▼</span>
                            </div>
                        </div>

                        {/* Password */}
                        <div className="auth-field">
                            <label>Kata Sandi</label>
                            <div className="auth-input-row">
                                <span className="auth-input-icon">🔒</span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Minimal 8 karakter"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <span
                                    className="auth-input-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? "🙈" : "👁"}
                                </span>
                            </div>
                            {/* Strength bar */}
                            {password.length > 0 && (
                                <div className="reg-strength">
                                    <div className="reg-strength-bars">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div
                                                key={i}
                                                className="reg-strength-bar"
                                                style={{
                                                    background: strength >= i ? strengthColor[strength] : '#E5E7EB'
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <span
                                        className="reg-strength-label"
                                        style={{ color: strengthColor[strength] }}
                                    >
                                        {strengthLabel[strength]}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="auth-field">
                            <label>Konfirmasi Kata Sandi</label>
                            <div className="auth-input-row">
                                <span className="auth-input-icon">🔒</span>
                                <input
                                    type={showConfPassword ? "text" : "password"}
                                    placeholder="Ulangi kata sandi"
                                    value={confPassword}
                                    onChange={(e) => setconfPassword(e.target.value)}
                                    required
                                />
                                <span
                                    className="auth-input-toggle"
                                    onClick={() => setShowConfPassword(!showConfPassword)}
                                >
                                    {showConfPassword ? "🙈" : "👁"}
                                </span>
                            </div>
                            {confPassword.length > 0 && password !== confPassword && (
                                <p className="reg-error-hint">Kata sandi tidak cocok</p>
                            )}
                        </div>

                        {/* Terms */}
                        <div className="reg-checkbox-row">
                            <div
                                className={`reg-checkbox ${agreed ? 'checked' : ''}`}
                                onClick={() => setAgreed(!agreed)}
                            >
                                {agreed && <span>✓</span>}
                            </div>
                            <span>
                                Saya setuju dengan{' '}
                                <span className="auth-link" style={{ cursor: 'pointer' }}>Syarat &amp; Ketentuan</span>
                            </span>
                        </div>

                        <button
                            type="submit"
                            className="auth-primary-btn"
                            disabled={!agreed}
                            style={{ opacity: agreed ? 1 : 0.6, cursor: agreed ? 'pointer' : 'not-allowed' }}
                        >
                            Daftar Sekarang
                        </button>
                    </form>

                    <p className="auth-switch-link">
                        Sudah punya akun?{' '}
                        <a href="/login" className="auth-link">Masuk di sini</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
