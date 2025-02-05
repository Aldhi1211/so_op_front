import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./Product.css";

const EditTeams = () => {
    const { id } = useParams(); // Mengambil parameter id produk dari URL
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        jabatan: "",
        fb: "",
        instagram: "",
        foto: "",
        linkedin: "",
        description: ""
    });

    const [teamsData, setTeamsData] = useState(null);

    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const response = await axios.get(`http://18.141.194.160/api/teams/${id}`);
                const teams = response.data;

                setTeamsData(teams);
                setFormData({
                    name: teams.name,
                    jabatan: teams.jabatan,
                    fb: teams.fb,
                    linkedin: teams.linkedin,
                    instagram: teams.instagram,
                    description: teams.description,
                    foto: teams.foto, // URL gambar
                });

            } catch (error) {
                console.error("Error fetching teams:", error.message);
                setErrorMessage("Failed to fetch teams data.");
            }
        };
        fetchTeams();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setFormData((prevData) => ({
                ...prevData,
                foto: file, // Ganti dengan file baru
            }));
        } else {
            setFormData((prevData) => ({
                ...prevData,
                foto: teamsData.foto, // Tetap gunakan gambar lama
            }));
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append("name", formData.name);
            data.append("jabatan", formData.jabatan);
            data.append("fb", formData.fb);
            data.append("linkedin", formData.linkedin);
            data.append("instagram", formData.instagram);
            data.append("description", formData.description);

            if (formData.foto instanceof File) {
                data.append("foto", formData.foto);
            } else {
                data.append("foto", teamsData.foto); // Menggunakan nilai gambar yang ada
            }

            await axios.patch(`http://18.141.194.160/api/teams/${id}`, data, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            alert("Teams berhasil diperbarui!");
            navigate("/dashboard/teams", {
                state: { successMessage: "Teams berhasil diperbarui!" },
            });
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan saat memperbarui data Teams.");
        }
    };

    if (!teamsData) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container mt-5">
            <h2 className="title is-4" style={{ color: "#333" }}>Edit Teams</h2>
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
                <input type="file" name="foto" onChange={handleFileChange} accept="image/*" />
                {formData.foto && !(formData.foto instanceof File) && (
                    <div>
                        <img src={formData.foto} alt="Product" width="200" />
                    </div>
                )}

                <button type="submit">Update Teams</button>
            </form>
        </div>
    );
};

export default EditTeams;
