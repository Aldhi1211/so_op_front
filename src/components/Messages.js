import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import './Dashboard.css';
import API_BASE_URL from '../config/config';

const AV_COLORS = [
    { bg: '#BFDBFE', fg: '#1D4ED8' },
    { bg: '#FBCFE8', fg: '#DB2777' },
    { bg: '#A7F3D0', fg: '#065F46' },
    { bg: '#DDD6FE', fg: '#3C3489' },
    { bg: '#FDE68A', fg: '#92400E' },
    { bg: '#BAE6FD', fg: '#0369A1' },
    { bg: '#D1D5DB', fg: '#374151' },
    { bg: '#FECACA', fg: '#991B1B' },
];

function getAvColor(name) {
    const idx = ((name || '').charCodeAt(0) || 0) % AV_COLORS.length;
    return AV_COLORS[idx];
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

function formatTime(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diff = today - msgDay;
    if (diff === 0) return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    if (diff === 86400000) return 'Kemarin';
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

function formatTimeLabel(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diff = today - msgDay;
    if (diff === 0) return 'Hari ini';
    if (diff === 86400000) return 'Kemarin';
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatFull(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const CHIPS = [
    { key: 'semua', label: 'Semua' },
    { key: 'belum-dibaca', label: 'Belum Dibaca' },
    { key: 'dibaca', label: 'Dibaca' },
];

const Messages = () => {
    const [messages, setMessages] = useState([]);
    const [token, setToken] = useState('');
    const [expire, setExpire] = useState(0);
    const [selected, setSelected] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(0);
    const [totalPage, setTotalPage] = useState(0);
    const [totalRows, setTotalRows] = useState(0);
    const [limit] = useState(8);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('semua');
    const [replyText, setReplyText] = useState('');

    const axiosJWT = axios.create();

    const refreshToken = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/token`);
            const decoded = jwtDecode(res.data.accessToken);
            setToken(res.data.accessToken);
            setExpire(decoded.exp);
            return res.data.accessToken;
        } catch {
            return null;
        }
    }, []);

    useEffect(() => {
        const stored = localStorage.getItem('accessToken');
        if (stored) {
            try {
                const decoded = jwtDecode(stored);
                setToken(stored);
                setExpire(decoded.exp);
            } catch {}
        }
    }, []);

    axiosJWT.interceptors.request.use(async (config) => {
        const now = Date.now() / 1000;
        if (expire < now) {
            const newToken = await refreshToken();
            if (newToken) config.headers.Authorization = `Bearer ${newToken}`;
        } else {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    }, Promise.reject);

    const fetchMessages = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await axiosJWT.get(
                `${API_BASE_URL}/contacts?search_query=${query}&page=${page}&limit=${limit}`
            );
            setMessages(res.data.response || []);
            setTotalRows(res.data.totalRows || 0);
            setTotalPage(res.data.totalPage || 0);
        } catch {
            setMessages([]);
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, query, page, limit]);

    useEffect(() => { fetchMessages(); }, [fetchMessages]);
    useEffect(() => { setPage(0); }, [query]);

    const openMessage = async (msg) => {
        setSelected(msg);
        setReplyText(
            `Yth. ${msg.nama},\n\nTerima kasih atas pesan Anda.\n\n\n\nSalam hormat,\nTim Admin`
        );
        if (!msg.is_read) {
            try {
                await axiosJWT.patch(`${API_BASE_URL}/contacts/${msg.id}/read`);
                setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
                setSelected(prev => prev ? { ...prev, is_read: true } : prev);
            } catch {}
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await axiosJWT.delete(`${API_BASE_URL}/contacts/${deleteTarget.id}`);
            setMessages(prev => prev.filter(m => m.id !== deleteTarget.id));
            if (selected && selected.id === deleteTarget.id) setSelected(null);
            setDeleteTarget(null);
        } catch {}
    };

    const filteredMessages = messages.filter(m => {
        if (filter === 'belum-dibaca') return !m.is_read;
        if (filter === 'dibaca') return m.is_read;
        return true;
    });

    const unreadCount = messages.filter(m => !m.is_read).length;
    const readCount = messages.filter(m => m.is_read).length;

    return (
        <div className="ds-content">

            {/* ── Stat Cards ── */}
            <div className="ds-metric-grid">
                <div className="ds-metric-card">
                    <div className="si-stat">
                        <div className="si-stat-icon" style={{ background: '#E1F5EE' }}>
                            <svg viewBox="0 0 18 18" fill="#0F6E56">
                                <path d="M2 3h14a1 1 0 011 1v9a1 1 0 01-1 1l-4-2.5H2a1 1 0 01-1-1V4a1 1 0 011-1z"/>
                            </svg>
                        </div>
                        <div>
                            <div className="si-stat-lbl">Total Pesan</div>
                            <div className="si-stat-val">{totalRows}</div>
                            <div className="si-stat-sub" style={{ color: '#6B7280' }}>bulan ini</div>
                        </div>
                    </div>
                </div>
                <div className="ds-metric-card">
                    <div className="si-stat">
                        <div className="si-stat-icon" style={{ background: '#FAEEDA' }}>
                            <svg viewBox="0 0 18 18" fill="#854F0B">
                                <path d="M2 3h14a1 1 0 011 1v9a1 1 0 01-1 1l-4-2.5H2a1 1 0 01-1-1V4a1 1 0 011-1z"/>
                            </svg>
                        </div>
                        <div>
                            <div className="si-stat-lbl">Belum Dibaca</div>
                            <div className="si-stat-val" style={{ color: '#854F0B' }}>{unreadCount}</div>
                            <div className="si-stat-sub ds-down">Perlu direspons</div>
                        </div>
                    </div>
                </div>
                <div className="ds-metric-card">
                    <div className="si-stat">
                        <div className="si-stat-icon" style={{ background: '#E1F5EE' }}>
                            <svg viewBox="0 0 18 18" fill="#0F6E56">
                                <path d="M2 15V3l14 6-14 6z"/>
                            </svg>
                        </div>
                        <div>
                            <div className="si-stat-lbl">Sudah Dibaca</div>
                            <div className="si-stat-val">{readCount}</div>
                            <div className="si-stat-sub ds-up">
                                {totalRows > 0 ? Math.round((readCount / totalRows) * 100) : 0}% dibaca
                            </div>
                        </div>
                    </div>
                </div>
                <div className="ds-metric-card">
                    <div className="si-stat">
                        <div className="si-stat-icon" style={{ background: '#FCEBEB' }}>
                            <svg viewBox="0 0 18 18" fill="#A32D2D">
                                <path d="M9 1a8 8 0 100 16A8 8 0 009 1zm-.5 4h1v5h-1zm0 6h1v1h-1z"/>
                            </svg>
                        </div>
                        <div>
                            <div className="si-stat-lbl">Belum Dibaca</div>
                            <div className="si-stat-val" style={{ color: '#A32D2D' }}>{unreadCount}</div>
                            <div className="si-stat-sub ds-down">dari {totalRows} total</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Two-column layout ── */}
            <div className="msg-layout">

                {/* LEFT: Table */}
                <div className="ds-card" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Header */}
                    <div className="si-card-hdr">
                        <div className="si-card-hdr-left">
                            <div className="si-hdr-icon">
                                <svg viewBox="0 0 16 16" fill="none" stroke="#0F6E56" strokeWidth="1.3" strokeLinecap="round">
                                    <path d="M2 3h12a1 1 0 011 1v7a1 1 0 01-1 1l-3-1.5H2a1 1 0 01-1-1V4a1 1 0 011-1z"/>
                                </svg>
                            </div>
                            <div>
                                <div className="si-hdr-title">Kotak Masuk</div>
                                <div className="si-hdr-sub">{totalRows} pesan · {unreadCount} belum dibaca</div>
                            </div>
                        </div>
                        <div className="si-hdr-right">
                            <button className="ds-btn-sm" style={{ fontSize: 11 }}>
                                <svg viewBox="0 0 16 16" fill="currentColor" width="11" height="11">
                                    <path d="M2 8l4 4 8-8"/>
                                </svg>
                                Tandai semua dibaca
                            </button>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="si-fbar">
                        {CHIPS.map(c => (
                            <button
                                key={c.key}
                                className={`si-chip${filter === c.key ? ' on' : ''}`}
                                onClick={() => setFilter(c.key)}
                            >
                                {c.label}
                            </button>
                        ))}
                        <div className="si-fbar-sep" />
                        <div className="si-srch">
                            <svg viewBox="0 0 16 16" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round">
                                <circle cx="6.5" cy="6.5" r="4"/>
                                <path d="M11 11l3 3"/>
                            </svg>
                            <input
                                type="text"
                                placeholder="Cari pesan…"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table className="ds-table msg-tbl">
                            <colgroup>
                                <col style={{ width: '4%' }} />
                                <col style={{ width: '27%' }} />
                                <col style={{ width: '21%' }} />
                                <col style={{ width: '25%' }} />
                                <col style={{ width: '12%' }} />
                                <col style={{ width: '11%' }} />
                            </colgroup>
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: 14 }}>
                                        <input type="checkbox" style={{ width: 12, height: 12 }} />
                                    </th>
                                    <th>Pengirim</th>
                                    <th>Perusahaan</th>
                                    <th>Pratinjau Pesan</th>
                                    <th>Waktu</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 13 }}>
                                            Memuat…
                                        </td>
                                    </tr>
                                )}
                                {!loading && filteredMessages.length === 0 && (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 13 }}>
                                            {filter === 'semua' ? 'Belum ada pesan masuk.' : 'Tidak ada pesan untuk filter ini.'}
                                        </td>
                                    </tr>
                                )}
                                {!loading && filteredMessages.map((msg) => {
                                    const { bg, fg } = getAvColor(msg.nama);
                                    const isActive = selected && selected.id === msg.id;
                                    const isUnread = !msg.is_read;
                                    return (
                                        <tr
                                            key={msg.id}
                                            className={
                                                'msg-row' +
                                                (isUnread ? ' msg-row-unread' : '') +
                                                (isActive ? ' msg-row-active' : '')
                                            }
                                            onClick={() => openMessage(msg)}
                                        >
                                            <td style={{ paddingLeft: 14 }} onClick={e => e.stopPropagation()}>
                                                <input type="checkbox" style={{ width: 12, height: 12 }} />
                                            </td>
                                            <td>
                                                <div className="msg-sender-cell">
                                                    <div className={isUnread ? 'msg-unread-dot' : 'msg-read-dot'} />
                                                    <div className="msg-av" style={{ background: bg, color: fg }}>
                                                        {getInitials(msg.nama)}
                                                    </div>
                                                    <div>
                                                        <div className={'msg-sender-name' + (isUnread ? ' bold' : '')}>
                                                            {msg.nama}
                                                        </div>
                                                        <div className="msg-sender-email">{msg.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {msg.perusahaan
                                                    ? <div className="msg-company-pill">
                                                        <svg width="9" height="9" viewBox="0 0 16 16" fill="currentColor">
                                                            <path d="M2 14V4l6-3 6 3v10H2zm5-1h2v-3H7v3zm-3-2h2v-2H4v2zm6 0h2v-2h-2v2z"/>
                                                        </svg>
                                                        {msg.perusahaan}
                                                    </div>
                                                    : <span style={{ fontSize: 11, color: '#9CA3AF' }}>—</span>
                                                }
                                            </td>
                                            <td>
                                                <div
                                                    className="msg-preview-text"
                                                    style={{ fontWeight: isUnread ? 500 : 400, color: isUnread ? '#111827' : '#6B7280' }}
                                                >
                                                    {msg.pesan}
                                                </div>
                                            </td>
                                            <td>
                                                <div className={'msg-time' + (isUnread ? ' bold' : '')}>
                                                    {formatTime(msg.createdAt)}
                                                </div>
                                                <div style={{ fontSize: 10, color: '#9CA3AF' }}>
                                                    {formatTimeLabel(msg.createdAt)}
                                                </div>
                                            </td>
                                            <td>
                                                <div className={'msg-status ' + (isUnread ? 'msg-st-baru' : 'msg-st-dibaca')}>
                                                    <div className="msg-st-dot" />
                                                    {isUnread ? 'Baru' : 'Dibaca'}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer / Pagination */}
                    <div className="si-card-ftr">
                        <div className="si-ftr-info">
                            Menampilkan <strong>{filteredMessages.length}</strong> dari <strong>{totalRows}</strong> pesan
                        </div>
                        <div className="ds-pg-nav">
                            <button className="ds-pg-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹</button>
                            {Array.from({ length: Math.min(totalPage, 6) }, (_, i) => (
                                <button
                                    key={i}
                                    className={'ds-pg-btn' + (page === i ? ' cur' : '')}
                                    onClick={() => setPage(i)}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            {totalPage > 6 && <button className="ds-pg-btn" style={{ cursor: 'default', pointerEvents: 'none' }}>…</button>}
                            <button className="ds-pg-btn" disabled={page >= totalPage - 1} onClick={() => setPage(p => p + 1)}>›</button>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Read Panel */}
                <div className="msg-read-panel">
                    {selected ? (
                        <>
                            {/* Message Viewer */}
                            <div className="ds-card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div className="msg-rp-header">
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                                        <div className="msg-rp-subject">
                                            {selected.pesan?.slice(0, 70)}{(selected.pesan?.length || 0) > 70 ? '…' : ''}
                                        </div>
                                        <div className={'msg-status ' + (selected.is_read ? 'msg-st-dibaca' : 'msg-st-baru')} style={{ flexShrink: 0 }}>
                                            <div className="msg-st-dot" />
                                            {selected.is_read ? 'Dibaca' : 'Baru'}
                                        </div>
                                    </div>
                                    <div className="msg-rp-meta">
                                        {(() => {
                                            const { bg, fg } = getAvColor(selected.nama);
                                            return (
                                                <div className="msg-rp-av" style={{ background: bg, color: fg }}>
                                                    {getInitials(selected.nama)}
                                                </div>
                                            );
                                        })()}
                                        <div>
                                            <div className="msg-rp-sender-name">{selected.nama}</div>
                                            <div className="msg-rp-sender-email">{selected.email}</div>
                                        </div>
                                        <div className="msg-rp-time">{formatFull(selected.createdAt)}</div>
                                    </div>
                                    {selected.perusahaan && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                                            <div className="msg-company-pill">
                                                <svg width="9" height="9" viewBox="0 0 16 16" fill="currentColor">
                                                    <path d="M2 14V4l6-3 6 3v10H2zm5-1h2v-3H7v3zm-3-2h2v-2H4v2zm6 0h2v-2h-2v2z"/>
                                                </svg>
                                                {selected.perusahaan}
                                            </div>
                                            <div style={{ fontSize: 10, color: '#6B7280' }}>Kepada: admin</div>
                                        </div>
                                    )}
                                </div>
                                <div className="msg-rp-body">{selected.pesan}</div>
                                <div className="msg-rp-footer">
                                    <button
                                        className="ds-btn-pri"
                                        style={{ fontSize: 11 }}
                                        onClick={() => document.getElementById('msg-reply-area')?.focus()}
                                    >
                                        <svg viewBox="0 0 16 16" fill="white" width="12" height="12">
                                            <path d="M2 15V3l14 6-14 6z"/>
                                        </svg>
                                        Balas
                                    </button>
                                    <button className="ds-btn-sm" style={{ fontSize: 11 }}>
                                        <svg viewBox="0 0 16 16" fill="currentColor" width="11" height="11">
                                            <path d="M8 2l1.5 4h4l-3.5 2.5 1.3 4L8 10l-3.3 2.5 1.3-4L2.5 6h4z"/>
                                        </svg>
                                        Tandai Penting
                                    </button>
                                    <button
                                        className="ds-btn-sm danger"
                                        style={{ fontSize: 11, marginLeft: 'auto' }}
                                        onClick={() => setDeleteTarget(selected)}
                                    >
                                        <svg viewBox="0 0 16 16" fill="currentColor" width="11" height="11">
                                            <path d="M3 4h10l-1 10H4L3 4zm3-3h4v2H6V1zm-4 3h12"/>
                                        </svg>
                                        Hapus
                                    </button>
                                </div>
                            </div>

                            {/* Reply Box */}
                            <div className="ds-card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div className="msg-rb-header">
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="#0F6E56">
                                        <path d="M2 15V3l14 6-14 6z"/>
                                    </svg>
                                    <span className="msg-rb-title">Balas Pesan</span>
                                    <span className="msg-rb-to">Kepada: {selected.email}</span>
                                </div>
                                <textarea
                                    id="msg-reply-area"
                                    className="msg-rb-textarea"
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    placeholder="Tulis balasan Anda di sini…"
                                />
                                <div className="msg-rb-footer">
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <div className="msg-rb-tool" title="Lampiran">
                                            <svg viewBox="0 0 16 16" width="11" height="11" fill="#6B7280">
                                                <path d="M3 8V4a5 5 0 0110 0v8a3 3 0 01-6 0V4.5a1 1 0 012 0V11h1V4.5a2 2 0 00-4 0V12a4 4 0 008 0V4a6 6 0 00-12 0v4H3z"/>
                                            </svg>
                                        </div>
                                        <div className="msg-rb-tool" title="Format teks">
                                            <svg viewBox="0 0 16 16" width="11" height="11" fill="#6B7280">
                                                <path d="M3 3h10v2H3zm0 4h7v2H3zm0 4h10v2H3z"/>
                                            </svg>
                                        </div>
                                        <div className="msg-rb-tool" title="Template">
                                            <svg viewBox="0 0 16 16" width="11" height="11" fill="#6B7280">
                                                <path d="M2 2h12v12H2V2zm1 1v10h10V3H3zm2 2h6v1H5zm0 2h6v1H5zm0 2h4v1H5z"/>
                                            </svg>
                                        </div>
                                    </div>
                                    <a
                                        className="ds-btn-pri"
                                        style={{ fontSize: 11, textDecoration: 'none' }}
                                        href={`mailto:${selected.email}?subject=Re: Pesan Anda&body=${encodeURIComponent(replyText)}`}
                                    >
                                        <svg viewBox="0 0 16 16" fill="white" width="12" height="12">
                                            <path d="M2 15V3l14 6-14 6z"/>
                                        </svg>
                                        Kirim Balasan
                                    </a>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="msg-empty-panel">
                            <div className="msg-empty-icon">
                                <svg viewBox="0 0 48 48" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round">
                                    <path d="M6 10h36a2 2 0 012 2v22a2 2 0 01-2 2l-8-5H6a2 2 0 01-2-2V12a2 2 0 012-2z"/>
                                    <path d="M14 20h20M14 27h12"/>
                                </svg>
                            </div>
                            <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>Pilih pesan untuk membacanya</div>
                            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Klik baris pesan di sebelah kiri</div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Delete Confirm Modal ── */}
            {deleteTarget && (
                <div className="um-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
                    <div className="um-modal" style={{ width: 420 }}>
                        <div className="um-modal-hdr">
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Hapus Pesan</div>
                            <button className="um-close-btn" onClick={() => setDeleteTarget(null)}>✕</button>
                        </div>
                        <div className="um-modal-body">
                            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                                Hapus pesan dari <strong>{deleteTarget.nama}</strong>? Tindakan ini tidak bisa dibatalkan.
                            </div>
                        </div>
                        <div className="um-modal-ftr">
                            <button
                                style={{ fontSize: 12, color: '#6B7280', background: 'transparent', border: '0.5px solid #E5E7EB', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontFamily: 'inherit' }}
                                onClick={() => setDeleteTarget(null)}
                            >
                                Batal
                            </button>
                            <button className="um-btn-danger" onClick={handleDelete}>Ya, Hapus</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Messages;
