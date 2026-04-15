import React, { useState, useEffect } from 'react';
import axios from "axios";
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import './Dashboard.css';
import API_BASE_URL from '../config/config';

const Overview = () => {
    const [expire, setExpire] = useState(null);
    const [token, setToken] = useState(null);
    const [name, setName] = useState('');
    const [products, setProducts] = useState([]);
    const [stockins, setStockins] = useState([]);
    const [stockouts, setStockouts] = useState([]);
    const navigate = useNavigate();

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

    useEffect(() => { refreshToken(); }, []);

    useEffect(() => {
        if (!token) return;
        const headers = { Authorization: `Bearer ${token}` };
        const fetchAll = async () => {
            const [p, si, so] = await Promise.allSettled([
                axios.get(`${API_BASE_URL}/product?search_query=&page=0&limit=5`).catch(() => null),
                axios.get(`${API_BASE_URL}/stockin?search_query=&page=0&limit=5`, { headers }).catch(() => null),
                axios.get(`${API_BASE_URL}/stockout?search_query=&page=0&limit=5`).catch(() => null),
            ]);
            if (p.value?.data?.response) setProducts(p.value.data.response);
            if (si.value?.data?.data) setStockins(si.value.data.data);
            if (so.value?.data?.response) setStockouts(so.value.data.response);
        };
        fetchAll();
    }, [token]);

    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const totalStockIn = stockins.reduce((s, x) => s + (x.quantity || 0), 0);
    const totalStockOut = stockouts.reduce((s, x) => s + (x.quantity || 0), 0);

    return (
        <>
            {/* Topbar */}
            <div className="ds-topbar">
                <div>
                    <span className="ds-topbar-title">Dashboard</span>
                    <span className="ds-topbar-crumb"> — {today}</span>
                </div>
                <div className="ds-topbar-spacer" />
                <Link to="/dashboard/stock/in" className="ds-btn-pri">
                    <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round"><path d="M8 2v12M2 8h12" /></svg>
                    Tambah Stok
                </Link>
            </div>

            <div className="ds-content">
                {/* Metric Cards */}
                <div className="ds-metric-grid">
                    <div className="ds-metric-card">
                        <div className="ds-metric-label">
                            <div className="ds-metric-icon" style={{ background: '#E1F5EE' }}>
                                <svg viewBox="0 0 14 14" fill="#0F6E56"><path d="M2 2h10v10H2z" /></svg>
                            </div>
                            Total Produk
                        </div>
                        <div className="ds-metric-val">{products.length}</div>
                        <div className="ds-metric-change ds-up">↑ Data terkini</div>
                    </div>
                    <div className="ds-metric-card">
                        <div className="ds-metric-label">
                            <div className="ds-metric-icon" style={{ background: '#E6F1FB' }}>
                                <svg viewBox="0 0 14 14" fill="#185FA5"><path d="M7 1v9M3 6l4 4 4-4M1 13h12" /></svg>
                            </div>
                            Total Stok Masuk
                        </div>
                        <div className="ds-metric-val">{totalStockIn}</div>
                        <div className="ds-metric-change ds-up">↑ {stockins.length} transaksi terakhir</div>
                    </div>
                    <div className="ds-metric-card">
                        <div className="ds-metric-label">
                            <div className="ds-metric-icon" style={{ background: '#FAEEDA' }}>
                                <svg viewBox="0 0 14 14" fill="#854F0B"><path d="M7 13V4M3 8l4-4 4 4M1 1h12" /></svg>
                            </div>
                            Total Stok Keluar
                        </div>
                        <div className="ds-metric-val">{totalStockOut}</div>
                        <div className="ds-metric-change ds-down">↓ {stockouts.length} transaksi terakhir</div>
                    </div>
                    <div className="ds-metric-card">
                        <div className="ds-metric-label">
                            <div className="ds-metric-icon" style={{ background: '#FCEBEB' }}>
                                <svg viewBox="0 0 14 14" fill="#A32D2D"><path d="M7 1a6 6 0 100 12A6 6 0 007 1zm-.5 3h1v4h-1zm0 5h1v1h-1z" /></svg>
                            </div>
                            Selamat Datang
                        </div>
                        <div className="ds-metric-val" style={{ fontSize: 16 }}>{name || 'Admin'}</div>
                        <div className="ds-metric-change" style={{ color: '#6B7280' }}>PTI Dashboard</div>
                    </div>
                </div>

                {/* Two column: Products + Stock activity */}
                <div className="ds-bot-row">
                    {/* Recent Products */}
                    <div className="ds-card">
                        <div className="ds-card-header">
                            <div>
                                <div className="ds-card-title">Produk Terbaru</div>
                                <div className="ds-card-sub">Update data produk real-time</div>
                            </div>
                            <Link to="/dashboard/product" className="ds-btn-sec" style={{ fontSize: 11 }}>
                                Lihat semua →
                            </Link>
                        </div>
                        <div className="ds-table-wrap">
                            <table className="ds-table">
                                <thead>
                                    <tr>
                                        <th>Produk</th>
                                        <th>Deskripsi</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(products) && products.map((p, i) => (
                                        <tr key={p.id || i}>
                                            <td>
                                                <div className="ds-prod-row">
                                                    <div className="ds-prod-icon" style={{ background: '#E1F5EE' }}>
                                                        {p.images
                                                            ? <img src={p.images} alt="" style={{ width: 28, height: 28, borderRadius: 7, objectFit: 'cover' }} />
                                                            : <svg viewBox="0 0 16 16" fill="#0F6E56" width="13" height="13"><path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm1 2v8h8V4H4z" /></svg>
                                                        }
                                                    </div>
                                                    <div className="ds-prod-name">{p.name}</div>
                                                </div>
                                            </td>
                                            <td style={{ color: '#6B7280', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {p.description || '-'}
                                            </td>
                                            <td>
                                                <Link to={`/dashboard/product/edit/${p.id}`} className="ds-btn-sm primary">Edit</Link>
                                            </td>
                                        </tr>
                                    ))}
                                    {products.length === 0 && (
                                        <tr><td colSpan={3} style={{ textAlign: 'center', color: '#9CA3AF', padding: '24px 0' }}>Tidak ada data produk</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right column: Stock activity */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {/* Recent Stock In */}
                        <div className="ds-card">
                            <div className="ds-card-header">
                                <div>
                                    <div className="ds-card-title">Stok Masuk Terbaru</div>
                                    <div className="ds-card-sub">{stockins.length} entri terakhir</div>
                                </div>
                                <Link to="/dashboard/stock/in" className="ds-btn-sec" style={{ fontSize: 11 }}>Lihat →</Link>
                            </div>
                            {stockins.length === 0
                                ? <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '12px 0', fontSize: 12 }}>Tidak ada data</div>
                                : stockins.map((s, i) => (
                                    <div className="ds-alert-item" key={s.id || i}>
                                        <div className="ds-alert-dot" style={{ background: '#0F6E56' }} />
                                        <div>
                                            <div className="ds-alert-text">
                                                <strong>{s.barang?.name || 'Barang'}</strong> — +{s.quantity} {s.satuan}
                                            </div>
                                            <div className="ds-alert-time">Oleh: {s.submitted_by}</div>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>

                        {/* Recent Stock Out */}
                        <div className="ds-card">
                            <div className="ds-card-header">
                                <div>
                                    <div className="ds-card-title">Stok Keluar Terbaru</div>
                                    <div className="ds-card-sub">{stockouts.length} entri terakhir</div>
                                </div>
                                <Link to="/dashboard/stock/out" className="ds-btn-sec" style={{ fontSize: 11 }}>Lihat →</Link>
                            </div>
                            {stockouts.length === 0
                                ? <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '12px 0', fontSize: 12 }}>Tidak ada data</div>
                                : stockouts.map((s, i) => (
                                    <div className="ds-alert-item" key={s.id || i}>
                                        <div className="ds-alert-dot" style={{ background: '#E24B4A' }} />
                                        <div>
                                            <div className="ds-alert-text">
                                                <strong>{s.barang?.name || 'Barang'}</strong> — -{s.quantity} {s.satuan}
                                            </div>
                                            <div className="ds-alert-time">Oleh: {s.submitted_by}</div>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Overview;
