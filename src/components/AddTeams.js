import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'
import axios from 'axios';
import './Product.css';
import { jwtDecode } from 'jwt-decode';



const AddTeams = () => {

    const [token, setToken] = useState('');
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        jabatan: "",
        fb: "",
        instagram: "",
        foto: "",
        linkedin: "", // Array untuk spesifikasi
        description: "",        // Array untuk custom
    });
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const getToken = async () => {
            try {
                const response = await axios.get('http://18.141.194.160/api/token');
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
            data.append("jabatan", formData.jabatan);
            data.append("fb", formData.fb);
            data.append("linkedin", formData.linkedin);
            data.append("description", formData.description);
            data.append("instagram", formData.instagram);
            if (formData.foto) {
                data.append("foto", formData.foto); // Menambahkan file image
            }

            // Step 1: Tambahkan product
            const teamsResponse = await axios.post("http://18.141.194.160/api/teams", data, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            alert("Teams berhasil ditambahkan!");
            setFormData({
                name: "",
                jabatan: "",
                fb: "",
                instagram: "",
                foto: "",
                linkedin: "", // Array untuk spesifikasi
                description: "",
            });



            navigate('/dashboard/teams', {
                state: { successMessage: 'Teams berhasil ditambahkan!' },
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

                <label>Jabatan</label>
                <input type="text" name="jabatan" value={formData.jabatan} onChange={handleChange} required />

                <label>Facebook</label>
                <input type="text" name="fb" value={formData.fb} onChange={handleChange} required />

                <label>Linkedin</label>
                <input type="text" name="linkedin" value={formData.linkedin} onChange={handleChange} required />

                <label>Instagram</label>
                <input type="text" name="instagram" value={formData.instagram} onChange={handleChange} required />


                <label>Description:</label>
                <textarea name="description" value={formData.description} onChange={handleChange} required />

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

export default AddTeams;
