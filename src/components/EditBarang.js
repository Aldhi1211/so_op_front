import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./Product.css";

const EditBarang = () => {
    const { id } = useParams(); // Mengambil parameter id produk dari URL
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: ""
    });

    const [barangData, setBarangData] = useState(null);

    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        const fetchBarang = async () => {
            try {
                const response = await axios.get(`http://18.141.194.160/api/barang/${id}`);
                const barang = response.data;

                setBarangData(barang);
                setFormData({
                    name: barang.name
                });
            } catch (error) {
                console.error("Error fetching Barang:", error.message);
                setErrorMessage("Failed to fetch Barang data.");
            }
        };
        fetchBarang();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {

            await axios.patch(`http://18.141.194.160/api/barang/${id}`, formData);

            alert("Barang berhasil diperbarui!");
            navigate("/dashboard/barang", {
                state: { successMessage: "Barang berhasil diperbarui!" },
            });
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan saat memperbarui data produk.");
        }
    };

    if (!barangData) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container mt-5">
            <h2 className="title is-4" style={{ color: "#333" }}>Edit Barang</h2>
            <form onSubmit={handleSubmit}>
                <label>Name:</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />

                <button type="submit">Update Barang</button>
            </form>
        </div>
    );
};

export default EditBarang;
