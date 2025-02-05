import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import './Login.css'; // Tambahkan file CSS terpisah
import API_BASE_URL from '../config/config';

const Login = ({ setIsAuthenticated }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [msg, setMsg] = useState('');
    const navigate = useNavigate();

    const Auth = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${API_BASE_URL}/login`, {
                email: email,
                password: password,
            });

            // Ambil accessToken dari response
            const accessToken = response.data.accessToken;
            setIsAuthenticated(true);
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem("accessToken", accessToken); // Simpan token dengan benar

            navigate('/');
        } catch (error) {
            if (error.response) {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: error.response.data.msg,
                    confirmButtonText: 'OK',
                }).then(() => {
                    navigate('/'); // Redirect setelah OK diklik
                });
            }
        }
    };

    return (
        <section className="hero has-background-grey-light is-fullheight">
            <div className="hero-body">
                <div className="container has-background-grey-light ">
                    <div className="columns is-centered">
                        <form onSubmit={Auth} className="box login-box">
                            <div className="has-text-centered mb-4">
                                <h1 className="title is-4 has-text-dark">Log In</h1>
                            </div>
                            <div className="field">
                                <label className="label">Email</label>
                                <div className="control">
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        className="input"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="field">
                                <label className="label">Password</label>
                                <div className="control">
                                    <input
                                        type="password"
                                        placeholder="Enter your password"
                                        className="input"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="field mt-5">
                                <button className="button is-success is-fullwidth">Login</button>
                            </div>
                            <div className="has-text-centered mt-4">
                                <p className="is-size-7">
                                    Don't have an account? <a href="/register" className="has-text-link">Sign up</a>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Login;
