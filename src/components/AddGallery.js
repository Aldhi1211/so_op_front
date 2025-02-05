import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'
import axios from 'axios';
import './Product.css';
import { jwtDecode } from 'jwt-decode';
import API_BASE_URL from '../config/config';



const AddGallery = () => {

    const [token, setToken] = useState('');
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        foto: ""
    });
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const getToken = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/token`);
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

    const handleFileChange = (event) => {
        const file = event.target.files[0]; // Mendapatkan file pertama yang diunggah
        if (file) {
            setFormData((prevData) => ({
                ...prevData,
                foto: file, // Menyimpan file di state
            }));
        }
    };

    // Handle submit form
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Buat FormData untuk mengirim file (jika ada)
            const data = new FormData();
            data.append("name", formData.name);
            if (formData.foto) {
                data.append("foto", formData.foto); // Menambahkan file image
            }

            // Step 1: Tambahkan gallery
            const galleryResponse = await axios.post(`${API_BASE_URL}/gallery`, data, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            alert("Gallery berhasil ditambahkan!");
            setFormData({
                name: "",
                foto: null
            });

            navigate('/dashboard/gallery', {
                state: { successMessage: 'Gallery berhasil ditambahkan!' },
            });
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Terjadi kesalahan saat menambahkan data.");
        }
    };


    return (
        <div className="container mt-5">
            <h2 className="title is-4" style={{ color: '#333' }}>Add Product</h2>
            <form onSubmit={handleSubmit}>

                <label>Name:</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />

                <label>Foto:</label>
                <input
                    type="file"
                    name="foto"
                    onChange={handleFileChange}
                    accept="image/*" // Hanya menerima file gambar
                    required
                />
                <button type="submit">Submit</button>
            </form>
        </div>
    );
};

export default AddGallery;
