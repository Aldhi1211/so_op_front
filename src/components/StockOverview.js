import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import './Dashboard.css';
import API_BASE_URL from '../config/config';

/* ─── helpers ─── */
const todayISO = () => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
};

const genRef = (prefix) => `${prefix}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

/* ─── Modal: Stok Masuk ─── */
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
        } catch (err) {
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
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="#0F6E56">
                                <path d="M8 2v8m-4-4l4 4 4-4M3 13h10" stroke="#0F6E56" strokeWidth="1.5" fill="none" />
                            </svg>
                            Stok masuk akan langsung menambah jumlah stok barang terpilih.
                        </div>

                        {error && <div className="ds-fld-err" style={{ marginBottom: 10 }}>{error}</div>}

                        <div className="ds-form-grid">
                            {/* Barang */}
                            <div className="ds-fld span2">
                                <label>Barang</label>
                                <select name="id_barang" value={form.id_barang} onChange={set} required>
                                    <option value="" disabled>Pilih barang...</option>
                                    {Array.isArray(barangList) && barangList.map((b) => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* No. Nota */}
                            <div className="ds-fld">
                                <label>No. Nota / PO</label>
                                <input name="nota" value={form.nota} onChange={set} placeholder="SM-2026-0001" />
                            </div>

                            {/* Tanggal */}
                            <div className="ds-fld">
                                <label>Tanggal Terima</label>
                                <input type="date" name="tanggal" value={form.tanggal} onChange={set} required />
                            </div>

                            {/* Supplier */}
                            <div className="ds-fld">
                                <label>Supplier</label>
                                <input name="supplier" value={form.supplier} onChange={set} placeholder="Nama supplier..." />
                            </div>

                            {/* Jumlah */}
                            <div className="ds-fld">
                                <label>Jumlah (Unit)</label>
                                <input type="number" name="quantity" value={form.quantity} onChange={set} placeholder="0" min="1" required />
                            </div>

                            {/* Satuan */}
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

                            {/* Catatan */}
                            <div className="ds-fld span2">
                                <label>Catatan</label>
                                <textarea name="catatan" value={form.catatan} onChange={set} placeholder="Catatan tambahan (opsional)" />
                            </div>
                        </div>
                    </div>
                    <div className="ds-modal-footer">
                        <button type="button" className="ds-btn-sec" onClick={onClose}>Batal</button>
                        <button type="submit" className="ds-btn-pri" disabled={loading}>
                            <svg viewBox="0 0 16 16" fill="white" width="12" height="12"><path d="M2 8l4 4 8-8" stroke="white" strokeWidth="2" fill="none" /></svg>
                            {loading ? 'Menyimpan...' : 'Simpan & Update Stok'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ─── Modal: Stok Keluar ─── */
const ModalKeluar = ({ token, barangList, onClose, onSuccess }) => {
    const [form, setForm] = useState({
        id_barang: '',
        ref: genRef('OUT'),
        tanggal: todayISO(),
        tipe: 'Penjualan',
        tujuan: '',
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
            await axios.post(`${API_BASE_URL}/stockout`, {
                id_barang: form.id_barang,
                quantity: Number(form.quantity),
                satuan: form.satuan,
                tanggal_keluar: form.tanggal,
                submitted_by: submittedBy,
            }, { headers: { Authorization: `Bearer ${token}` } });
            onSuccess('Stok keluar berhasil dicatat!');
        } catch (err) {
            setError('Gagal mencatat stok keluar. Coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ds-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="ds-modal">
                <div className="ds-modal-header">
                    <span className="ds-modal-title">Catat Stok Keluar</span>
                    <button className="ds-modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="ds-modal-body">
                        <div className="ds-modal-banner warn">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="#854F0B">
                                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.5 4h1v4h-1zm0 5h1v1h-1z" />
                            </svg>
                            Pastikan jumlah keluar tidak melebihi stok yang tersedia.
                        </div>

                        {error && <div className="ds-fld-err" style={{ marginBottom: 10 }}>{error}</div>}

                        <div className="ds-form-grid">
                            {/* Barang */}
                            <div className="ds-fld span2">
                                <label>Barang</label>
                                <select name="id_barang" value={form.id_barang} onChange={set} required>
                                    <option value="" disabled>Pilih barang...</option>
                                    {Array.isArray(barangList) && barangList.map((b) => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* No. Ref */}
                            <div className="ds-fld">
                                <label>No. Referensi</label>
                                <input name="ref" value={form.ref} onChange={set} placeholder="OUT-2026-0001" />
                            </div>

                            {/* Tanggal */}
                            <div className="ds-fld">
                                <label>Tanggal Keluar</label>
                                <input type="date" name="tanggal" value={form.tanggal} onChange={set} required />
                            </div>

                            {/* Tipe */}
                            <div className="ds-fld">
                                <label>Tipe Pengeluaran</label>
                                <select name="tipe" value={form.tipe} onChange={set}>
                                    <option value="Penjualan">Penjualan</option>
                                    <option value="Transfer Gudang">Transfer Gudang</option>
                                    <option value="Retur ke Supplier">Retur ke Supplier</option>
                                    <option value="Rusak / Hilang">Rusak / Hilang</option>
                                    <option value="Sample">Sample</option>
                                </select>
                            </div>

                            {/* Tujuan */}
                            <div className="ds-fld">
                                <label>Tujuan / Pelanggan</label>
                                <input name="tujuan" value={form.tujuan} onChange={set} placeholder="Nama pelanggan / tujuan..." />
                            </div>

                            {/* Jumlah */}
                            <div className="ds-fld">
                                <label>Jumlah (Unit)</label>
                                <input type="number" name="quantity" value={form.quantity} onChange={set} placeholder="0" min="1" required />
                            </div>

                            {/* Satuan */}
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

                            {/* Catatan */}
                            <div className="ds-fld span2">
                                <label>Catatan</label>
                                <textarea name="catatan" value={form.catatan} onChange={set} placeholder="Catatan tambahan (opsional)" />
                            </div>
                        </div>
                    </div>
                    <div className="ds-modal-footer">
                        <button type="button" className="ds-btn-sec" onClick={onClose}>Batal</button>
                        <button type="submit" className="ds-btn-pri" disabled={loading}>
                            <svg viewBox="0 0 16 16" fill="white" width="12" height="12"><path d="M2 8l4 4 8-8" stroke="white" strokeWidth="2" fill="none" /></svg>
                            {loading ? 'Menyimpan...' : 'Simpan & Kurangi Stok'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ─── Main: StockOverview ─── */
const StockOverview = () => {
    const [stocks, setStocks] = useState([]);
    const [token, setToken] = useState('');
    const [expire, setExpire] = useState('');
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [barangList, setBarangList] = useState([]);
    const [modal, setModal] = useState(null); // 'masuk' | 'keluar' | null
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    const refreshToken = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/token`);
            setToken(response.data.accessToken);
            const decoded = jwtDecode(response.data.accessToken);
            setExpire(decoded.exp);
        } catch {
            navigate('/login');
        }
    };

    useEffect(() => {
        refreshToken();
        const locMsg = location.state?.successMessage;
        if (locMsg) {
            setSuccessMessage(locMsg);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, []);

    useEffect(() => {
        if (successMessage) {
            const t = setTimeout(() => setSuccessMessage(''), 3000);
            return () => clearTimeout(t);
        }
    }, [successMessage]);

    useEffect(() => {
        if (token) {
            getCurrentStock();
            fetchBarang();
        }
    }, [token]);

    const axiosJWT = axios.create();
    axiosJWT.interceptors.request.use(async (config) => {
        const now = new Date();
        if (expire * 1000 < now.getTime()) {
            const res = await axios.get(`${API_BASE_URL}/token`);
            config.headers.Authorization = `Bearer ${res.data.accessToken}`;
            setToken(res.data.accessToken);
            setExpire(jwtDecode(res.data.accessToken).exp);
        }
        return config;
    }, (err) => Promise.reject(err));

    const getCurrentStock = async () => {
        setLoading(true);
        try {
            const res = await axiosJWT.get(`${API_BASE_URL}/stock/current`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStocks(res.data.response || []);
        } catch (err) {
            console.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchBarang = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/barang?search_query=&page=0&limit=100`);
            setBarangList(res.data.response || []);
        } catch (err) {
            console.error('Error fetching barang:', err.message);
        }
    };

    const handleModalSuccess = (msg) => {
        setModal(null);
        setSuccessMessage(msg);
        getCurrentStock();
    };

    const filtered = stocks.filter(s =>
        (s.barang?.name || '').toLowerCase().includes(query.toLowerCase()) ||
        (s.satuan || '').toLowerCase().includes(query.toLowerCase())
    );

    const totalBarang = filtered.length;
    const totalIn = filtered.reduce((sum, s) => sum + (s.total_in || 0), 0);
    const totalOut = filtered.reduce((sum, s) => sum + (s.total_out || 0), 0);
    const totalCurrent = filtered.reduce((sum, s) => sum + (s.current_stock || 0), 0);

    const getStockBadge = (qty) => {
        if (qty <= 0) return <span className="ds-badge ds-b-low">Habis</span>;
        if (qty <= 10) return <span className="ds-badge ds-b-warn">Kritis</span>;
        return <span className="ds-badge ds-b-ok">Normal</span>;
    };

    return (
        <>
            {/* Topbar */}
            <div className="ds-topbar">
                <div>
                    <span className="ds-topbar-title">Stok Saat Ini</span>
                    <span className="ds-topbar-crumb"> / Ringkasan Stok</span>
                </div>
            </div>

            <div className="ds-content">
                {successMessage && <div className="ds-success">{successMessage}</div>}

                {/* ── Stat Cards ── */}
                <div className="ds-metric-grid">
                    <div className="ds-metric-card si-stat">
                        <div className="si-stat-icon" style={{ background: '#E1F5EE' }}>
                            <svg viewBox="0 0 18 18" fill="#0F6E56">
                                <path d="M9 1l8 4.5v7L9 17l-8-4.5v-7L9 1zm0 2.2L2.5 7 9 10.8 15.5 7 9 3.2zM2 8.2v5.3L8.5 17v-5.3L2 8.2zm7.5 3.5V17l6.5-3.5V8.2L9.5 11.7z" />
                            </svg>
                        </div>
                        <div>
                            <div className="si-stat-lbl">Jenis Barang</div>
                            <div className="si-stat-val">{totalBarang}</div>
                            <div className="si-stat-sub" style={{ color: '#6B7280' }}>terdaftar di stok</div>
                        </div>
                    </div>

                    <div className="ds-metric-card si-stat">
                        <div className="si-stat-icon" style={{ background: '#E1F5EE' }}>
                            <svg viewBox="0 0 18 18" fill="none" stroke="#0F6E56" strokeWidth="1.5" strokeLinecap="round">
                                <path d="M9 2v10M5 8l4 4 4-4M3 15h12" />
                            </svg>
                        </div>
                        <div>
                            <div className="si-stat-lbl">Total Masuk</div>
                            <div className="si-stat-val" style={{ color: '#0F6E56' }}>+{totalIn}</div>
                            <div className="si-stat-sub ds-up">kumulatif semua waktu</div>
                        </div>
                    </div>

                    <div className="ds-metric-card si-stat">
                        <div className="si-stat-icon" style={{ background: '#FCEBEB' }}>
                            <svg viewBox="0 0 18 18" fill="none" stroke="#A32D2D" strokeWidth="1.5" strokeLinecap="round">
                                <path d="M9 16V6M5 10l4-4 4 4M3 3h12" />
                            </svg>
                        </div>
                        <div>
                            <div className="si-stat-lbl">Total Keluar</div>
                            <div className="si-stat-val" style={{ color: '#A32D2D' }}>-{totalOut}</div>
                            <div className="si-stat-sub ds-down">kumulatif semua waktu</div>
                        </div>
                    </div>

                    <div className="ds-metric-card si-stat">
                        <div className="si-stat-icon" style={{ background: '#EFF6FF' }}>
                            <svg viewBox="0 0 18 18" fill="#0C447C">
                                <path d="M3 4h12v2H3zm0 4h12v2H3zm0 4h8v2H3z" />
                            </svg>
                        </div>
                        <div>
                            <div className="si-stat-lbl">Stok Saat Ini</div>
                            <div className="si-stat-val">{totalCurrent}</div>
                            <div className="si-stat-sub ds-up">total unit tersisa</div>
                        </div>
                    </div>
                </div>

                {/* ── Main Card ── */}
                <div className="ds-card si-card">

                    {/* Card Header */}
                    <div className="si-card-hdr">
                        <div className="si-card-hdr-left">
                            <div className="si-hdr-icon">
                                <svg viewBox="0 0 16 16" fill="#0F6E56">
                                    <path d="M8 1l7 4v6l-7 4-7-4V5l7-4zm0 1.9L2.5 6 8 9.1 13.5 6 8 2.9zM2 7.1v4.4L7.5 14V9.6L2 7.1zm7.5 2.5V14l5.5-2.5V7.1L9.5 9.6z" />
                                </svg>
                            </div>
                            <div>
                                <div className="si-hdr-title">Ringkasan Stok per Barang</div>
                                <div className="si-hdr-sub">Dihitung otomatis dari riwayat masuk &amp; keluar</div>
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
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </div>
                            <button className="ds-btn-sec" style={{ fontSize: 11, height: 30, padding: '0 11px' }} onClick={() => setModal('masuk')}>
                                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12" strokeLinecap="round">
                                    <path d="M8 2v9M4 7l4 4 4-4M3 13h10" />
                                </svg>
                                Stok Masuk
                            </button>
                            <button className="ds-btn-pri" style={{ fontSize: 11, height: 30, padding: '0 11px' }} onClick={() => setModal('keluar')}>
                                <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" width="12" height="12" strokeLinecap="round">
                                    <path d="M8 14V5M4 9l4-4 4 4M3 3h10" />
                                </svg>
                                Stok Keluar
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="ds-table-wrap">
                        <table className="ds-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 40 }}>No</th>
                                    <th>Barang</th>
                                    <th>Satuan</th>
                                    <th>Total Masuk</th>
                                    <th>Total Keluar</th>
                                    <th>Stok Saat Ini</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', color: '#9CA3AF', padding: '32px 0' }}>Memuat data...</td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', color: '#9CA3AF', padding: '32px 0' }}>Tidak ada data stok</td></tr>
                                ) : filtered.map((s, i) => (
                                    <tr key={`${s.id_barang}-${s.satuan}`}>
                                        <td style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>{i + 1}</td>
                                        <td>
                                            <div className="si-barang-cell">
                                                <div className="si-barang-ic">
                                                    <svg viewBox="0 0 16 16" fill="#0F6E56">
                                                        <path d="M8 1l7 4v6l-7 4-7-4V5l7-4zm0 1.9L2.5 6 8 9.1 13.5 6 8 2.9zM2 7.1v4.4L7.5 14V9.6L2 7.1zm7.5 2.5V14l5.5-2.5V7.1L9.5 9.6z" />
                                                    </svg>
                                                </div>
                                                <div className="si-barang-name">{s.barang?.name || '-'}</div>
                                            </div>
                                        </td>
                                        <td style={{ fontSize: 12, color: '#6B7280' }}>{s.satuan}</td>
                                        <td>
                                            <div className="si-qty-cell" style={{ display: 'inline-flex' }}>
                                                <div className="si-qty-arrow">
                                                    <svg viewBox="0 0 10 10">
                                                        <path d="M5 2v6M2 5l3 3 3-3" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                                                    </svg>
                                                </div>
                                                <span className="si-qty-val">+{s.total_in}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="si-qty-cell out" style={{ display: 'inline-flex' }}>
                                                <div className="si-qty-arrow">
                                                    <svg viewBox="0 0 10 10">
                                                        <path d="M5 8V2M2 5l3-3 3 3" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                                                    </svg>
                                                </div>
                                                <span className="si-qty-val">-{s.total_out}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{
                                                fontWeight: 700, fontSize: 14,
                                                color: s.current_stock <= 0 ? '#A32D2D' : s.current_stock <= 10 ? '#854F0B' : '#111827'
                                            }}>
                                                {s.current_stock}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`si-badge ${s.current_stock <= 0 ? 'si-b-batal' : s.current_stock <= 10 ? 'si-b-proses' : 'si-b-selesai'}`}>
                                                <span className="si-badge-dot" />
                                                {s.current_stock <= 0 ? 'Habis' : s.current_stock <= 10 ? 'Kritis' : 'Normal'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="si-card-ftr">
                        <div className="si-ftr-info">
                            <strong>{filtered.length} barang</strong> ditampilkan
                            &nbsp;·&nbsp; Stok masuk: <strong style={{ color: '#0F6E56' }}>+{totalIn}</strong>
                            &nbsp;·&nbsp; Stok keluar: <strong style={{ color: '#A32D2D' }}>-{totalOut}</strong>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="ds-btn-sec" style={{ fontSize: 11, height: 30, padding: '0 11px' }} onClick={() => setModal('masuk')}>+ Stok Masuk</button>
                            <button className="ds-btn-pri" style={{ fontSize: 11, height: 30, padding: '0 11px' }} onClick={() => setModal('keluar')}>+ Stok Keluar</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {modal === 'masuk' && (
                <ModalMasuk
                    token={token}
                    barangList={barangList}
                    onClose={() => setModal(null)}
                    onSuccess={handleModalSuccess}
                />
            )}
            {modal === 'keluar' && (
                <ModalKeluar
                    token={token}
                    barangList={barangList}
                    onClose={() => setModal(null)}
                    onSuccess={handleModalSuccess}
                />
            )}
        </>
    );
};

export default StockOverview;
