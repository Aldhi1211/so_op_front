import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./Product.css";

const EditProduct = () => {
    const { id } = useParams(); // Mengambil parameter id produk dari URL
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        link_tokped: "",
        link_whatsapp: "",
        images: "", // URL atau path gambar
    });

    const [specsData, setSpec] = useState([]); // Inisialisasi sebagai array
    const [customsData, setCustoms] = useState([]); // Inisialisasi sebagai array
    const [productData, setProductData] = useState(null);

    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/product/${id}`);
                const response1 = await axios.get(`http://localhost:5000/specs/${id}`);
                const response2 = await axios.get(`http://localhost:5000/api/custom/${id}`);
                const product = response.data;

                setProductData(product);
                setFormData({
                    name: product.name,
                    description: product.description,
                    link_tokped: product.link_tokped,
                    link_whatsapp: product.link_whatsapp,
                    images: product.images, // URL gambar
                });

                setSpec(response1.data); // Simpan semua spesifikasi
                setCustoms(response2.data); // Simpan semua custom

            } catch (error) {
                console.error("Error fetching product:", error.message);
                setErrorMessage("Failed to fetch product data.");
            }
        };
        fetchProduct();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSpecChange = (index, value) => {
        const updatedSpecs = [...specsData];
        updatedSpecs[index].spesification = value;
        setSpec(updatedSpecs);
    };

    const handleCustomChange = (index, value) => {
        const updatedCustoms = [...customsData];
        updatedCustoms[index].custom = value;
        setCustoms(updatedCustoms);
    };

    const addSpecField = () => {
        setSpec([...specsData, { spesification: "", id_product: id }]);
    };

    const removeSpecField = (index) => {
        const updatedSpecs = specsData.filter((_, i) => i !== index);
        setSpec(updatedSpecs);
    };

    const addCustomField = () => {
        setCustoms([...customsData, { custom: "", id_product: id }]);
    };

    const removeCustomField = (index) => {
        const updatedCustoms = customsData.filter((_, i) => i !== index);
        setCustoms(updatedCustoms);
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setFormData((prevData) => ({
                ...prevData,
                images: file, // Ganti dengan file baru
            }));
        } else {
            setFormData((prevData) => ({
                ...prevData,
                images: productData.images, // Tetap gunakan gambar lama
            }));
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append("name", formData.name);
            data.append("description", formData.description);
            data.append("link_tokped", formData.link_tokped);
            data.append("link_whatsapp", formData.link_whatsapp);

            if (formData.images instanceof File) {
                data.append("images", formData.images);
            } else {
                data.append("images", productData.images); // Menggunakan nilai gambar yang ada
            }

            await axios.patch(`http://localhost:5000/product/${id}`, data, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            // Update spesifications
            if (specsData && specsData.length > 0) {
                for (const spec of specsData) {
                    const { id, spesification } = spec; // Ambil ID dan spesifikasi
                    await axios.patch(`http://localhost:5000/specs/${id}`, spec); // Kirim data ke server
                }
            }

            // Update customs
            if (customsData && customsData.length > 0) {
                for (const custom of customsData) {
                    const { id, custom: customValue } = custom; // Ambil ID dan custom value
                    await axios.patch(`http://localhost:5000/api/custom/${id}`, custom); // Kirim data ke server
                }
            }


            alert("Product berhasil diperbarui!");
            navigate("/dashboard/product", {
                state: { successMessage: "Product berhasil diperbarui!" },
            });
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan saat memperbarui data produk.");
        }
    };

    if (!productData) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container mt-5">
            <h2 className="title is-4" style={{ color: "#333" }}>Edit Product</h2>
            <form onSubmit={handleSubmit}>
                <label>Name:</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />

                <label>Description:</label>
                <textarea name="description" value={formData.description} onChange={handleChange} required />

                <label>Link Tokopedia:</label>
                <input type="text" name="link_tokped" value={formData.link_tokped} onChange={handleChange} required />

                <label>Link WhatsApp:</label>
                <input type="text" name="link_whatsapp" value={formData.link_whatsapp} onChange={handleChange} required />

                <label>Images:</label>
                <input type="file" name="images" onChange={handleFileChange} accept="image/*" />
                {formData.images && !(formData.images instanceof File) && (
                    <div>
                        <img src={formData.images} alt="Product" width="200" />
                    </div>
                )}

                <h3>Specifications</h3>
                {specsData.map((spec, index) => (
                    <div key={index}>
                        <input
                            type="text"
                            value={spec.spesification}
                            onChange={(e) => handleSpecChange(index, e.target.value)}
                            required
                        />
                        <button type="button" onClick={() => removeSpecField(index)}>Remove</button>
                    </div>
                ))}
                <button type="button" onClick={addSpecField}>Add Specification</button>

                <h3>Customs</h3>
                {customsData.map((custom, index) => (
                    <div key={index}>
                        <input
                            type="text"
                            value={custom.custom}
                            onChange={(e) => handleCustomChange(index, e.target.value)}
                            required
                        />
                        <button type="button" onClick={() => removeCustomField(index)}>Remove</button>
                    </div>
                ))}
                <button type="button" onClick={addCustomField}>Add Custom</button>

                <button type="submit">Update Product</button>
            </form>
        </div>
    );
};

export default EditProduct;
