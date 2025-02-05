import React, { useState, useEffect } from 'react';
import axios from "axios";
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import './Table.css';
import API_BASE_URL from '../config/config';

const Overview = () => {
    const [expire, setExpire] = useState(null); // Ubah array menjadi null atau number untuk expire
    const [token, setToken] = useState(null);   // Ubah array menjadi null atau string untuk token
    const [name, setName] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    const refreshToken = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/token`);
            setToken(response.data.accessToken);
            const decoded = jwtDecode(response.data.accessToken);
            setName(decoded.name);
            setExpire(decoded.exp);
        } catch (error) {
            // Redirect ke login jika gagal mengambil token
            navigate('/login');
        }
    };

    useEffect(() => {
        refreshToken();

        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 3000); // Pesan sukses hilang setelah 3 detik
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    useEffect(() => {
        // Set up Axios interceptor for token expiration check
        const axiosJWT = axios.create();
        axiosJWT.interceptors.request.use(async (config) => {
            const currentDate = new Date();
            if (expire * 1000 < currentDate.getTime()) {
                const response = await axios.get('${API_BASE_URL}/token');
                setToken(response.data.accessToken);
                const decoded = jwtDecode(response.data.accessToken);
                setName(decoded.name);
                setExpire(decoded.exp);
                config.headers.Authorization = `Bearer ${response.data.accessToken}`;
            } else {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        }, (error) => {
            return Promise.reject(error);
        });
    }, [expire, token]); // Menambahkan dependensi yang relevan

    return (
        <div>
            <h1>Welcome to Admin Dashboard</h1>
            {successMessage && <div className="success-message">{successMessage}</div>}
            <p>Select a menu from the left to get started.</p>
        </div>
    );
}

export default Overview;
