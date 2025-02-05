import React, { useState, useEffect } from 'react'
import axios from "axios";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from "jwt-decode"
import './Table.css'


const UserList = () => {
    const navigate = useNavigate();
    const location = useLocation();  // Pindahkan deklarasi location ke sini
    const [users, setUser] = useState([]);
    const [name, setName] = useState([]);
    const [token, setToken] = useState([]);
    const [expire, setExpire] = useState([]);
    const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || '');  // Menggunakan location setelah deklarasi

    // Fungsi untuk refresh token dan mendapatkan data
    const refreshToken = async () => {
        try {
            const response = await axios.get('http://18.141.194.160/api/token');
            setToken(response.data.accessToken);
            const decoded = jwtDecode(response.data.accessToken);
            setName(decoded.name)
            setExpire(decoded.exp)
        } catch (error) {
            if (error.response) {
                navigate('/')  // Jika token tidak valid, arahkan ke halaman login
            }
        }
    }

    useEffect(() => {
        if (token) {
            getUsers();
        } else {
            navigate('/login'); // Redirect ke login jika token tidak ada
        }
    }, [token]);

    useEffect(() => {
        refreshToken();
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 3000); // Pesan sukses hilang setelah 3 detik
            navigate(location.pathname, { replace: true, state: {} });
            return () => clearTimeout(timer);
        }
    }, [successMessage, navigate, location.pathname]);

    const axiosJWT = axios.create();

    axiosJWT.interceptors.request.use(async (config) => {
        const currentDate = new Date();
        // Cek jika token sudah kedaluwarsa
        if (expire * 1000 < currentDate.getTime()) {
            try {
                const response = await axios.get('http://18.141.194.160/api/token');  // Refresh token
                const newToken = response.data.accessToken;
                config.headers.Authorization = `Bearer ${newToken}`;
                setToken(newToken);
                const decoded = jwtDecode(newToken);
                setExpire(decoded.exp);
            } catch (error) {
                // Jika gagal refresh token, arahkan ke login
                navigate('/login');
                return Promise.reject(error);
            }
        } else {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    }, (error) => {
        return Promise.reject(error);
    });


    const getUsers = async () => {
        const response = await axiosJWT.get('http://18.141.194.160/api/users', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        setUser(response.data);
    }

    const deleteUser = async (id) => {
        try {
            await axios.delete(`http://18.141.194.160/api/users/${id}`);
            getUsers();
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <div className="container mt-5">

            {/* Add New Button */}
            <div className="is-flex is-justify-content-space-between is-align-items-center mb-4">
                <h2 className="title is-4 has-text-black">User List</h2>
                <Link to="add" className="button is-success is-rounded">
                    <span className="icon is-small">
                        <i className="fas fa-plus"></i>
                    </span>
                    <span>Add New User</span>
                </Link>
            </div>

            {/* User Table */}
            <div className="table-container">
                <table className="table is-fullwidth is-bordered is-hoverable custom-hover-table">
                    <thead>
                        <tr className="has-background-grey">
                            <th>No</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Gender</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody className="has-background-light">
                        {users.map((user, index) => (
                            <tr key={user.id}>
                                <td className="has-text-black">{index + 1}</td>
                                <td className="has-text-black">{user.name}</td>
                                <td className="has-text-black">{user.email}</td>
                                <td className="has-text-black">
                                    <span
                                        className={`tag ${user.gender === 'Male' ? 'is-info' : 'is-danger'}`}
                                    >
                                        {user.gender}
                                    </span>
                                </td>
                                <td className="has-text-black">
                                    <span
                                        className={`tag ${user.role === 'Admin' ? 'is-info' : 'is-danger'}`}
                                    >
                                        {user.role}
                                    </span>
                                </td>
                                <td>
                                    <div className="buttons are-small">
                                        <Link
                                            to={`edit/${user.id}`}
                                            className="button is-light is-info"
                                        >
                                            <span className="icon">
                                                <i className="fas fa-edit"></i>
                                            </span>
                                            <span>Edit</span>
                                        </Link>
                                        <button
                                            onClick={() => deleteUser(user.id)}
                                            className="button is-light is-danger"
                                        >
                                            <span className="icon">
                                                <i className="fas fa-trash"></i>
                                            </span>
                                            <span>Delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

    );

}

export default UserList
