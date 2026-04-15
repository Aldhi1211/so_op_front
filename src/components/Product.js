import React, { useState, useEffect } from 'react';
import axios from "axios";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import './Dashboard.css';
import API_BASE_URL from '../config/config';

const Product = () => {
    const [products, setProduct] = useState([]);
    const [token, setToken] = useState([]);
    const [expire, setExpire] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();
    const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || '');
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(0);
    const [limit] = useState(10);
    const [pages, setPages] = useState(0);
    const [rows, setRows] = useState(0);
    const [keyword, setKeyword] = useState("");

    const refreshToken = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/token`, { withCredentials: true });
            setToken(response.data.accessToken);
            const decoded = jwtDecode(response.data.accessToken);
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
        if (token) getProduct();
    }, [page, keyword, token]);

    const axiosJWT = axios.create();
    axiosJWT.interceptors.request.use(async (config) => {
        const currentDate = new Date();
        if (expire * 1000 < currentDate.getTime()) {
            const response = await axios.get(`${API_BASE_URL}/token`, { withCredentials: true });
            config.headers.Authorization = `Bearer ${response.data.accessToken}`;
            setToken(response.data.accessToken);
            const decoded = jwtDecode(response.data.accessToken);
            setExpire(decoded.exp);
        }
        return config;
    }, (error) => Promise.reject(error));

    const getProduct = async () => {
        const response = await axiosJWT.get(
            `${API_BASE_URL}/product?search_query=${keyword}&page=${page}&limit=${limit}`
        );
        setProduct(response.data.response || []);
        setPage(response.data.page || 0);
        setPages(response.data.totalPage || 0);
        setRows(response.data.totalRows || 0);
    };

    const deleteProduct = async (id) => {
        if (!window.confirm('Hapus produk ini?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/product/${id}`);
            getProduct();
        } catch (error) {
            console.log(error);
        }
    };

    const searchData = (e) => {
        e.preventDefault();
        setPage(0);
        setKeyword(query);
    };

    return (
        <>
            {/* Topbar */}
            <div className="ds-topbar">
                <div>
                    <span className="ds-topbar-title">Product</span>
                    <span className="ds-topbar-crumb"> / Daftar Produk</span>
                </div>
            </div>

            <div className="ds-content">
                {successMessage && <div className="ds-success">{successMessage}</div>}

                {/* ── Stat Cards ── */}
                <div className="ds-metric-grid">
                    <div className="ds-metric-card si-stat">
                        <div className="si-stat-icon" style={{ background: '#E1F5EE' }}>
                            <svg viewBox="0 0 18 18" fill="#0F6E56">
                                <path d="M3 2h12a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm1 2v10h10V4H4z" />
                            </svg>
                        </div>
                        <div>
                            <div className="si-stat-lbl">Total Produk</div>
                            <div className="si-stat-val">{rows}</div>
                            <div className="si-stat-sub ds-up">semua produk terdaftar</div>
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
                            <div className="si-stat-val">{products.length}</div>
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
                                    <path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm1 2v8h8V4H4z" />
                                </svg>
                            </div>
                            <div>
                                <div className="si-hdr-title">Daftar Produk</div>
                                <div className="si-hdr-sub">{rows} produk terdaftar</div>
                            </div>
                        </div>
                        <div className="si-hdr-right">
                            <div className="si-srch">
                                <svg viewBox="0 0 16 16" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                                    <circle cx="6.5" cy="6.5" r="4" /><path d="M11 11l3 3" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Cari produk…"
                                    value={query}
                                    onChange={(e) => { setQuery(e.target.value); setPage(0); setKeyword(e.target.value); }}
                                />
                            </div>
                            <Link to="add" className="ds-btn-pri" style={{ fontSize: 11, height: 30, padding: '0 11px' }}>
                                <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" width="12" height="12">
                                    <path d="M8 2v12M2 8h12" />
                                </svg>
                                Tambah Produk
                            </Link>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="ds-table-wrap">
                        <table className="ds-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 40 }}>No</th>
                                    <th>Produk</th>
                                    <th>Deskripsi</th>
                                    <th>Spesifikasi</th>
                                    <th>Custom</th>
                                    <th>Gambar</th>
                                    <th>Link</th>
                                    <th style={{ width: 84 }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.isArray(products) && products.map((product, index) => (
                                    <tr key={product.id}>
                                        <td style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>{page * limit + index + 1}</td>
                                        <td>
                                            <div className="si-barang-cell">
                                                <div className="si-barang-ic" style={product.images ? { padding: 0, overflow: 'hidden' } : {}}>
                                                    {product.images
                                                        ? <img src={product.images} alt="" style={{ width: 34, height: 34, borderRadius: 9, objectFit: 'cover' }} />
                                                        : <svg viewBox="0 0 16 16" fill="#0F6E56" width="16" height="16"><path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm1 2v8h8V4H4z" /></svg>
                                                    }
                                                </div>
                                                <div>
                                                    <div className="si-barang-name">{product.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#6B7280', fontSize: 12 }}>
                                            {product.description || '-'}
                                        </td>
                                        <td>
                                            {product.specs && product.specs.length > 0
                                                ? <span className="si-badge si-b-proses">{product.specs.length} spec</span>
                                                : <span style={{ color: '#9CA3AF', fontSize: 11 }}>—</span>
                                            }
                                        </td>
                                        <td>
                                            {product.customs && product.customs.length > 0
                                                ? <span className="si-badge" style={{ background: '#F1EFE8', color: '#5F5E5A' }}>{product.customs.length} custom</span>
                                                : <span style={{ color: '#9CA3AF', fontSize: 11 }}>—</span>
                                            }
                                        </td>
                                        <td>
                                            {product.images
                                                ? <img src={product.images} alt="Product" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8, border: '1px solid #E8E8E5' }} />
                                                : <span style={{ color: '#9CA3AF', fontSize: 11 }}>No image</span>
                                            }
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                {product.link_tokped && (
                                                    <a href={product.link_tokped} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: '#0F6E56' }}>Tokopedia ↗</a>
                                                )}
                                                {product.link_whatsapp && (
                                                    <a href={product.link_whatsapp} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: '#25D366' }}>WhatsApp ↗</a>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="si-act-btns">
                                                <Link to={`edit/${product.id}`} className="si-act-btn" title="Edit">
                                                    <svg viewBox="0 0 16 16" fill="#6B7280">
                                                        <path d="M11 2l3 3-9 9H2v-3l9-9z" />
                                                    </svg>
                                                </Link>
                                                <button onClick={() => deleteProduct(product.id)} className="si-act-btn" title="Hapus">
                                                    <svg viewBox="0 0 16 16" fill="#6B7280">
                                                        <path d="M3 4h10l-1 10H4L3 4zm3-3h4v2H6V1zm-4 3h12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {products.length === 0 && (
                                    <tr>
                                        <td colSpan={8} style={{ textAlign: 'center', color: '#9CA3AF', padding: '32px 0' }}>
                                            Tidak ada produk ditemukan
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="si-card-ftr">
                        <div className="si-ftr-info">
                            Total: <strong>{rows} produk</strong>
                            &nbsp;·&nbsp; Halaman <strong>{rows ? page + 1 : 0}</strong> dari <strong>{pages}</strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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

export default Product;
