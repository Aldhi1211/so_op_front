import React, { useState, useEffect } from 'react';
import axios from "axios";
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import './Dashboard.css';
import API_BASE_URL from '../config/config';

/* ─── helpers ─── */
const todayISO = () => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
};
const genRef = (p) => `${p}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

/* ─── ModalMasuk ─── */
const ModalMasuk = ({ token, barangList, onClose, onSuccess }) => {
    const [form, setForm] = useState({
        id_barang: '',
        nota: genRef('SM'),
        tanggal: todayISO(),
        supplier: '',
        quantity: '',
        satuan: '',
        catatan: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.id_barang || !form.quantity || !form.satuan) {
            setError('Barang, jumlah, dan satuan wajib diisi.');
            return;
        }
        setLoading(true);
        try {
            const decoded = jwtDecode(token);
            const submittedBy = decoded?.username || decoded?.name || decoded?.email || 'Admin';
            await axios.post(`${API_BASE_URL}/stockin`, {
                id_barang: form.id_barang,
                quantity: Number(form.quantity),
                satuan: form.satuan,
                tanggal_beli: form.tanggal,
                submitted_by: submittedBy,
            }, { headers: { Authorization: `Bearer ${token}` } });
            onSuccess('Stok masuk berhasil dicatat!');
        } catch {
            setError('Gagal mencatat stok masuk. Coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ds-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="ds-modal">
                <div className="ds-modal-header">
                    <span className="ds-modal-title">Catat Stok Masuk</span>
                    <button className="ds-modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="ds-modal-body">
                        <div className="ds-modal-banner info">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#0F6E56" strokeWidth="1.5">
                                <path d="M8 2v8m-4-4l4 4 4-4M3 13h10" />
                            </svg>
                            Stok masuk akan langsung menambah jumlah stok barang terpilih.
                        </div>
                        {error && <div className="ds-fld-err" style={{ marginBottom: 10 }}>{error}</div>}
                        <div className="ds-form-grid">
                            <div className="ds-fld span2">
                                <label>Barang</label>
                                <select name="id_barang" value={form.id_barang} onChange={set} required>
                                    <option value="" disabled>Pilih barang...</option>
                                    {Array.isArray(barangList) && barangList.map((b) => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="ds-fld">
                                <label>No. Nota / PO</label>
                                <input name="nota" value={form.nota} onChange={set} placeholder="SM-2026-0001" />
                            </div>
                            <div className="ds-fld">
                                <label>Tanggal Terima</label>
                                <input type="date" name="tanggal" value={form.tanggal} onChange={set} required />
                            </div>
                            <div className="ds-fld">
                                <label>Supplier</label>
                                <input name="supplier" value={form.supplier} onChange={set} placeholder="Nama supplier..." />
                            </div>
                            <div className="ds-fld">
                                <label>Jumlah (Unit)</label>
                                <input type="number" name="quantity" value={form.quantity} onChange={set} placeholder="0" min="1" required />
                            </div>
                            <div className="ds-fld">
                                <label>Satuan</label>
                                <select name="satuan" value={form.satuan} onChange={set} required>
                                    <option value="" disabled>Pilih satuan...</option>
                                    <option value="pcs">Pcs</option>
                                    <option value="kg">Kg</option>
                                    <option value="litre">Litre</option>
                                    <option value="box">Box</option>
                                </select>
                            </div>
                            <div className="ds-fld span2">
                                <label>Catatan</label>
                                <textarea name="catatan" value={form.catatan} onChange={set} placeholder="Catatan tambahan (opsional)" />
                            </div>
                        </div>
                    </div>
                    <div className="ds-modal-footer">
                        <button type="button" className="ds-btn-sec" onClick={onClose}>Batal</button>
                        <button type="submit" className="ds-btn-pri" disabled={loading}>
                            <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="white" strokeWidth="2">
                                <path d="M2 8l4 4 8-8" />
                            </svg>
                            {loading ? 'Menyimpan...' : 'Simpan & Update Stok'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ─── Sort icon ─── */
const SortIcon = ({ col, sortConfig }) => {
    const active = sortConfig.key === col;
    const isDesc = active && sortConfig.direction === 'desc';
    return (
        <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 1, marginLeft: 4, verticalAlign: 'middle' }}>
            <span style={{ width: 0, height: 0, borderLeft: '3px solid transparent', borderRight: '3px solid transparent', borderBottom: `4px solid ${active && !isDesc ? '#0F6E56' : '#D1D5DB'}`, display: 'block' }} />
            <span style={{ width: 0, height: 0, borderLeft: '3px solid transparent', borderRight: '3px solid transparent', borderTop: `4px solid ${isDesc ? '#0F6E56' : '#D1D5DB'}`, display: 'block' }} />
        </span>
    );
};

/* ─── Status badge ─── */
const StatusBadge = ({ status }) => {
    const s = status || 'Selesai';
    const cls = s === 'Selesai' ? 'si-b-selesai' : s === 'Diproses' ? 'si-b-proses' : 'si-b-batal';
    return (
        <span className={`si-badge ${cls}`}>
            <span className="si-badge-dot" />
            {s}
        </span>
    );
};

/* ─── StockIn ─── */
const StockIn = () => {
    const [stockins, setStockin] = useState([]);
    const [token, setToken] = useState('');
    const [expire, setExpire] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || '');

    const [sortConfig, setSortConfig] = useState({ key: 'tanggal_beli', direction: 'desc' });
    const [query, setQuery] = useState('');
    const [keyword, setKeyword] = useState('');
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(10);
    const [pages, setPages] = useState(0);
    const [rows, setRows] = useState(0);

    const [filterStatus, setFilterStatus] = useState('Semua');
    const [barangList, setBarangList] = useState([]);
    const [showModal, setShowModal] = useState(false);

    /* ── auth ── */
    const refreshToken = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/token`, { withCredentials: true });
            setToken(response.data.accessToken);
            setExpire(jwtDecode(response.data.accessToken).exp);
        } catch {
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
    }, []);

    useEffect(() => { setPage(0); }, [keyword]);

    useEffect(() => {
        if (token) { getStock(); fetchBarang(); }
    }, [page, keyword, token, limit]);

    const axiosJWT = axios.create();
    axiosJWT.interceptors.request.use(async (config) => {
        const now = new Date();
        if (expire * 1000 < now.getTime()) {
            const res = await axios.get(`${API_BASE_URL}/token`, { withCredentials: true });
            config.headers.Authorization = `Bearer ${res.data.accessToken}`;
            setToken(res.data.accessToken);
            setExpire(jwtDecode(res.data.accessToken).exp);
        }
        return config;
    }, (err) => Promise.reject(err));

    const getStock = async () => {
        try {
            const res = await axiosJWT.get(
                `${API_BASE_URL}/stockin?search_query=${keyword}&page=${page}&limit=${limit}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setStockin(res.data.data || []);
            setPage(res.data.page || 0);
            setPages(res.data.totalPage || 0);
            setRows(res.data.totalRows || 0);
        } catch (err) {
            console.error(err.message);
        }
    };

    const fetchBarang = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/barang?search_query=&page=0&limit=100`);
            setBarangList(res.data.response || []);
        } catch (err) {
            console.error(err.message);
        }
    };

    const handleSort = (key) => {
        const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
        setSortConfig({ key, direction });
        const sorted = [...stockins].sort((a, b) => {
            const av = key.includes('.') ? a[key.split('.')[0]]?.[key.split('.')[1]] : a[key];
            const bv = key.includes('.') ? b[key.split('.')[0]]?.[key.split('.')[1]] : b[key];
            if (av < bv) return direction === 'asc' ? -1 : 1;
            if (av > bv) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        setStockin(sorted);
    };

    /* ── derived stats ── */
    const totalQty = stockins.reduce((s, x) => s + (x.quantity || 0), 0);
    const selesaiCount = stockins.filter(x => (x.status || 'Selesai') === 'Selesai').length;
    const latestEntry = stockins.reduce((latest, x) => {
        if (!x.tanggal_beli) return latest;
        const d = new Date(x.tanggal_beli);
        return (!latest || d > latest) ? d : latest;
    }, null);

    /* ── client-side filter ── */
    const filtered = stockins.filter(x => {
        const status = x.status || 'Selesai';
        return filterStatus === 'Semua' || status === filterStatus;
    });

    /* ── format ── */
    const fmtDate = (s) => {
        if (!s) return '-';
        return new Intl.DateTimeFormat('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(s));
    };
    const fmtTime = (s) => {
        if (!s) return '';
        return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(s)) + ' WIB';
    };
    const fmtShort = (d) => {
        if (!d) return '-';
        return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(d);
    };
    const fmtLastTime = (d) => {
        if (!d) return '';
        return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(d);
    };

    const CHIPS = ['Semua', 'Selesai', 'Diproses', 'Dibatalkan'];

    return (
        <>
            {/* Topbar */}
            <div className="ds-topbar">
                <div>
                    <span className="ds-topbar-title">Stok Masuk</span>
                    <span className="ds-topbar-crumb"> / Riwayat Penerimaan</span>
                </div>
            </div>

            <div className="ds-content">
                {successMessage && <div className="ds-success">{successMessage}</div>}

                {/* ── Stat Cards ── */}
                <div className="ds-metric-grid">
                    {/* Total Transaksi */}
                    <div className="ds-metric-card si-stat">
                        <div className="si-stat-icon" style={{ background: '#E1F5EE' }}>
                            <svg viewBox="0 0 18 18" fill="none" stroke="#0F6E56" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 2v10M5 8l4 4 4-4M3 15h12" />
                            </svg>
                        </div>
                        <div>
                            <div className="si-stat-lbl">Total Transaksi</div>
                            <div className="si-stat-val">{rows}</div>
                            <div className="si-stat-sub" style={{ color: '#6B7280' }}>semua data</div>
                        </div>
                    </div>

                    {/* Total Qty Masuk */}
                    <div className="ds-metric-card si-stat">
                        <div className="si-stat-icon" style={{ background: '#E1F5EE' }}>
                            <svg viewBox="0 0 18 18" fill="#0F6E56">
                                <path d="M3 3h12v2H3zm0 5h12v2H3zm0 5h8v2H3z" />
                            </svg>
                        </div>
                        <div>
                            <div className="si-stat-lbl">Total Qty Masuk</div>
                            <div className="si-stat-val" style={{ color: '#0F6E56' }}>+{totalQty}</div>
                            <div className="si-stat-sub ds-up">unit diterima</div>
                        </div>
                    </div>

                    {/* Selesai */}
                    <div className="ds-metric-card si-stat">
                        <div className="si-stat-icon" style={{ background: '#EAF3DE' }}>
                            <svg viewBox="0 0 18 18" fill="#3B6D11">
                                <path d="M9 1a8 8 0 100 16A8 8 0 009 1zm3.7 6.3l-4.2 4.2a1 1 0 01-1.4 0L5.3 9.7a1 1 0 011.4-1.4L8 9.6l3.3-3.3a1 1 0 011.4 1.4z" />
                            </svg>
                        </div>
                        <div>
                            <div className="si-stat-lbl">Selesai</div>
                            <div className="si-stat-val">{selesaiCount}</div>
                            <div className="si-stat-sub ds-up">
                                {rows > 0 ? Math.round((selesaiCount / stockins.length) * 100) : 0}% berhasil
                            </div>
                        </div>
                    </div>

                    {/* Terakhir Masuk */}
                    <div className="ds-metric-card si-stat">
                        <div className="si-stat-icon" style={{ background: '#F1EFE8' }}>
                            <svg viewBox="0 0 18 18" fill="#5F5E5A">
                                <path d="M9 1a8 8 0 100 16A8 8 0 009 1zm-.5 4h1v4.5l3 1.8-.5.9-3.5-2V5z" />
                            </svg>
                        </div>
                        <div>
                            <div className="si-stat-lbl">Terakhir Masuk</div>
                            <div className="si-stat-val" style={{ fontSize: 16 }}>{fmtShort(latestEntry)}</div>
                            <div className="si-stat-sub" style={{ color: '#6B7280' }}>
                                {latestEntry ? fmtLastTime(latestEntry) + ' WIB' : '-'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Main Card ── */}
                <div className="ds-card si-card">

                    {/* Card Header */}
                    <div className="si-card-hdr">
                        <div className="si-card-hdr-left">
                            <div className="si-hdr-icon">
                                <svg viewBox="0 0 16 16" fill="none" stroke="#0F6E56" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M8 2v8m-4-4l4 4 4-4M3 13h10" />
                                </svg>
                            </div>
                            <div>
                                <div className="si-hdr-title">Riwayat Stok Masuk</div>
                                <div className="si-hdr-sub">
                                    {rows} total transaksi · Diperbarui {fmtDate(new Date())}
                                </div>
                            </div>
                        </div>
                        <div className="si-hdr-right">
                            <button className="ds-btn-sec" style={{ fontSize: 11, height: 30, padding: '0 11px' }}>
                                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
                                    <path d="M2 4h12M4 8h8M6 12h4" strokeLinecap="round" />
                                </svg>
                                Filter
                            </button>
                            <button className="ds-btn-sec" style={{ fontSize: 11, height: 30, padding: '0 11px' }}>
                                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
                                    <path d="M8 14V6m-4 4l4-4 4 4M3 3h10" strokeLinecap="round" />
                                </svg>
                                Export
                            </button>
                            <button className="ds-btn-pri" style={{ fontSize: 11, height: 30, padding: '0 11px' }} onClick={() => setShowModal(true)}>
                                <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" width="12" height="12">
                                    <path d="M8 2v12M2 8h12" />
                                </svg>
                                Catat Masuk
                            </button>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="si-fbar">
                        {CHIPS.map(c => (
                            <button
                                key={c}
                                className={`si-chip${filterStatus === c ? ' on' : ''}`}
                                onClick={() => setFilterStatus(c)}
                            >{c}</button>
                        ))}
                        <div className="si-fbar-sep" />
                        <div className="si-srch">
                            <svg viewBox="0 0 16 16" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                                <circle cx="6.5" cy="6.5" r="4" /><path d="M11 11l3 3" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Cari transaksi…"
                                value={query}
                                onChange={(e) => { setQuery(e.target.value); setPage(0); setKeyword(e.target.value); }}
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="ds-table-wrap">
                        <table className="ds-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 44 }}>
                                        <input type="checkbox" style={{ width: 13, height: 13 }} />
                                    </th>
                                    <th style={{ width: 40 }}>No</th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('barang.name')}>
                                        Barang <SortIcon col="barang.name" sortConfig={sortConfig} />
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('tanggal_beli')}>
                                        Tanggal Beli <SortIcon col="tanggal_beli" sortConfig={sortConfig} />
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('quantity')}>
                                        Qty <SortIcon col="quantity" sortConfig={sortConfig} />
                                    </th>
                                    <th>Satuan</th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('submitted_by')}>
                                        Submitted By <SortIcon col="submitted_by" sortConfig={sortConfig} />
                                    </th>
                                    <th>Status</th>
                                    <th style={{ width: 84 }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} style={{ textAlign: 'center', color: '#9CA3AF', padding: '32px 0' }}>
                                            Tidak ada data stok masuk
                                        </td>
                                    </tr>
                                ) : filtered.map((item, idx) => (
                                    <tr key={item.id}>
                                        <td><input type="checkbox" style={{ width: 13, height: 13 }} /></td>
                                        <td style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>
                                            {page * limit + idx + 1}
                                        </td>
                                        <td>
                                            <div className="si-barang-cell">
                                                <div className="si-barang-ic">
                                                    <svg viewBox="0 0 16 16">
                                                        <path d="M8 1l7 4v6l-7 4-7-4V5l7-4zm0 1.9L2.5 6 8 9.1 13.5 6 8 2.9zM2 7.1v4.4L7.5 14V9.6L2 7.1zm7.5 2.5V14l5.5-2.5V7.1L9.5 9.6z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <div className="si-barang-name">{item.barang?.name || 'Tidak Diketahui'}</div>
                                                    <div className="si-barang-sku">ID: {item.id_barang}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="si-tgl-cell">
                                                <div className="si-tgl-date">{fmtDate(item.tanggal_beli)}</div>
                                                <div className="si-tgl-time">{fmtTime(item.tanggal_beli)}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="si-qty-cell">
                                                <div className="si-qty-arrow">
                                                    <svg viewBox="0 0 10 10">
                                                        <path d="M5 2v6M2 5l3 3 3-3" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                                                    </svg>
                                                </div>
                                                <span className="si-qty-val">+{item.quantity}</span>
                                                <span className="si-qty-sat">{item.satuan}</span>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: 12, color: '#6B7280' }}>{item.satuan}</td>
                                        <td>
                                            <div className="si-user-cell">
                                                <div className="si-user-av">{getInitials(item.submitted_by)}</div>
                                                <div className="si-user-name">{item.submitted_by || '-'}</div>
                                            </div>
                                        </td>
                                        <td><StatusBadge status={item.status} /></td>
                                        <td>
                                            <div className="si-act-btns">
                                                <button className="si-act-btn" title="Lihat detail">
                                                    <svg viewBox="0 0 16 16" fill="none">
                                                        <circle cx="8" cy="8" r="6" stroke="#6B7280" strokeWidth="1.2" />
                                                        <path d="M8 7v4M8 5.5v.5" stroke="#6B7280" strokeWidth="1.3" strokeLinecap="round" />
                                                    </svg>
                                                </button>
                                                <button className="si-act-btn" title="Edit">
                                                    <svg viewBox="0 0 16 16" fill="#6B7280">
                                                        <path d="M11 2l3 3-9 9H2v-3l9-9z" />
                                                    </svg>
                                                </button>
                                                <button className="si-act-btn" title="Hapus" style={{ '--hover-bg': '#FCEBEB' }}>
                                                    <svg viewBox="0 0 16 16" fill="#6B7280">
                                                        <path d="M3 4h10l-1 10H4L3 4zm3-3h4v2H6V1zm-4 3h12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="si-card-ftr">
                        <div className="si-ftr-info">
                            Total: <strong>{rows} transaksi</strong>
                            &nbsp;·&nbsp; Halaman <strong>{rows ? page + 1 : 0}</strong> dari <strong>{pages}</strong>
                            &nbsp;·&nbsp; Total qty: <strong style={{ color: '#0F6E56' }}>+{totalQty}</strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <select
                                className="si-sel"
                                style={{ fontSize: 11 }}
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

            {/* Modal */}
            {showModal && (
                <ModalMasuk
                    token={token}
                    barangList={barangList}
                    onClose={() => setShowModal(false)}
                    onSuccess={(msg) => { setShowModal(false); setSuccessMessage(msg); getStock(); }}
                />
            )}
        </>
    );
};

export default StockIn;
