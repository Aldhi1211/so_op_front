import React, { useState, useEffect, useRef } from 'react';
import axios from "axios";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import './Dashboard.css';
import API_BASE_URL from '../config/config';

const EMPTY_FORM = {
    name: '', description: '', link_tokped: '', link_whatsapp: '',
    images: null, spesifications: [''], customs: [''],
};

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

    // ── Add modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState(EMPTY_FORM);
    const [imgPreview, setImgPreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const fileRef = useRef(null);

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

    // ── Add modal handlers
    const openAdd = () => { setAddForm(EMPTY_FORM); setImgPreview(null); setShowAddModal(true); };
    const closeAdd = () => { setShowAddModal(false); setImgPreview(null); };

    const setField = (k, v) => setAddForm(f => ({ ...f, [k]: v }));

    const handleFile = (file) => {
        if (!file) return;
        setField('images', file);
        setImgPreview(URL.createObjectURL(file));
    };

    const addArrayItem  = (k) => setAddForm(f => ({ ...f, [k]: [...f[k], ''] }));
    const removeArrayItem = (k, i) => setAddForm(f => ({ ...f, [k]: f[k].filter((_, idx) => idx !== i) }));
    const updateArrayItem = (k, i, v) => setAddForm(f => {
        const arr = [...f[k]]; arr[i] = v; return { ...f, [k]: arr };
    });

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = new FormData();
            data.append('name', addForm.name);
            data.append('description', addForm.description);
            data.append('link_tokped', addForm.link_tokped);
            data.append('link_whatsapp', addForm.link_whatsapp);
            if (addForm.images) data.append('images', addForm.images);

            const res = await axios.post(`${API_BASE_URL}/product`, data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const idProduct = res.data.product.id;

            const specData = addForm.spesifications.filter(s => s.trim()).map(s => ({ id_product: idProduct, spesification: s }));
            if (specData.length) await axios.post(`${API_BASE_URL}/specs`, specData);

            const customData = addForm.customs.filter(c => c.trim()).map(c => ({ id_product: idProduct, custom: c }));
            if (customData.length) await axios.post(`${API_BASE_URL}/custom`, customData);

            setSuccessMessage('Produk berhasil ditambahkan!');
            closeAdd();
            getProduct();
        } catch (err) {
            alert(err.response?.data?.message || 'Terjadi kesalahan saat menambahkan produk.');
        } finally {
            setSaving(false);
        }
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
                            <button onClick={openAdd} className="ds-btn-pri" style={{ fontSize: 11, height: 30, padding: '0 11px' }}>
                                <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" width="12" height="12">
                                    <path d="M8 2v12M2 8h12" />
                                </svg>
                                Tambah Produk
                            </button>
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

            {/* ── Add Product Modal ── */}
            {showAddModal && (
                <div className="ds-modal-backdrop" onClick={closeAdd}>
                    <div className="ds-modal" style={{ width: 620 }} onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="ds-modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 30, height: 30, background: '#E1F5EE', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg viewBox="0 0 16 16" fill="#0F6E56" width="14" height="14"><path d="M8 2v12M2 8h12" /></svg>
                                </div>
                                <div>
                                    <div className="ds-modal-title">Tambah Produk Baru</div>
                                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>Isi informasi produk lengkap di bawah ini</div>
                                </div>
                            </div>
                            <button className="ds-modal-close" onClick={closeAdd}>✕</button>
                        </div>

                        <form onSubmit={handleAddSubmit}>
                            <div className="ds-modal-body" style={{ maxHeight: '65vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>

                                {/* Informasi Produk */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                                        <div style={{ width: 18, height: 18, background: '#E1F5EE', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <svg viewBox="0 0 16 16" fill="#0F6E56" width="10" height="10"><path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm1 2v8h8V4H4zm1 1h6v1H5zm0 2h6v1H5zm0 2h4v1H5z"/></svg>
                                        </div>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: '#0F6E56', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Informasi Produk</div>
                                    </div>
                                    <div className="ds-form-grid">
                                        <div className="ds-fld span2">
                                            <label>Nama Produk</label>
                                            <div style={{ position: 'relative' }}>
                                                <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} viewBox="0 0 16 16" fill="#9CA3AF" width="13" height="13"><path d="M8 1l7 4v6l-7 4-7-4V5l7-4zm0 2L2.5 6 8 9.1 13.5 6 8 3zM2 7.1v3.4L7.5 13V9.6L2 7.1zm7.5 2.5V13L15 10.5V7.1L9.5 9.6z"/></svg>
                                                <input type="text" placeholder="Masukkan nama produk…" style={{ paddingLeft: 30 }} value={addForm.name} onChange={e => setField('name', e.target.value)} required autoFocus />
                                            </div>
                                        </div>
                                        <div className="ds-fld span2">
                                            <label>Deskripsi</label>
                                            <div style={{ position: 'relative' }}>
                                                <svg style={{ position: 'absolute', left: 10, top: 9, pointerEvents: 'none' }} viewBox="0 0 16 16" fill="#9CA3AF" width="13" height="13"><path d="M2 3h12v2H2zm0 4h12v2H2zm0 4h8v2H2z"/></svg>
                                                <textarea placeholder="Deskripsi singkat produk…" rows={3} style={{ paddingLeft: 30 }} value={addForm.description} onChange={e => setField('description', e.target.value)} required />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Links */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                                        <div style={{ width: 18, height: 18, background: '#E6F1FB', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <svg viewBox="0 0 16 16" fill="#185FA5" width="10" height="10"><path d="M6 3a1 1 0 000 2h.586l-4.293 4.293a1 1 0 101.414 1.414L8 6.414V7a1 1 0 102 0V4a1 1 0 00-1-1H6z"/><path d="M3 9a1 1 0 00-1 1v3a1 1 0 001 1h10a1 1 0 001-1v-3a1 1 0 10-2 0v2H4v-2a1 1 0 00-1-1z"/></svg>
                                        </div>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: '#185FA5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Links</div>
                                    </div>
                                    <div className="ds-form-grid">
                                        <div className="ds-fld">
                                            <label>Link Tokopedia</label>
                                            <div style={{ position: 'relative' }}>
                                                <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} viewBox="0 0 16 16" fill="#00AA5B" width="13" height="13"><path d="M2 2h12v1L8 8 2 3V2zm0 2.5l6 4.5 6-4.5V13H2V4.5z"/></svg>
                                                <input type="url" placeholder="https://tokopedia.com/…" style={{ paddingLeft: 30 }} value={addForm.link_tokped} onChange={e => setField('link_tokped', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="ds-fld">
                                            <label>Link WhatsApp</label>
                                            <div style={{ position: 'relative' }}>
                                                <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} viewBox="0 0 16 16" fill="#25D366" width="13" height="13"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zM5.5 9.5c1 1.5 3 2.5 3 2.5l1-1s.5 0 1.5 1c.5.5.5 1 0 1.5-.5.5-1.5 1-2.5.5S4 11 3.5 9.5c-.5-1.5 0-3 .5-3.5.5-.5 1-.5 1.5 0 1 1 1 1.5 1 1.5L6 8.5s-.5 0 .5 1-.5 0-.5 0z"/></svg>
                                                <input type="url" placeholder="https://wa.me/…" style={{ paddingLeft: 30 }} value={addForm.link_whatsapp} onChange={e => setField('link_whatsapp', e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Gambar */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                                        <div style={{ width: 18, height: 18, background: '#FAEEDA', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <svg viewBox="0 0 16 16" fill="none" stroke="#854F0B" strokeWidth="1.5" width="10" height="10"><rect x="1" y="1" width="14" height="14" rx="2"/><circle cx="5" cy="5" r="1.2"/><path d="M1 11l4-4 3 3 2-2 5 5"/></svg>
                                        </div>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: '#854F0B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Gambar Produk</div>
                                    </div>
                                    <div
                                        onClick={() => fileRef.current?.click()}
                                        onDragOver={e => e.preventDefault()}
                                        onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                                        style={{ border: '1.5px dashed #D1D5DB', borderRadius: 10, padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, background: '#FAFAFA', transition: 'border-color 0.15s' }}
                                    >
                                        {imgPreview
                                            ? <img src={imgPreview} alt="preview" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #E5E7EB', flexShrink: 0 }} />
                                            : <div style={{ width: 64, height: 64, background: '#F3F4F6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.5} width="26" height="26"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                                              </div>
                                        }
                                        <div>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{addForm.images ? addForm.images.name : 'Klik atau drag & drop gambar'}</div>
                                            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>PNG, JPG, WEBP · maks. 5MB</div>
                                            {imgPreview && <button type="button" onClick={e => { e.stopPropagation(); setField('images', null); setImgPreview(null); }} style={{ marginTop: 5, fontSize: 10, color: '#A32D2D', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>Hapus gambar</button>}
                                        </div>
                                    </div>
                                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
                                </div>

                                {/* Spesifikasi */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                            <div style={{ width: 18, height: 18, background: '#EEF2FF', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg viewBox="0 0 16 16" fill="#3C3489" width="10" height="10"><path d="M2 3h12v2H2zm0 4h12v2H2zm0 4h8v2H2z"/></svg>
                                            </div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: '#3C3489', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Spesifikasi</div>
                                        </div>
                                        <button type="button" onClick={() => addArrayItem('spesifications')} style={{ fontSize: 10, color: '#0F6E56', background: '#E1F5EE', border: 'none', borderRadius: 6, padding: '3px 9px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                                            <svg viewBox="0 0 16 16" fill="none" stroke="#0F6E56" strokeWidth={2} strokeLinecap="round" width="9" height="9"><path d="M8 2v12M2 8h12"/></svg>
                                            Tambah
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                        {addForm.spesifications.map((s, i) => (
                                            <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                                                <div style={{ position: 'relative', flex: 1 }}>
                                                    <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} viewBox="0 0 16 16" fill="#9CA3AF" width="11" height="11"><circle cx="3" cy="8" r="1.5"/><path d="M6 8h8" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/></svg>
                                                    <input
                                                        style={{ width: '100%', fontSize: 13, padding: '7px 11px 7px 26px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#F9FAFB', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                                                        placeholder={`Spesifikasi ${i + 1}…`}
                                                        value={s}
                                                        onChange={e => updateArrayItem('spesifications', i, e.target.value)}
                                                    />
                                                </div>
                                                {addForm.spesifications.length > 1 && (
                                                    <button type="button" onClick={() => removeArrayItem('spesifications', i)} style={{ width: 26, height: 26, border: '1px solid #FCEBEB', background: '#FFF5F5', color: '#A32D2D', borderRadius: 7, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Custom */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                            <div style={{ width: 18, height: 18, background: '#FAECE7', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <svg viewBox="0 0 16 16" fill="#993C1D" width="10" height="10"><path d="M2 2h5l1 1h6v10H2V2zm4 5v4m2-4v4"/></svg>
                                            </div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: '#993C1D', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Custom</div>
                                        </div>
                                        <button type="button" onClick={() => addArrayItem('customs')} style={{ fontSize: 10, color: '#0F6E56', background: '#E1F5EE', border: 'none', borderRadius: 6, padding: '3px 9px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                                            <svg viewBox="0 0 16 16" fill="none" stroke="#0F6E56" strokeWidth={2} strokeLinecap="round" width="9" height="9"><path d="M8 2v12M2 8h12"/></svg>
                                            Tambah
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                        {addForm.customs.map((c, i) => (
                                            <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                                                <div style={{ position: 'relative', flex: 1 }}>
                                                    <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} viewBox="0 0 16 16" fill="#9CA3AF" width="11" height="11"><path d="M2 2h5l1 1h6v10H2V2z"/></svg>
                                                    <input
                                                        style={{ width: '100%', fontSize: 13, padding: '7px 11px 7px 26px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#F9FAFB', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                                                        placeholder={`Custom ${i + 1}…`}
                                                        value={c}
                                                        onChange={e => updateArrayItem('customs', i, e.target.value)}
                                                    />
                                                </div>
                                                {addForm.customs.length > 1 && (
                                                    <button type="button" onClick={() => removeArrayItem('customs', i)} style={{ width: 26, height: 26, border: '1px solid #FCEBEB', background: '#FFF5F5', color: '#A32D2D', borderRadius: 7, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>

                            {/* Footer */}
                            <div className="ds-modal-footer">
                                <button type="button" className="ds-btn-sec" onClick={closeAdd} disabled={saving}>Batal</button>
                                <button type="submit" className="ds-btn-pri" disabled={saving}>
                                    {saving
                                        ? <><svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" width="12" height="12" style={{ animation: 'spin 1s linear infinite' }}><path d="M8 2a6 6 0 110 12A6 6 0 018 2z" strokeOpacity={0.3}/><path d="M8 2a6 6 0 016 6"/></svg> Menyimpan…</>
                                        : <><svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><path d="M2 8l4 4 8-8"/></svg> Simpan Produk</>
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Product;
