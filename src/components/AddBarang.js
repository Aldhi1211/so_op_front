import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'
import axios from 'axios';
import './Product.css';
import { jwtDecode } from 'jwt-decode';



const AddBarang = () => {

    const [token, setToken] = useState('');
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: ""  // Array untuk custom
    });
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const getToken = async () => {
            try {
                const response = await axios.get('http://localhost:5000/token');
                setToken(response.data.accessToken);
            } catch (error) {
                console.error('Gagal mendapatkan token:', error.message);
            }
        };
        getToken();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Handle submit form
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Step 1: Tambahkan barang
            const barangResponse = await axios.post("http://localhost:5000/barang", formData);

            alert("Barang berhasil ditambahkan!");
            setFormData({
                name: ""
            });
            navigate('/dashboard/barang', {
                state: { successMessage: 'Barang berhasil ditambahkan!' },
            });
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Terjadi kesalahan saat menambahkan data.");
        }
    };


    return (
        <div className="container mt-5">
            <h2 className="title is-4" style={{ color: '#333' }}>Add Barang</h2>
            <form onSubmit={handleSubmit}>

                <label>Name:</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />

                <button type="submit">Submit</button>
            </form>
        </div>
    );
};

export default AddBarang;
