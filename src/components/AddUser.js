import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import API_BASE_URL from '../config/config';

const AddUser = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confPassword, setconfPassword] = useState("");
    const [gender, setGender] = useState("Male");
    const [role, setRole] = useState("Admin");
    const navigate = useNavigate();

    const saveUser = async (e) => {
        e.preventDefault();

        // Validasi input tidak boleh kosong
        if (!name || !email || !password || !confPassword) {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Semua field harus diisi!",
            });
            return;
        }

        // Validasi password dan konfirmasi password
        if (password !== confPassword) {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Password dan Konfirmasi Password tidak cocok!",
            });
            return;
        }

        try {
            // 1. Cek apakah email sudah ada di database
            const response = await axios.get(`${API_BASE_URL}/search?check_email=${email}`);
            if (response.data.response) {
                Swal.fire({
                    icon: "error",
                    title: "Oops...",
                    text: "Email sudah terdaftar! Gunakan email lain.",
                });
                return;
            }


            // 2. Jika email belum terdaftar, lanjutkan proses registrasi
            await axios.post(`${API_BASE_URL}/users`, {
                name,
                email,
                password,
                confPassword,
                role,
                gender
            });

            // 3. Tampilkan pop-up sukses
            Swal.fire({
                icon: "success",
                title: "Berhasil!",
                text: "User berhasil ditambahkan!",
                confirmButtonText: "OK",
            }).then(() => {
                navigate("/dashboard/users"); // Redirect setelah OK diklik
            });

        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Gagal!",
                text: `Gagal menambahkan user. ${error}`,
            });
            console.log(error);
        }
    }

    return (
        <div className="columns mt-5 is-centered">
            <div className="column is-half">
                <h2 className="title is-4" style={{ color: '#333' }}>Add User</h2>

                <form onSubmit={saveUser}>
                    <div className="field">
                        <label className='label'>Name</label>
                        <div className="control">
                            <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder='Name' />
                        </div>
                    </div>
                    <div className="field">
                        <label className='label'>Email</label>
                        <div className="control">
                            <input type="text" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder='Email' />
                        </div>
                    </div>
                    <div className="field mt-5">
                        <label className="label">Password</label>
                        <div className="controls">
                            <input type="password" placeholder='****' className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                    </div>
                    <div className="field mt-5">
                        <label className="label">Confirm Password</label>
                        <div className="controls">
                            <input type="password" placeholder='****' className="input" value={confPassword} onChange={(e) => setconfPassword(e.target.value)} />
                        </div>
                    </div>
                    <div className="field">
                        <label className='label'>Gender</label>
                        <div className="control">
                            <div className="select is-fullwidth">
                                <select value={gender} onChange={(e) => setGender(e.target.value)}>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="field">
                        <label className='label'>Role</label>
                        <div className="control">
                            <div className="select is-fullwidth">
                                <select value={role} onChange={(e) => setRole(e.target.value)}>
                                    <option value="Admin">Admin</option>
                                    <option value="Petugas">Petugas</option>
                                    <option value="Guest">Guest</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="field">
                        <button type='submit' className='button is-success'>Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddUser;
