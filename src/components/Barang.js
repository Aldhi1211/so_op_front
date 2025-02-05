import React, { useState, useEffect } from 'react';
import axios from "axios";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import './Table.css';
import ReactPaginate from "react-paginate";
import Swal from 'sweetalert2';


const Barang = () => {
    const [barang, setBarang] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [query, setQuery] = useState("");

    // Pagination State
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(10);  // Jumlah item per halaman
    const [pages, setPages] = useState(0);  // Total halaman
    const [rows, setRows] = useState(0);  // Total halaman
    const [keyword, setKeyword] = useState("");  // Total halaman

    const [token, setToken] = useState([]);
    const [expire, setExpire] = useState([]);
    const [name, setName] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    const refreshToken = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/token');
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
    const axiosJWT = axios.create();

    useEffect(() => {
        // Set up Axios interceptor for token expiration check
        axiosJWT.interceptors.request.use(async (config) => {
            const currentDate = new Date();
            if (expire * 1000 < currentDate.getTime()) {
                const response = await axios.get('http://localhost:5000/api/token');
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


    useEffect(() => {
        // Pastikan token ada dan valid sebelum memanggil getBarang
        if (token) {
            getBarang();
        } else {
            navigate('/login'); // Redirect ke login jika token tidak ada
        }
    }, [page, keyword, token]);  // Menambahkan token sebagai dependensi untuk memastikan token valid sebelum melakukan getBarang

    useEffect(() => {
        setPage(0); // Reset page ke 0 setiap kali keyword berubah
    }, [keyword]);


    useEffect(() => {
        setPage(0); // Reset page ke 0 setiap kali keyword berubah
    }, [keyword]);


    const getBarang = async () => {
        const response = await axiosJWT.get(`http://localhost:5000/api/barang?search_query=${keyword}&page=${page}&limit=${limit}`, {
            // headers: {
            //     Authorization: `Bearer ${token}`
            // }
        });
        console.log(response.data.response)
        setBarang(response.data.response);
        setPage(response.data.page);
        setPages(response.data.totalPage);
        setRows(response.data.totalRows);
    };

    const deleteBarang = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/barang/${id}`);
            getBarang();
        } catch (error) {
            console.log(error);
        }
    };

    const changePage = ({ selected }) => {
        setPage(selected);
    };

    // // Handle Search
    const searchData = (e) => {
        e.preventDefault();
        setPage(0);
        setKeyword(query);
    }
    // Handle Sorting
    const handleSort = (key) => {
        const direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
        setSortConfig({ key, direction });

        const sorted = [...barang].sort((a, b) => {
            if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        setBarang(sorted);
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);  // Ganti halaman
    };

    // Split data sesuai dengan halaman yang dipilih
    const displayedData = barang.slice(page * limit, (page + 1) * limit);

    return (
        <div>
            {successMessage && (
                <div className="notification is-success">
                    {successMessage}
                </div>
            )}

            <div className="container mt-5">
                {/* Add New Button */}
                <div className="is-flex is-justify-content-space-between is-align-items-center mb-4">
                    <h2 className="title is-4 has-text-black">Barang List</h2>
                    <Link to="add" className="button is-success is-rounded">
                        <span className="icon is-small">
                            <i className="fas fa-plus"></i>
                        </span>
                        <span>Add New Barang</span>
                    </Link>
                </div>

                {/* Search Input */}
                <form onSubmit={searchData}>

                    <div className="field has-addons mb-4">
                        <div className="control">
                            <input
                                className="input"
                                type="text"
                                placeholder="Search by Barang"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}

                            />
                        </div>
                        <div className="control">
                            <button type="submit" className="button is-info">Search</button>
                        </div>
                    </div>
                </form>

                {/* User Table */}
                <div className="table-container">
                    <table className="table is-fullwidth is-bordered is-hoverable custom-hover-table">
                        <thead>
                            <tr className="has-background-grey">
                                <th style={{ width: '75px' }} onClick={() => handleSort('id')}>
                                    <div className='is-flex is-justify-content-space-between is-align-items-center'>
                                        <span>
                                            No
                                        </span>
                                        {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? (
                                            <i className="fa fa-arrow-up"></i>
                                        ) : (
                                            <i className="fa fa-arrow-down"></i>
                                        ))}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('barang.name')}>
                                    <div className="is-flex is-justify-content-space-between is-align-items-center">
                                        <span>
                                            Barang
                                        </span>
                                        {sortConfig.key === 'barang.name' && (sortConfig.direction === 'asc' ? (
                                            <i className="fa fa-arrow-up"></i>
                                        ) : (
                                            <i className="fa fa-arrow-down"></i>
                                        ))}
                                    </div>
                                </th>
                                <th style={{ width: '150px' }}>Actions</th>
                            </tr>

                        </thead>
                        <tbody className="has-background-light">
                            {Array.isArray(barang) && barang.map((brg, index) => (
                                <tr key={brg.id}>
                                    <td className="has-text-black">{index + 1}</td>
                                    <td className="has-text-black">{brg.name}</td>

                                    <td>
                                        <div className="buttons are-small">
                                            <Link
                                                to={`edit/${brg.id}`}
                                                className="button is-light is-info"
                                            >
                                                <span>Edit</span>
                                            </Link>
                                            <button
                                                onClick={() => deleteBarang(brg.id)}
                                                className="button is-light is-danger"
                                            >
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}

                    <p>Total Data : {rows} Page: {rows ? page + 1 : 0} of {pages}</p>
                    <div className="pagination-container">
                        <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page <= 0}
                            className="pagination-item"
                        >
                            Prev
                        </button>

                        <span>Page {page + 1} of {pages}</span>

                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page >= pages - 1}
                            className="pagination-item"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Barang;
