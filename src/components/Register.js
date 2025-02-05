import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './Register.css'; // Pastikan Anda mengimpor file CSS dengan benar

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confPassword, setconfPassword] = useState('');
    const [gender, setGender] = useState('Male');
    const [msg, setMsg] = useState('');
    const navigate = useNavigate();

    const Register = async (e) => {
        e.preventDefault();

        // Validasi input tidak boleh kosong
        if (!name || !email || !password || !confPassword) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Semua field harus diisi!',
            });
            return;
        }

        // Validasi password dan konfirmasi password
        if (password !== confPassword) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Password dan Konfirmasi Password tidak cocok!',
            });
            return;
        }

        try {
            // 1. Cek apakah email sudah ada di database
            const response = await axios.get(`http://18.141.194.160/api/search?check_email=${email}`);
            if (response.data.response) {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Email sudah terdaftar! Gunakan email lain.',
                });
                return;
            }

            await axios.post('http://18.141.194.160/api/users', {
                name: name,
                email: email,
                password: password,
                confPassword: confPassword,
                gender,
                role: 'Guest',
            });
            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: 'User berhasil ditambahkan!',
                confirmButtonText: 'OK',
            }).then(() => {
                navigate('/login'); // Redirect setelah OK diklik
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal!',
                text: `Gagal menambahkan user. ${error}`,
            });
            console.log(error);
        }
    };

    return (
        <section className="hero has-background-grey-light  is-fullwidth is-success is-fullheight">
            <div className="hero-body">
                <div className="container has-background-grey-light ">
                    <div className="columns is-centered">
                        <form onSubmit={Register} className="box">
                            <div className="has-text-centered mb-4">
                                <h1 className="title is-4 has-text-dark">Register</h1>
                            </div>
                            <p className="has-text-centered">{msg}</p>

                            <div className="field mt-5">
                                <label className="label">Name</label>
                                <div className="controls">
                                    <input
                                        type="text"
                                        placeholder="Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="input"
                                    />
                                </div>
                            </div>
                            <div className="field mt-5">
                                <label className="label">Email</label>
                                <div className="controls">
                                    <input
                                        type="text"
                                        placeholder="Email"
                                        className="input"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="field mt-5">
                                <label className="label">Password</label>
                                <div className="controls">
                                    <input
                                        type="password"
                                        placeholder="****"
                                        className="input"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="field mt-5">
                                <label className="label">Confirm Password</label>
                                <div className="controls">
                                    <input
                                        type="password"
                                        placeholder="****"
                                        className="input"
                                        value={confPassword}
                                        onChange={(e) => setconfPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="field mt-5">
                                <label className="label">Gender</label>
                                <div className="control">
                                    <div className="select is-fullwidth">
                                        <select
                                            value={gender}
                                            onChange={(e) => setGender(e.target.value)}
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="field mt-5">
                                <button className="button is-success is-fullwidth">Register</button>
                            </div>
                            <div className="has-text-centered mt-4">
                                <p className="is-size-7">
                                    Have an account? <a href="/login" className="has-text-link">Sign In</a>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Register;
