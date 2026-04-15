import React, { useState, useEffect } from 'react';
import axios from "axios";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import './Dashboard.css';
import API_BASE_URL from '../config/config';

const Barang = () => {
    const [barang, setBarang] = useState([]);
    const [token, setToken] = useState([]);
    const [expire, setExpire] = useState([]);
    const [name, setName] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || '');
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(10);
    const [pages, setPages] = useState(0);
    const [rows, setRows] = useState(0);
    const [keyword, setKeyword] = useState("");

    const refreshToken = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/token`, { withCredentials: true });
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
            const timer = setTimeout(() => setSuccessMessage(''), 3000);
            navigate(location.pathname, { replace: true, state: {} });
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    useEffect(() => { setPage(0); }, [keyword]);

    useEffect(() => {
        if (token) getBarang();
    }, [page, keyword, token, limit]);

    const axiosJWT = axios.create();
    axiosJWT.interceptors.request.use(async (config) => {
        const currentDate = new Date();
        if (expire * 1000 < currentDate.getTime()) {
            const response = await axios.get(`${API_BASE_URL}/token`, { withCredentials: true });
            config.headers.Authorization = `Bearer ${response.data.accessToken}`;
            setToken(response.data.accessToken);
            const decoded = jwtDecode(response.data.accessToken);
            setName(decoded.name);
            setExpire(decoded.exp);
        }
        return config;
    }, (error) => Promise.reject(error));

    const getBarang = async () => {
        const response = await axiosJWT.get(
            `${API_BASE_URL}/barang?search_query=${keyword}&page=${page}&limit=${limit}`
        );
        setBarang(response.data.response || []);
        setPage(response.data.page || 0);
        setPages(response.data.totalPage || 0);
        setRows(response.data.totalRows || 0);
    };

    const deleteBarang = async (id) => {
        if (!window.confirm('Hapus barang ini?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/barang/${id}`);
            getBarang();
        } catch (error) {
            console.log(error);
        }
    };

    /* Warna ikon per-item berdasarkan urutan */
    const iconColors = [
        { bg: '#E1F5EE', fill: '#0F6E56' },
        { bg: '#E6F1FB', fill: '#185FA5' },
        { bg: '#FAEEDA', fill: '#854F0B' },
        { bg: '#EEF2FF', fill: '#3C3489' },
        { bg: '#FAECE7', fill: '#993C1D' },
        { bg: '#F1EFE8', fill: '#5F5E5A' },
    ];
    const getColor = (idx) => iconColors[idx % iconColors.length];

    return (
        <>
            {/* Topbar */}
            <div className="ds-topbar">
                <div>
                    <span className="ds-topbar-title">Masterdata Barang</span>
                    <span className="ds-topbar-crumb"> / Daftar Barang</span>
                </div>
            </div>

            <div className="ds-content">
                {successMessage && <div className="ds-success">{successMessage}</div>}

                {/* ── Stat Cards ── */}
                <div className="ds-metric-grid">
                    <div className="ds-metric-card si-stat">
                        <div className="si-stat-icon" style={{ background: '#E1F5EE' }}>
                            <svg viewBox="0 0 18 18" fill="#0F6E56">
                                <path d="M3 2h12v2H3zm0 4h12v2H3zm0 4h8v2H3z" />
                            </svg>
                        </div>
                        <div>
                            <div className="si-stat-lbl">Total Barang</div>
                            <div className="si-stat-val">{rows}</div>
                            <div className="si-stat-sub ds-up">semua barang terdaftar</div>
                        </div>
                    </div>
                    <div className="ds-metric-card si-stat">
                        <div className="si-stat-icon" style={{ background: '#EFF6FF' }}>
                            <svg viewBox="0 0 18 18" fill="#0C447C">
                                <path d="M9 1a8 8 0 100 16A8 8 0 009 1zm-.5 4h1v4.5l3 1.8-.5.9-3.5-2V5z" />
                            </svg>
                        </div>
                        <div>
                            <div className="si-stat-lbl">Halaman</div>
                            <div className="si-stat-val">{rows ? page + 1 : 0}<span style={{ fontSize: 13, fontWeight: 400, color: '#6B7280' }}>/{pages}</span></div>
                            <div className="si-stat-sub" style={{ color: '#6B7280' }}>halaman aktif</div>
                        </div>
                    </div>
                    <div className="ds-metric-card si-stat">
                        <div className="si-stat-icon" style={{ background: '#F1EFE8' }}>
                            <svg viewBox="0 0 18 18" fill="#5F5E5A">
                                <path d="M3 4h12v2H3zm0 4h12v2H3zm0 4h8v2H3z" />
                            </svg>
                        </div>
                        <div>
                            <div className="si-stat-lbl">Ditampilkan</div>
                            <div className="si-stat-val">{barang.length}</div>
                            <div className="si-stat-sub" style={{ color: '#6B7280' }}>item per halaman</div>
                        </div>
                    </div>
                    <div className="ds-metric-card si-stat">
                        <div className="si-stat-icon" style={{ background: '#EAF3DE' }}>
                            <svg viewBox="0 0 18 18" fill="none" stroke="#3B6D11" strokeWidth="1.5" strokeLinecap="round">
                                <circle cx="7" cy="7" r="5" /><path d="M14 14l-3-3" />
                            </svg>
                        </div>
                        <div>
                            <div className="si-stat-lbl">Pencarian</div>
                            <div className="si-stat-val" style={{ fontSize: 14, paddingTop: 2 }}>{keyword || 'Semua'}</div>
                            <div className="si-stat-sub" style={{ color: '#6B7280' }}>keyword aktif</div>
                        </div>
                    </div>
                </div>

                {/* ── Table Card ── */}
                <div className="ds-card si-card">

                    {/* Card Header */}
                    <div className="si-card-hdr">
                        <div className="si-card-hdr-left">
                            <div className="si-hdr-icon">
                                <svg viewBox="0 0 16 16" fill="#0F6E56">
                                    <path d="M2 3h12v2H2zm0 4h12v2H2zm0 4h8v2H2z" />
                                </svg>
                            </div>
                            <div>
                                <div className="si-hdr-title">Daftar Masterdata Barang</div>
                                <div className="si-hdr-sub">{rows} barang terdaftar</div>
                            </div>
                        </div>
                        <div className="si-hdr-right">
                            <div className="si-srch">
                                <svg viewBox="0 0 16 16" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                                    <circle cx="6.5" cy="6.5" r="4" /><path d="M11 11l3 3" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Cari barang…"
                                    value={query}
                                    onChange={(e) => { setQuery(e.target.value); setPage(0); setKeyword(e.target.value); }}
                                />
                            </div>
                            <Link to="add" className="ds-btn-pri" style={{ fontSize: 11, height: 30, padding: '0 11px' }}>
                                <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" width="12" height="12">
                                    <path d="M8 2v12M2 8h12" />
                                </svg>
                                Tambah Barang
                            </Link>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="ds-table-wrap">
                        <table className="ds-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 40 }}>No</th>
                                    <th>Nama Barang</th>
                                    <th style={{ width: 100 }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.isArray(barang) && barang.map((brg, index) => {
                                    const clr = getColor(index);
                                    return (
                                        <tr key={brg.id}>
                                            <td style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>{page * limit + index + 1}</td>
                                            <td>
                                                <div className="si-barang-cell">
                                                    <div className="si-barang-ic" style={{ background: clr.bg }}>
                                                        <svg viewBox="0 0 16 16" fill={clr.fill} width="15" height="15">
                                                            <path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm1 2v8h8V4H4zm1 1h6v1H5zm0 2h6v1H5zm0 2h4v1H5z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div className="si-barang-name">{brg.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="si-act-btns">
                                                    <Link to={`edit/${brg.id}`} className="si-act-btn" title="Edit">
                                                        <svg viewBox="0 0 16 16" fill="#6B7280" width="11" height="11">
                                                            <path d="M11 2l3 3-9 9H2v-3l9-9z" />
                                                        </svg>
                                                    </Link>
                                                    <button onClick={() => deleteBarang(brg.id)} className="si-act-btn" title="Hapus">
                                                        <svg viewBox="0 0 16 16" fill="#6B7280" width="11" height="11">
                                                            <path d="M3 4h10l-1 10H4L3 4zm3-3h4v2H6V1zm-4 3h12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {barang.length === 0 && (
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'center', color: '#9CA3AF', padding: '32px 0' }}>
                                            Tidak ada barang ditemukan
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="si-card-ftr">
                        <div className="si-ftr-info">
                            Total: <strong>{rows} barang</strong>
                            &nbsp;·&nbsp; Halaman <strong>{rows ? page + 1 : 0}</strong> dari <strong>{pages}</strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <select
                                className="si-sel"
                                value={limit}
                                onChange={(e) => { setLimit(Number(e.target.value)); setPage(0); }}
                            >
                                <option value={10}>10 / halaman</option>
                                <option value={25}>25 / halaman</option>
                                <option value={50}>50 / halaman</option>
                            </select>
                            <div className="ds-pg-nav">
                                <button className="ds-pg-btn" disabled={page <= 0} onClick={() => setPage(page - 1)}>
                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M7 2L3 5l4 3" /></svg>
                                </button>
                                {Array.from({ length: Math.min(pages, 5) }, (_, i) => (
                                    <button
                                        key={i}
                                        className={`ds-pg-btn${page === i ? ' cur' : ''}`}
                                        onClick={() => setPage(i)}
                                    >{i + 1}</button>
                                ))}
                                {pages > 5 && <span style={{ fontSize: 11, color: '#9CA3AF' }}>…</span>}
                                <button className="ds-pg-btn" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>
                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M3 2l4 3-4 3" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Barang;
