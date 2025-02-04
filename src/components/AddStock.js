import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';



const AddStock = () => {

    const [token, setToken] = useState('');
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        id_barang: '',
        quantity: '',
        satuan: ''
    });
    const [barangList, setBarangList] = useState([]);
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

        const fetchBarang = async () => {
            try {
                const response = await axios.get('http://localhost:5000/barang?search_query=&page=0&limit=10');
                setBarangList(response.data.response);
            } catch (error) {
                console.error('Error fetching barang:', error.message);
            }
        };
        fetchBarang();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        // Ambil tanggal hari ini
        const today = new Date();
        const offsetDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
        const formattedDate = offsetDate.toISOString().split('T')[0];
        console.log('Tanggal hari ini:', formattedDate);

        // Ambil data pengguna dari token
        const decoded = jwtDecode(token);
        const submittedBy = decoded?.username || decoded?.email || 'Unknown User'; // Sesuaikan atribut yang tersedia di token


        try {
            const response = await axios.post('http://localhost:5000/stock', formData);

            // Data untuk API kedua
            const stockInData = {
                id_barang: formData.id_barang,
                quantity: formData.quantity,
                satuan: formData.satuan,
                tanggal_beli: formattedDate,
                submitted_by: submittedBy, // Nama pengguna yang login
            };

            // Panggil API kedua ke /stockin
            const stockInResponse = await axios.post('http://localhost:5000/stockin', stockInData);

            setFormData({ id_barang: '', quantity: '', satuan: '' });
            // Navigasi dengan pesan keberhasilan
            navigate('/dashboard/stock/overview', {
                state: { successMessage: 'Stock berhasil ditambahkan!' },
            });
        } catch (error) {
            setErrorMessage('Gagal menambahkan stock. Periksa input Anda!');
            console.error(error.message);
        }
    };

    return (
        <div className="container mt-5">
            <h2 className="title is-4" style={{ color: '#333' }}>Add New Stock</h2>
            <form onSubmit={handleSubmit} className="box" style={{ backgroundColor: '#fff', border: '1px solid #ddd' }}>
                {errorMessage && (
                    <div className="notification is-danger" style={{ backgroundColor: '#ffe6e6', color: '#cc0000' }}>
                        {errorMessage}
                    </div>
                )}
                {successMessage && (
                    <div className="notification is-success" style={{ backgroundColor: '#e6f7e6', color: '#228b22' }}>
                        {successMessage}
                    </div>
                )}
                {/* Barang */}
                <div className="field">
                    <label className="label" style={{ color: '#333' }}>Barang</label>
                    <div className="control">
                        <div className="select is-fullwidth">
                            <select
                                name="id_barang"
                                value={formData.id_barang}
                                onChange={handleInputChange}
                                required
                                style={{ backgroundColor: '#fff', border: '1px solid #ddd', color: '#555' }}
                            >
                                <option value="" disabled>
                                    Pilih Barang
                                </option>
                                {barangList.map((barang) => (
                                    <option key={barang.id} value={barang.id}>
                                        {barang.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                {/* Quantity */}
                <div className="field">
                    <label className="label" style={{ color: '#333' }}>Quantity</label>
                    <div className="control">
                        <input
                            className="input"
                            type="number"
                            name="quantity"
                            placeholder="Masukkan Quantity"
                            value={formData.quantity}
                            onChange={handleInputChange}
                            required
                            style={{ backgroundColor: '#fff', border: '1px solid #ddd', color: '#555' }}
                        />
                    </div>
                </div>
                {/* Satuan */}
                <div className="field">
                    <label className="label" style={{ color: '#333' }}>Satuan</label>
                    <div className="control">
                        <div className="select is-fullwidth">
                            <select
                                name="satuan"
                                value={formData.satuan}
                                onChange={handleInputChange}
                                required
                                style={{ backgroundColor: '#fff', border: '1px solid #ddd', color: '#555' }}
                            >
                                <option value="" disabled>
                                    Pilih Satuan
                                </option>
                                <option value="pcs">Pcs</option>
                                <option value="kg">Kg</option>
                                <option value="litre">Litre</option>
                                <option value="box">Box</option>
                            </select>
                        </div>
                    </div>
                </div>
                {/* Submit Button */}
                <div className="field is-grouped is-justify-content-flex-end">
                    <div className="control">
                        <button
                            type="submit"
                            className="button is-success"
                            style={{ backgroundColor: '#228b22', color: '#fff' }}
                        >
                            Add Stock
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AddStock;
