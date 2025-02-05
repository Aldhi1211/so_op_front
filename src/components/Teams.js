import React, { useState, useEffect } from 'react';
import axios from "axios";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import './Table.css';
import ReactPaginate from "react-paginate";

const Teams = () => {
    const [teams, setTeam] = useState([]);
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
            const response = await axios.get('http://18.141.194.160/api/token');
            setToken(response.data.accessToken);
            const decoded = jwtDecode(response.data.accessToken);
            setName(decoded.name);
            setExpire(decoded.exp);
        } catch (error) {
            if (error.response) {
                navigate('/login');
            }
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
            getTeams();
        } else {
            navigate('/login'); // Redirect ke login jika token tidak ada
        }
    }, [page, keyword, token]);

    useEffect(() => {
        setPage(0); // Reset page ke 0 setiap kali keyword berubah
    }, [keyword]);


    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const response = await axios.get("http://18.141.194.160/api/teams", {
                    params: {
                        page: 0,  // halaman pertama
                        limit: 10, // jumlah per halaman
                        search_query: "", // query pencarian, bisa disesuaikan
                    }
                });
                setTeam(response.data.response); // Menyimpan data produk
            } catch (error) {
                console.error("Error fetching products", error);
            }
        };

        fetchTeams();
    }, []);


    const axiosJWT = axios.create();

    axiosJWT.interceptors.request.use(async (config) => {
        const currentDate = new Date();
        if (expire * 1000 < currentDate.getTime()) {
            const response = await axios.get('http://18.141.194.160/api/token');
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

    const getTeams = async () => {
        const response = await axiosJWT.get(`http://18.141.194.160/api/teams?search_query=${keyword}&page=${page}&limit=${limit}`,
            {
                // headers: {
                //     Authorization: `Bearer ${token}`
                // }
            }
        );
        console.log(response.data);

        setTeam(response.data.response);
        setPage(response.data.page);
        setPages(response.data.totalPage);
        setRows(response.data.totalRows);
    };

    // Handle Sorting
    const handleSort = (key) => {
        const direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
        setSortConfig({ key, direction });

        const sorted = [...teams].sort((a, b) => {
            if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        setTeam(sorted);
    };

    const changePage = ({ selected }) => {
        setPage(selected);
    };

    const searchData = (e) => {
        e.preventDefault();
        setPage(0);
        setKeyword(query);
    }

    const deleteTeam = async (id) => {
        try {
            await axios.delete(`http://18.141.194.160/api/teams/${id}`);
            getTeams();
        } catch (error) {
            console.log(error);
        }
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);  // Ganti halaman
    };

    // Split data sesuai dengan halaman yang dipilih
    const displayedData = teams.slice(page * limit, (page + 1) * limit);

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
                    <h2 className="title is-4 has-text-black">Teams List</h2>
                    <Link to="add" className="button is-success is-rounded">
                        <span className="icon is-small">
                            <i className="fas fa-plus"></i>
                        </span>
                        <span>Add New Teams</span>
                    </Link>
                </div>

                {/* Search Input */}
                <form onSubmit={searchData}>
                    <div className="field has-addons mb-4">
                        <div className="control">
                            <input
                                className="input"
                                type="text"
                                placeholder="Find Something here"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}

                            />
                        </div>
                        <div className="control">
                            <button type="submit" className="button is-info">Search</button>
                        </div>
                    </div>
                </form>

                {/* Stockin Table */}
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
                                <th onClick={() => handleSort('name')}>
                                    <div className="is-flex is-justify-content-space-between is-align-items-center">
                                        <span>
                                            Name
                                        </span>
                                        {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? (
                                            <i className="fa fa-arrow-up"></i>
                                        ) : (
                                            <i className="fa fa-arrow-down"></i>
                                        ))}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('jabatan')}>
                                    <div className="is-flex is-justify-content-space-between is-align-items-center">
                                        Jabatan
                                        {sortConfig.key === 'jabatan' && (sortConfig.direction === 'asc' ? (
                                            <i className="fa fa-arrow-up"></i>
                                        ) : (
                                            <i className="fa fa-arrow-down"></i>
                                        ))}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('fb')}>
                                    <div className="is-flex is-justify-content-space-between is-align-items-center">
                                        Facebook
                                        {sortConfig.key === 'fb' && (sortConfig.direction === 'asc' ? (
                                            <i className="fa fa-arrow-up"></i>
                                        ) : (
                                            <i className="fa fa-arrow-down"></i>
                                        ))}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('linkedin')}>
                                    <div className="is-flex is-justify-content-space-between is-align-items-center">
                                        Linkedin
                                        {sortConfig.key === 'linkedin' && (sortConfig.direction === 'asc' ? (
                                            <i className="fa fa-arrow-up"></i>
                                        ) : (
                                            <i className="fa fa-arrow-down"></i>
                                        ))}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('instagram')}>
                                    <div className="is-flex is-justify-content-space-between is-align-items-center">
                                        Instagram
                                        {sortConfig.key === 'instagram' && (sortConfig.direction === 'asc' ? (
                                            <i className="fa fa-arrow-up"></i>
                                        ) : (
                                            <i className="fa fa-arrow-down"></i>
                                        ))}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('description')}>
                                    <div className="is-flex is-justify-content-space-between is-align-items-center">
                                        Description
                                        {sortConfig.key === 'description' && (sortConfig.direction === 'asc' ? (
                                            <i className="fa fa-arrow-up"></i>
                                        ) : (
                                            <i className="fa fa-arrow-down"></i>
                                        ))}
                                    </div>
                                </th>
                                <th onClick={() => handleSort('foto')}>
                                    <div className="is-flex is-justify-content-space-between is-align-items-center">
                                        Foto
                                        {sortConfig.key === 'foto' && (sortConfig.direction === 'asc' ? (
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
                            {Array.isArray(teams) && teams.map((team, index) => (
                                <tr key={team.id}>
                                    <td className="has-text-black">{index + 1}</td>
                                    <td className="has-text-black">{team.name}</td>
                                    <td className="has-text-black">{team.jabatan}</td>
                                    <td className="has-text-black">{team.fb}</td>
                                    <td className="has-text-black">{team.linkedin}</td>
                                    <td className="has-text-black">{team.instagram}</td>
                                    <td className="has-text-black">{team.description}</td>
                                    <td className="has-text-black">
                                        {team.foto ? (
                                            <img src={`${team.foto}`} alt="Team" width="100" />
                                        ) : (
                                            <span>No image available</span>
                                        )}
                                    </td>

                                    <td>
                                        <div className="buttons are-small">
                                            <Link
                                                to={`edit/${team.id}`}
                                                className="button is-light is-info"
                                            >
                                                <span>Edit</span>
                                            </Link>
                                            <button
                                                onClick={() => deleteTeam(team.id)}
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

export default Teams;
