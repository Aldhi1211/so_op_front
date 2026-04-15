import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import API_BASE_URL from '../config/config';

const DEPT_COLORS = {
    Direksi:     { bg: '#EFF6FF', text: '#1D4ED8', border: '#93C5FD', av: '#DBEAFE', banner: '#1D4ED820' },
    Teknologi:   { bg: '#F5F3FF', text: '#7C3AED', border: '#C4B5FD', av: '#EDE9FE', banner: '#7C3AED20' },
    Marketing:   { bg: '#FDF2F8', text: '#DB2777', border: '#F9A8D4', av: '#FCE7F3', banner: '#DB277720' },
    Keuangan:    { bg: '#F0FDF4', text: '#065F46', border: '#6EE7B7', av: '#D1FAE5', banner: '#065F4620' },
    HR:          { bg: '#FFFBEB', text: '#92400E', border: '#FCD34D', av: '#FEF3C7', banner: '#92400E20' },
    Operasional: { bg: '#F9FAFB', text: '#374151', border: '#D1D5DB', av: '#F3F4F6', banner: '#37415120' },
};
const DEFAULT_DEPT = { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', av: '#E2E8F0', banner: '#47556920' };

const getInitials = (name = '') =>
    name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const getDept = (jabatan = '') => {
    const j = jabatan.toLowerCase();
    if (j.includes('ceo') || j.includes('cto') || j.includes('cfo') || j.includes('direktur')) return 'Direksi';
    if (j.includes('tech') || j.includes('dev') || j.includes('engineer') || j.includes('it') || j.includes('ui') || j.includes('ux')) return 'Teknologi';
    if (j.includes('market') || j.includes('brand')) return 'Marketing';
    if (j.includes('finance') || j.includes('keuangan') || j.includes('akuntan')) return 'Keuangan';
    if (j.includes('hr') || j.includes('sdm') || j.includes('rekrut') || j.includes('human')) return 'HR';
    if (j.includes('oper') || j.includes('logistik') || j.includes('gudang')) return 'Operasional';
    return null;
};

const S = {
    page: { padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '18px' },
    header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
    title: { fontSize: 20, fontWeight: 700, color: '#111827' },
    sub: { fontSize: 13, color: '#6B7280', marginTop: 3 },
    scGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12 },
    sc: { background: '#fff', border: '1px solid #E8E8E5', borderRadius: 12, padding: '12px 16px' },
    scL: { fontSize: 11, color: '#6B7280', marginBottom: 4 },
    scV: { fontSize: 22, fontWeight: 700, color: '#111827' },
    scS: { fontSize: 11, color: '#6B7280', marginTop: 2 },
    toolbar: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    chip: (on) => ({
        fontSize: 11, padding: '5px 13px', borderRadius: 20,
        background: on ? '#E1F5EE' : '#F4F5F7', color: on ? '#0F6E56' : '#6B7280',
        border: `1px solid ${on ? '#9FE1CB' : '#E5E7EB'}`,
        cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', transition: 'all .15s',
    }),
    teamGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 },
    card: { background: '#fff', border: '1px solid #E8E8E5', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'border-color .15s, box-shadow .15s' },
    // detail modal
    backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 50, paddingBottom: 40, overflowY: 'auto' },
    detailBox: { background: '#fff', borderRadius: 14, width: 560, maxWidth: '96vw', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' },
    // add modal
    addModal: { background: '#fff', borderRadius: 14, width: 560, maxWidth: '96vw', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' },
    mhdr: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E8E8E5' },
    mbody: { padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 },
    mftr: { display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '14px 20px', borderTop: '1px solid #E8E8E5' },
    fgrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    fld: { display: 'flex', flexDirection: 'column', gap: 4 },
    flabel: { fontSize: 11, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' },
    finput: { fontSize: 13, padding: '8px 11px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#F9FAFB', color: '#111827', fontFamily: 'inherit', outline: 'none' },
};

const Teams = () => {
    const [teams, setTeams] = useState([]);
    const [name, setName] = useState('');
    const [token, setToken] = useState('');
    const [expire, setExpire] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || '');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(0);
    const [limit] = useState(9);
    const [pages, setPages] = useState(0);
    const [rows, setRows] = useState(0);
    const [keyword, setKeyword] = useState('');
    const [filterDept, setFilterDept] = useState('Semua');

    // Member detail panel
    const [member, setMember] = useState(null);

    // Add member modal
    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', jabatan: '', fb: '', linkedin: '', instagram: '', description: '' });
    const [addFoto, setAddFoto] = useState(null);
    const [addFotoPreview, setAddFotoPreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const fotoRef = useRef(null);

    // Edit member modal
    const [showEdit, setShowEdit] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', jabatan: '', fb: '', linkedin: '', instagram: '', description: '' });
    const [editFoto, setEditFoto] = useState(null);
    const [editFotoPreview, setEditFotoPreview] = useState(null);
    const [editOrigFoto, setEditOrigFoto] = useState(null);
    const editFotoRef = useRef(null);

    const refreshToken = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/token`);
            setToken(res.data.accessToken);
            const decoded = jwtDecode(res.data.accessToken);
            setName(decoded.name);
            setExpire(decoded.exp);
        } catch {
            navigate('/login');
        }
    }, [navigate]);

    useEffect(() => {
        refreshToken();
        if (successMessage) {
            const t = setTimeout(() => setSuccessMessage(''), 3000);
            navigate(location.pathname, { replace: true, state: {} });
            return () => clearTimeout(t);
        }
    }, []);

    const axiosJWT = axios.create();
    axiosJWT.interceptors.request.use(async (config) => {
        const now = new Date();
        if (expire * 1000 < now.getTime()) {
            const res = await axios.get(`${API_BASE_URL}/token`);
            config.headers.Authorization = `Bearer ${res.data.accessToken}`;
            setToken(res.data.accessToken);
            const decoded = jwtDecode(res.data.accessToken);
            setName(decoded.name);
            setExpire(decoded.exp);
        }
        return config;
    }, (err) => Promise.reject(err));

    const getTeams = useCallback(async () => {
        try {
            const res = await axiosJWT.get(`${API_BASE_URL}/teams?search_query=${keyword}&page=${page}&limit=${limit}`);
            setTeams(res.data.response || []);
            setPage(res.data.page ?? 0);
            setPages(res.data.totalPage ?? 0);
            setRows(res.data.totalRows ?? 0);
        } catch { /* handled by interceptor */ }
    }, [page, keyword, limit]);

    useEffect(() => {
        if (token) getTeams();
    }, [page, keyword, token]);

    useEffect(() => { setPage(0); }, [keyword]);

    const deleteTeam = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Hapus anggota tim ini?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/teams/${id}`);
            getTeams();
        } catch (err) { console.error(err); }
    };

    const filteredTeams = filterDept === 'Semua'
        ? teams
        : teams.filter(t => getDept(t.jabatan) === filterDept || t.dept === filterDept);

    const openAdd = () => {
        setAddForm({ name: '', jabatan: '', fb: '', linkedin: '', instagram: '', description: '' });
        setAddFoto(null); setAddFotoPreview(null);
        setShowAdd(true);
    };
    const closeAdd = () => setShowAdd(false);

    const openEdit = (team) => {
        setEditId(team.id);
        setEditForm({ name: team.name || '', jabatan: team.jabatan || '', fb: team.fb || '', linkedin: team.linkedin || '', instagram: team.instagram || '', description: team.description || '' });
        setEditFoto(null);
        setEditFotoPreview(team.foto || null);
        setEditOrigFoto(team.foto || null);
        setShowEdit(true);
    };
    const closeEdit = () => setShowEdit(false);

    const handleEditChange = (e) => setEditForm(f => ({ ...f, [e.target.name]: e.target.value }));
    const handleEditFoto = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setEditFoto(file);
        setEditFotoPreview(URL.createObjectURL(file));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editForm.name || !editForm.jabatan) return;
        setSaving(true);
        try {
            const data = new FormData();
            Object.entries(editForm).forEach(([k, v]) => data.append(k, v));
            if (editFoto) data.append('foto', editFoto);
            else data.append('foto', editOrigFoto || '');
            await axios.patch(`${API_BASE_URL}/teams/${editId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
            setShowEdit(false);
            getTeams();
            setSuccessMessage('Anggota tim berhasil diperbarui!');
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal memperbarui anggota.');
        } finally {
            setSaving(false);
        }
    };

    const handleAddChange = (e) => setAddForm(f => ({ ...f, [e.target.name]: e.target.value }));
    const handleAddFoto = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setAddFoto(file);
        setAddFotoPreview(URL.createObjectURL(file));
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!addForm.name || !addForm.jabatan) return;
        setSaving(true);
        try {
            const data = new FormData();
            Object.entries(addForm).forEach(([k, v]) => data.append(k, v));
            if (addFoto) data.append('foto', addFoto);
            await axios.post(`${API_BASE_URL}/teams`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
            setShowAdd(false);
            getTeams();
            setSuccessMessage('Anggota tim berhasil ditambahkan!');
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menyimpan anggota.');
        } finally {
            setSaving(false);
        }
    };

    const DEPTS = ['Semua', 'Direksi', 'Teknologi', 'Marketing', 'Keuangan', 'HR', 'Operasional'];

    return (
        <div style={S.page}>
            {successMessage && <div className="ds-success">{successMessage}</div>}

            {/* Page Header */}
            <div style={S.header}>
                <div>
                    <div style={S.title}>Tim Kami</div>
                    <div style={S.sub}>Kenali orang-orang hebat di balik perusahaan</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="ds-btn-sec" style={{ fontSize: 12 }}>
                        <svg viewBox="0 0 16 16" fill="currentColor" width={13} height={13}><path d="M2 4h12M4 8h8M6 12h4" /></svg>
                        Filter
                    </button>
                    <button className="ds-btn-pri" onClick={openAdd}>
                        <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" width={13} height={13}><path d="M8 2v12M2 8h12" /></svg>
                        Tambah Anggota
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div style={S.scGrid}>
                <div style={S.sc}><div style={S.scL}>Total Anggota</div><div style={S.scV}>{rows}</div><div style={S.scS}>karyawan aktif</div></div>
                <div style={S.sc}><div style={S.scL}>Ditampilkan</div><div style={S.scV}>{filteredTeams.length}</div><div style={S.scS}>di halaman ini</div></div>
                <div style={S.sc}><div style={S.scL}>Halaman</div><div style={S.scV}>{rows ? page + 1 : 0}</div><div style={S.scS}>dari {pages}</div></div>
                <div style={S.sc}><div style={S.scL}>Filter Aktif</div><div style={{ ...S.scV, fontSize: 14 }}>{filterDept}</div><div style={S.scS}>departemen</div></div>
            </div>

            {/* Toolbar */}
            <div style={S.toolbar}>
                {DEPTS.map(d => (
                    <button key={d} style={S.chip(filterDept === d)} onClick={() => setFilterDept(d)}>{d}</button>
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <form onSubmit={(e) => { e.preventDefault(); setPage(0); setKeyword(query); }}>
                        <div className="ds-search-form" style={{ width: 190 }}>
                            <svg viewBox="0 0 16 16" fill="none" stroke="#9CA3AF" strokeWidth="1.5" width={13} height={13}>
                                <circle cx="6.5" cy="6.5" r="4" /><path d="M11 11l3 3" />
                            </svg>
                            <input placeholder="Cari anggota…" value={query} onChange={(e) => setQuery(e.target.value)} />
                            <button type="submit" />
                        </div>
                    </form>
                </div>
            </div>

            {/* Team Grid */}
            {filteredTeams.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7280', fontSize: 13 }}>
                    <svg width={40} height={40} viewBox="0 0 16 16" fill="#D1D5DB" style={{ display: 'block', margin: '0 auto 10px' }}>
                        <path d="M5 4a3 3 0 100 6 3 3 0 000-6zm6 1a2 2 0 100 4 2 2 0 000-4zM2 12c0-2 1.5-3 3-3h1c.5 0 1 .1 1.5.3A4 4 0 005 13H2v-1zm7 0c0-1.2.6-2.2 1.5-2.8.3-.1.7-.2 1-.2h.5c1.5 0 3 1 3 3v1h-6v-1z" />
                    </svg>
                    Belum ada anggota tim
                </div>
            ) : (
                <div style={S.teamGrid}>
                    {filteredTeams.map((team) => {
                        const dept = getDept(team.jabatan) || 'Operasional';
                        const dc = DEPT_COLORS[dept] || DEFAULT_DEPT;
                        const initials = getInitials(team.name);
                        return (
                            <div
                                key={team.id}
                                style={S.card}
                                onClick={() => setMember(team)}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#9FE1CB'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,110,86,.1)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8E8E5'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                {/* Banner */}
                                <div style={{ height: 64, background: dc.banner }} />
                                {/* Avatar */}
                                <div style={{ marginTop: -28, display: 'flex', justifyContent: 'center' }}>
                                    <div style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid #fff', background: dc.av, color: dc.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, overflow: 'hidden' }}>
                                        {team.foto
                                            ? <img src={team.foto} alt={team.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : initials}
                                    </div>
                                </div>
                                {/* Body */}
                                <div style={{ padding: '10px 14px 14px', textAlign: 'center' }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{team.name}</div>
                                    <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 8 }}>{team.jabatan}</div>
                                    <div style={{ display: 'inline-block', fontSize: 10, padding: '2px 9px', borderRadius: 20, background: dc.bg, color: dc.text, border: `1px solid ${dc.border}`, marginBottom: 10 }}>{dept}</div>

                                    {/* Social & Actions */}
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 10 }}>
                                        {team.linkedin && (
                                            <a href={team.linkedin} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                                                style={{ width: 26, height: 26, border: '1px solid #E5E7EB', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                                                <svg width={11} height={11} viewBox="0 0 16 16" fill="#6B7280"><path d="M3 5h2v8H3zm1-3a1.25 1.25 0 110 2.5A1.25 1.25 0 014 2zm3 3h2v1.1c.4-.7 1.2-1.2 2.2-1.2C13 5 13.5 6 13.5 7.5V13h-2V8c0-.8-.3-1.3-1-1.3s-1.2.5-1.2 1.3v5H7V5z" /></svg>
                                            </a>
                                        )}
                                        {team.instagram && (
                                            <a href={`https://instagram.com/${team.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                                                style={{ width: 26, height: 26, border: '1px solid #E5E7EB', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                                                <svg width={11} height={11} viewBox="0 0 16 16" fill="#6B7280"><rect x="2" y="2" width="12" height="12" rx="3" stroke="#6B7280" strokeWidth="1.2" fill="none" /><circle cx="8" cy="8" r="2.5" stroke="#6B7280" strokeWidth="1.2" fill="none" /><circle cx="11.2" cy="4.8" r="0.7" fill="#6B7280" /></svg>
                                            </a>
                                        )}
                                        {team.fb && (
                                            <a href={team.fb} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                                                style={{ width: 26, height: 26, border: '1px solid #E5E7EB', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                                                <svg width={11} height={11} viewBox="0 0 16 16" fill="#6B7280"><path d="M9 6V4.5C9 4 9.3 3.5 10 3.5h1V1.5h-2C7 1.5 6 2.8 6 4.5V6H4v2h2v6h3V8h2l.5-2H9z" /></svg>
                                            </a>
                                        )}
                                    </div>

                                    <div style={{ borderTop: '1px solid #F4F5F7', paddingTop: 10, display: 'flex', justifyContent: 'center', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                                        <button className="ds-btn-sm primary" style={{ fontSize: 10 }} onClick={(e) => { e.stopPropagation(); openEdit(team); }}>Edit</button>
                                        <button className="ds-btn-sm danger" style={{ fontSize: 10 }} onClick={(e) => deleteTeam(team.id, e)}>Hapus</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            <div className="ds-pagination">
                <div className="ds-pg-info">Total: {rows} anggota · Halaman {rows ? page + 1 : 0} dari {pages}</div>
                <div className="ds-pg-nav">
                    <button className="ds-pg-btn" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page <= 0}>‹</button>
                    {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                        const p = Math.max(0, Math.min(page - 2, pages - 5)) + i;
                        return <button key={p} className={`ds-pg-btn${p === page ? ' cur' : ''}`} onClick={() => setPage(p)}>{p + 1}</button>;
                    })}
                    <button className="ds-pg-btn" onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1}>›</button>
                </div>
            </div>

            {/* ── MEMBER DETAIL MODAL ── */}
            {member && (() => {
                const dept = getDept(member.jabatan) || 'Operasional';
                const dc = DEPT_COLORS[dept] || DEFAULT_DEPT;
                const initials = getInitials(member.name);
                return (
                    <div style={S.backdrop} onClick={() => setMember(null)}>
                        <div style={S.detailBox} onClick={(e) => e.stopPropagation()}>
                            {/* Banner */}
                            <div style={{ height: 90, background: dc.banner, borderRadius: '14px 14px 0 0', position: 'relative' }}>
                                <div style={{ position: 'absolute', bottom: -28, left: 20 }}>
                                    <div style={{ width: 56, height: 56, borderRadius: '50%', border: '3px solid #fff', background: dc.av, color: dc.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, overflow: 'hidden' }}>
                                        {member.foto
                                            ? <img src={member.foto} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : initials}
                                    </div>
                                </div>
                                <button onClick={() => setMember(null)} style={{ position: 'absolute', top: 10, right: 10, width: 26, height: 26, background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#374151', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                            </div>

                            {/* Body */}
                            <div style={{ padding: '40px 20px 16px' }}>
                                <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{member.name}</div>
                                <div style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 10px' }}>{member.jabatan}</div>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                                    <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, background: dc.bg, color: dc.text, border: `1px solid ${dc.border}` }}>{dept}</span>
                                    <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, background: '#F4F5F7', color: '#6B7280', border: '1px solid #E5E7EB' }}>Aktif</span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                                    {[
                                        ['LinkedIn', member.linkedin],
                                        ['Instagram', member.instagram],
                                        ['Facebook', member.fb],
                                        ['Jabatan', member.jabatan],
                                    ].map(([label, val]) => val ? (
                                        <div key={label} style={{ background: '#F9FAFB', borderRadius: 8, padding: '10px 12px', border: '1px solid #E8E8E5' }}>
                                            <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 2 }}>{label}</div>
                                            <div style={{ fontSize: 12, color: '#111827' }}>{val}</div>
                                        </div>
                                    ) : null)}
                                </div>

                                {member.description && (
                                    <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6, marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #E8E8E5' }}>
                                        {member.description}
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                    <button className="ds-btn-sec" onClick={() => setMember(null)}>Tutup</button>
                                    <button className="ds-btn-sec" onClick={() => { setMember(null); openEdit(member); }}>
                                        <svg width={13} height={13} viewBox="0 0 16 16" fill="currentColor"><path d="M11 2l3 3-9 9H2v-3l9-9z" /></svg>
                                        Edit Profil
                                    </button>
                                    <button className="ds-btn-pri">
                                        <svg width={13} height={13} viewBox="0 0 16 16" fill="white"><path d="M8 1a3 3 0 100 6 3 3 0 000-6zM3 13c0-2.5 2-4 5-4s5 1.5 5 4v1H3v-1z" /></svg>
                                        Profil Penuh
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ── EDIT MEMBER MODAL ── */}
            {showEdit && (
                <div style={S.backdrop} onClick={closeEdit}>
                    <div style={S.addModal} onClick={(e) => e.stopPropagation()}>
                        <div style={S.mhdr}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 32, height: 32, background: '#E1F5EE', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg width={15} height={15} viewBox="0 0 16 16" fill="#0F6E56"><path d="M8 1a3 3 0 100 6 3 3 0 000-6zM3 13c0-2.5 2-4 5-4s5 1.5 5 4v1H3v-1z" /></svg>
                                </div>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Edit Anggota Tim</div>
                                    <div style={{ fontSize: 11, color: '#6B7280' }}>Perbarui informasi anggota</div>
                                </div>
                            </div>
                            <button style={{ width: 28, height: 28, border: '1px solid #E5E7EB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fff', fontSize: 14, color: '#6B7280' }} onClick={closeEdit}>×</button>
                        </div>

                        <form onSubmit={handleEditSubmit}>
                            <div style={S.mbody}>
                                {/* Photo upload */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottom: '1px solid #E8E8E5' }}>
                                    <div
                                        style={{ width: 52, height: 52, borderRadius: '50%', background: editFotoPreview ? 'transparent' : '#F4F5F7', border: '1.5px dashed #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}
                                        onClick={() => editFotoRef.current?.click()}
                                    >
                                        {editFotoPreview
                                            ? <img src={editFotoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <svg width={18} height={18} viewBox="0 0 16 16" fill="#9CA3AF"><path d="M8 1a3 3 0 100 6 3 3 0 000-6zM3 13c0-2.5 2-4 5-4s5 1.5 5 4v1H3v-1z" /></svg>}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#6B7280' }}>
                                        Klik untuk ganti foto profil<br />
                                        <span style={{ fontSize: 10 }}>JPG, PNG · maks. 2MB</span>
                                    </div>
                                    <input ref={editFotoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleEditFoto} />
                                </div>

                                <div style={S.fgrid}>
                                    <div style={S.fld}>
                                        <label style={S.flabel}>Nama Lengkap *</label>
                                        <input style={S.finput} name="name" value={editForm.name} onChange={handleEditChange} required placeholder="cth. Siti Rahayu"
                                            onFocus={(e) => { e.target.style.borderColor = '#0F6E56'; e.target.style.background = '#fff'; }}
                                            onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }} />
                                    </div>
                                    <div style={S.fld}>
                                        <label style={S.flabel}>Jabatan *</label>
                                        <input style={S.finput} name="jabatan" value={editForm.jabatan} onChange={handleEditChange} required placeholder="cth. Frontend Developer"
                                            onFocus={(e) => { e.target.style.borderColor = '#0F6E56'; e.target.style.background = '#fff'; }}
                                            onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }} />
                                    </div>
                                    <div style={S.fld}>
                                        <label style={S.flabel}>Facebook</label>
                                        <input style={S.finput} name="fb" value={editForm.fb} onChange={handleEditChange} placeholder="URL Facebook"
                                            onFocus={(e) => { e.target.style.borderColor = '#0F6E56'; e.target.style.background = '#fff'; }}
                                            onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }} />
                                    </div>
                                    <div style={S.fld}>
                                        <label style={S.flabel}>LinkedIn</label>
                                        <input style={S.finput} name="linkedin" value={editForm.linkedin} onChange={handleEditChange} placeholder="URL LinkedIn"
                                            onFocus={(e) => { e.target.style.borderColor = '#0F6E56'; e.target.style.background = '#fff'; }}
                                            onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }} />
                                    </div>
                                    <div style={S.fld}>
                                        <label style={S.flabel}>Instagram</label>
                                        <input style={S.finput} name="instagram" value={editForm.instagram} onChange={handleEditChange} placeholder="@username"
                                            onFocus={(e) => { e.target.style.borderColor = '#0F6E56'; e.target.style.background = '#fff'; }}
                                            onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }} />
                                    </div>
                                </div>

                                <div style={S.fld}>
                                    <label style={S.flabel}>Bio / Deskripsi</label>
                                    <textarea
                                        style={{ ...S.finput, minHeight: 64, resize: 'vertical', lineHeight: 1.5 }}
                                        name="description" value={editForm.description} onChange={handleEditChange}
                                        placeholder="Tuliskan deskripsi singkat anggota…"
                                        onFocus={(e) => { e.target.style.borderColor = '#0F6E56'; e.target.style.background = '#fff'; }}
                                        onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }}
                                    />
                                </div>
                            </div>

                            <div style={S.mftr}>
                                <button type="button" className="ds-btn-sec" onClick={closeEdit} disabled={saving}>Batal</button>
                                <button type="submit" className="ds-btn-pri" disabled={saving || !editForm.name || !editForm.jabatan}>
                                    {saving ? 'Menyimpan…' : (
                                        <>
                                            <svg width={12} height={12} viewBox="0 0 16 16" fill="white"><path d="M2 8l4 4 8-8" /></svg>
                                            Simpan Perubahan
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── ADD MEMBER MODAL ── */}
            {showAdd && (
                <div style={S.backdrop} onClick={closeAdd}>
                    <div style={S.addModal} onClick={(e) => e.stopPropagation()}>
                        <div style={S.mhdr}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 32, height: 32, background: '#E1F5EE', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg width={15} height={15} viewBox="0 0 16 16" fill="#0F6E56"><path d="M8 1a3 3 0 100 6 3 3 0 000-6zM3 13c0-2.5 2-4 5-4s5 1.5 5 4v1H3v-1z" /></svg>
                                </div>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Tambah Anggota Tim</div>
                                    <div style={{ fontSize: 11, color: '#6B7280' }}>Isi informasi anggota baru</div>
                                </div>
                            </div>
                            <button style={{ width: 28, height: 28, border: '1px solid #E5E7EB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fff', fontSize: 14, color: '#6B7280' }} onClick={closeAdd}>×</button>
                        </div>

                        <form onSubmit={handleAddSubmit}>
                            <div style={S.mbody}>
                                {/* Photo upload */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottom: '1px solid #E8E8E5' }}>
                                    <div
                                        style={{ width: 52, height: 52, borderRadius: '50%', background: addFotoPreview ? 'transparent' : '#F4F5F7', border: '1.5px dashed #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}
                                        onClick={() => fotoRef.current?.click()}
                                    >
                                        {addFotoPreview
                                            ? <img src={addFotoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <svg width={18} height={18} viewBox="0 0 16 16" fill="#9CA3AF"><path d="M8 1a3 3 0 100 6 3 3 0 000-6zM3 13c0-2.5 2-4 5-4s5 1.5 5 4v1H3v-1z" /></svg>}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#6B7280' }}>
                                        Klik untuk upload foto profil<br />
                                        <span style={{ fontSize: 10 }}>JPG, PNG · maks. 2MB</span>
                                    </div>
                                    <input ref={fotoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAddFoto} />
                                </div>

                                <div style={S.fgrid}>
                                    <div style={S.fld}>
                                        <label style={S.flabel}>Nama Lengkap *</label>
                                        <input style={S.finput} name="name" value={addForm.name} onChange={handleAddChange} required placeholder="cth. Siti Rahayu"
                                            onFocus={(e) => { e.target.style.borderColor = '#0F6E56'; e.target.style.background = '#fff'; }}
                                            onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }} />
                                    </div>
                                    <div style={S.fld}>
                                        <label style={S.flabel}>Jabatan *</label>
                                        <input style={S.finput} name="jabatan" value={addForm.jabatan} onChange={handleAddChange} required placeholder="cth. Frontend Developer"
                                            onFocus={(e) => { e.target.style.borderColor = '#0F6E56'; e.target.style.background = '#fff'; }}
                                            onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }} />
                                    </div>
                                    <div style={S.fld}>
                                        <label style={S.flabel}>Facebook</label>
                                        <input style={S.finput} name="fb" value={addForm.fb} onChange={handleAddChange} placeholder="URL Facebook"
                                            onFocus={(e) => { e.target.style.borderColor = '#0F6E56'; e.target.style.background = '#fff'; }}
                                            onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }} />
                                    </div>
                                    <div style={S.fld}>
                                        <label style={S.flabel}>LinkedIn</label>
                                        <input style={S.finput} name="linkedin" value={addForm.linkedin} onChange={handleAddChange} placeholder="URL LinkedIn"
                                            onFocus={(e) => { e.target.style.borderColor = '#0F6E56'; e.target.style.background = '#fff'; }}
                                            onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }} />
                                    </div>
                                    <div style={S.fld}>
                                        <label style={S.flabel}>Instagram</label>
                                        <input style={S.finput} name="instagram" value={addForm.instagram} onChange={handleAddChange} placeholder="@username"
                                            onFocus={(e) => { e.target.style.borderColor = '#0F6E56'; e.target.style.background = '#fff'; }}
                                            onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }} />
                                    </div>
                                </div>

                                <div style={S.fld}>
                                    <label style={S.flabel}>Bio / Deskripsi</label>
                                    <textarea
                                        style={{ ...S.finput, minHeight: 64, resize: 'vertical', lineHeight: 1.5 }}
                                        name="description" value={addForm.description} onChange={handleAddChange}
                                        placeholder="Tuliskan deskripsi singkat anggota…"
                                        onFocus={(e) => { e.target.style.borderColor = '#0F6E56'; e.target.style.background = '#fff'; }}
                                        onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }}
                                    />
                                </div>
                            </div>

                            <div style={S.mftr}>
                                <button type="button" className="ds-btn-sec" onClick={closeAdd} disabled={saving}>Batal</button>
                                <button type="submit" className="ds-btn-pri" disabled={saving || !addForm.name || !addForm.jabatan}>
                                    {saving ? 'Menyimpan…' : (
                                        <>
                                            <svg width={12} height={12} viewBox="0 0 16 16" fill="white"><path d="M2 8l4 4 8-8" /></svg>
                                            Simpan Anggota
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Teams;
