import React, { useState, useEffect } from 'react';
import axios from "axios";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import './Table.css';
import ReactPaginate from "react-paginate";
import API_BASE_URL from '../config/config';

const StockOverview = () => {
    const [stocks, setStock] = useState([]);
    const [name, setName] = useState([]);
    const [token, setToken] = useState([]);
    const [expire, setExpire] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();
    const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || '');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [query, setQuery] = useState("");

    // Pagination State
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(10);  // Jumlah item per halaman
    const [pages, setPages] = useState(0);  // Total halaman
    const [rows, setRows] = useState(0);  // Total halaman
    const [keyword, setKeyword] = useState("");  // Total halaman

    const refreshToken = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/token`);
            setToken(response.data.accessToken);
            const decoded = jwtDecode(response.data.accessToken);
            setName(decoded.name);
            setExpire(decoded.exp);
        } catch (error) {
            navigate('/login');
        }
    };

    useEffect(() => {
        refreshToken();
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 3000); // Pop-up hilang setelah 3 detik
            navigate(location.pathname, { replace: true, state: {} });
            return () => clearTimeout(timer);
        }
    }, [successMessage, navigate, location.pathname]);


    useEffect(() => {
        // Pastikan token ada dan valid sebelum memanggil getBarang
        if (token) {
            getStock();
        } else {
            navigate('/login'); // Redirect ke login jika token tidak ada
        }
    }, [page, keyword, token]);

    useEffect(() => {
        setPage(0); // Reset page ke 0 setiap kali keyword berubah
    }, [keyword]);

    const axiosJWT = axios.create();

    axiosJWT.interceptors.request.use(async (config) => {
        const currentDate = new Date();
        if (expire * 1000 < currentDate.getTime()) {
            const response = await axios.get(`${API_BASE_URL}/token`);
            config.headers.Authorization = `Bearer ${response.data.accessToken}`;
            setToken(response.data.accessToken);
            const decoded = jwtDecode(response.data.accessToken);
            setName(decoded.name);
            setExpire(decoded.exp);
        }
        return config;
    }, (error) => {
        return Promise.reject(error);
    });

    const getStock = async () => {
        const response = await axiosJWT.get(`${API_BASE_URL}/stock?search_query=${keyword}&page=${page}&limit=${limit}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log(response.data.response)
        console.log("Data:", response.data.response); // Debug data
        console.log("Total Pages:", response.data.totalPage); // Debug pagination
        setStock(response.data.response);
        setPage(response.data.page);
        setPages(response.data.totalPage);
        setRows(response.data.totalRows);
    };

    const deleteStock = async (id) => {
        try {
            await axios.delete(`${API_BASE_URL}/stock/${id}`);
            getStock();
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

        const sorted = [...stocks].sort((a, b) => {
            if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        setStock(sorted);
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);  // Ganti halaman
    };

    // Split data sesuai dengan halaman yang dipilih
    const displayedData = stocks.slice(page * limit, (page + 1) * limit);

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
                    <h2 className="title is-4 has-text-black">Stock List</h2>
                    <Link to="add" className="button is-success is-rounded">
                        <span className="icon is-small">
                            <i className="fas fa-plus"></i>
                        </span>
                        <span>Add New Stock</span>
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
                                <th onClick={() => handleSort('quantity')}>
                                    <div className="is-flex is-justify-content-space-between is-align-items-center">
                                        Qty
                                        {sortConfig.key === 'quantity' && (sortConfig.direction === 'asc' ? (
                                            <i className="fa fa-arrow-up"></i>
                                        ) : (
                                            <i className="fa fa-arrow-down"></i>
                                        ))}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('satuan')}>
                                    <div className="is-flex is-justify-content-space-between is-align-items-center">
                                        Satuan
                                        {sortConfig.key === 'satuan' && (sortConfig.direction === 'asc' ? (
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
                            {Array.isArray(stocks) && stocks.map((stock, index) => (
                                <tr key={stock.id}>
                                    <td className="has-text-black">{index + 1}</td>
                                    <td className="has-text-black">{stock.barang?.name || 'Tidak Diketahui'}</td>
                                    <td className="has-text-black">{stock.quantity}</td>
                                    <td className="has-text-black">{stock.satuan}</td>
                                    <td>
                                        <div className="buttons are-small">
                                            <button
                                                onClick={() => deleteStock(stock.id)}
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

export default StockOverview;
