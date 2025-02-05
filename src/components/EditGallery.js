import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./Product.css";

const EditGallery = () => {
    const { id } = useParams(); // Mengambil parameter id produk dari URL
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        foto: "", // URL atau path gambar
    });

    const [galleryData, setGalleryData] = useState(null);

    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                const response = await axios.get(`http://18.141.194.160/api/gallery/${id}`);
                const gallery = response.data;

                setGalleryData(gallery);
                setFormData({
                    name: gallery.name,
                    foto: gallery.foto, // URL gambar
                });
            } catch (error) {
                console.error("Error fetching Gallery:", error.message);
                setErrorMessage("Failed to fetch Gallery data.");
            }
        };
        fetchGallery();
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
                foto: galleryData.foto, // Tetap gunakan gambar lama
            }));
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append("name", formData.name);
            if (formData.foto instanceof File) {
                data.append("foto", formData.foto);
            } else {
                data.append("foto", galleryData.foto); // Menggunakan nilai gambar yang ada
            }

            await axios.patch(`http://18.141.194.160/api/gallery/${id}`, data, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            alert("Gallery berhasil diperbarui!");
            navigate("/dashboard/gallery", {
                state: { successMessage: "Gallery berhasil diperbarui!" },
            });
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan saat memperbarui data produk.");
        }
    };

    if (!galleryData) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container mt-5">
            <h2 className="title is-4" style={{ color: "#333" }}>Edit Product</h2>
            <form onSubmit={handleSubmit}>
                <label>Name:</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />

                <label>Foto:</label>
                <input type="file" name="foto" onChange={handleFileChange} accept="image/*" />
                {formData.foto && !(formData.foto instanceof File) && (
                    <div>
                        <img src={formData.foto} alt="Foto" width="200" />
                    </div>
                )}
                <button type="submit">Update Gallery</button>
            </form>
        </div>
    );
};

export default EditGallery;
