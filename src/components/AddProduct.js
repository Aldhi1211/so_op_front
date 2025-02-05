import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'
import axios from 'axios';
import './Product.css';
import { jwtDecode } from 'jwt-decode';



const AddProduct = () => {

    const [token, setToken] = useState('');
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        link_tokped: "",
        link_whatsapp: "",
        images: "",
        spesifications: [""], // Array untuk spesifikasi
        customs: [""],        // Array untuk custom
    });
    const [barangList, setBarangList] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const getToken = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/token');
                setToken(response.data.accessToken);
            } catch (error) {
                console.error('Gagal mendapatkan token:', error.message);
            }
        };
        getToken();

        const fetchBarang = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/barang');
                setBarangList(response.data);
            } catch (error) {
                console.error('Error fetching barang:', error.message);
            }
        };
        fetchBarang();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Tambah field spesification atau custom
    const addField = (type) => {
        setFormData({ ...formData, [type]: [...formData[type], ""] });
    };

    // Hapus field spesification atau custom
    const removeField = (index, type) => {
        const updatedArray = formData[type].filter((_, i) => i !== index);
        setFormData({ ...formData, [type]: updatedArray });
    };

    // Handle perubahan pada array spesification dan custom
    const handleArrayChange = (index, value, type) => {
        const updatedArray = [...formData[type]];
        updatedArray[index] = value;
        setFormData({ ...formData, [type]: updatedArray });
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0]; // Mendapatkan file pertama yang diunggah
        if (file) {
            setFormData((prevData) => ({
                ...prevData,
                images: file, // Menyimpan file di state
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
            data.append("description", formData.description);
            data.append("link_tokped", formData.link_tokped);
            data.append("link_whatsapp", formData.link_whatsapp);
            if (formData.images) {
                data.append("images", formData.images); // Menambahkan file image
            }

            // Step 1: Tambahkan product
            const productResponse = await axios.post("http://localhost:5000/api/product", data, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const idProduct = productResponse.data.product.id;
            console.log(productResponse.data.product.id);
            // Step 2: Tambahkan spesifications (Looping untuk setiap item spesifikasi)
            const specData = formData.spesifications.map((spec) => ({
                id_product: idProduct,
                spesification: spec, // Menyimpan setiap spesifikasi dengan id_product yang sama
            }));
            await axios.post("http://localhost:5000/api/specs", specData);  // Kirim array data spesifikasi sekaligus

            // Step 3: Tambahkan customs (Looping untuk setiap item custom)
            const customData = formData.customs.map((customm) => ({
                id_product: idProduct,
                custom: customm, // Menyimpan setiap custom dengan id_product yang sama
            }));
            await axios.post("http://localhost:5000/api/custom", customData);  // Kirim array data spesifikasi sekaligus


            alert("Product, spesification, dan custom berhasil ditambahkan!");
            setFormData({
                name: "",
                description: "",
                link_tokped: "",
                link_whatsapp: "",
                images: null,
                spesifications: [""],
                customs: [""],
            });



            navigate('/dashboard/product', {
                state: { successMessage: 'Product berhasil ditambahkan!' },
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

                <label>Description:</label>
                <textarea name="description" value={formData.description} onChange={handleChange} required />

                <label>Link Tokopedia:</label>
                <input type="text" name="link_tokped" value={formData.link_tokped} onChange={handleChange} required />

                <label>Link WhatsApp:</label>
                <input type="text" name="link_whatsapp" value={formData.link_whatsapp} onChange={handleChange} required />

                <label>Images:</label>
                <input
                    type="file"
                    name="images"
                    onChange={handleFileChange}
                    accept="image/*" // Hanya menerima file gambar
                    required
                />

                <h3>Spesifications</h3>
                {formData.spesifications.map((spec, index) => (
                    <div key={index}>
                        <input
                            type="text"
                            value={spec}
                            onChange={(e) => handleArrayChange(index, e.target.value, "spesifications")}
                            required
                        />
                        <button type="button" onClick={() => removeField(index, "spesifications")}>
                            Remove
                        </button>
                    </div>
                ))}
                <button type="button" onClick={() => addField("spesifications")}>
                    Add Spesification
                </button>

                <h3>Customs</h3>
                {formData.customs.map((custom, index) => (
                    <div key={index}>
                        <input
                            type="text"
                            value={custom}
                            onChange={(e) => handleArrayChange(index, e.target.value, "customs")}
                            required
                        />
                        <button type="button" onClick={() => removeField(index, "customs")}>
                            Remove
                        </button>
                    </div>
                ))}
                <button type="button" onClick={() => addField("customs")}>
                    Add Custom
                </button>

                <button type="submit">Submit</button>
            </form>
        </div>
    );
};

export default AddProduct;
