import React, { useState, useEffect } from 'react';
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import './Dashboard.css';
import API_BASE_URL from '../config/config';

/* ── Helpers ── */
const AV_COLORS = [
    { bg: '#BFDBFE', fg: '#1D4ED8' },
    { bg: '#DDD6FE', fg: '#3C3489' },
    { bg: '#FBCFE8', fg: '#DB2777' },
    { bg: '#BAE6FD', fg: '#0369A1' },
    { bg: '#A7F3D0', fg: '#065F46' },
    { bg: '#FDE68A', fg: '#92400E' },
    { bg: '#E1F5EE', fg: '#0F6E56' },
    { bg: '#D1FAE5', fg: '#065F46' },
];

const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

const getAvColor = (name) => {
    if (!name) return AV_COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AV_COLORS[Math.abs(hash) % AV_COLORS.length];
};

const RoleBadge = ({ role }) => {
    const r = role || 'Guest';
    const styles = {
        'Admin':       { background: '#EEEDFE', color: '#3C3489' },
        'Super Admin': { background: '#EEEDFE', color: '#3C3489' },
        'Manager':     { background: '#E6F1FB', color: '#0C447C' },
        'Staff':       { background: '#E1F5EE', color: '#085041' },
        'Guest':       { background: '#F1EFE8', color: '#5F5E5A' },
    };
    const s = styles[r] || styles['Guest'];
    return <span className="si-badge" style={s}>{r}</span>;
};

/* ── Component ── */
const UserList = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [token, setToken] = useState('');
    const [expire, setExpire] = useState('');

    /* filters */
    const [filterRole, setFilterRole] = useState('Semua');
    const [query, setQuery] = useState('');

    /* modal */
    const [showModal, setShowModal] = useState(null); // null | 'add' | 'edit' | 'delete'
    const [selectedUser, setSelectedUser] = useState(null);

    /* form fields */
    const [fName, setFName] = useState('');
    const [fEmail, setFEmail] = useState('');
    const [fPassword, setFPassword] = useState('');
    const [fConfPassword, setFConfPassword] = useState('');
    const [fGender, setFGender] = useState('Male');
    const [fRole, setFRole] = useState('Guest');

    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    /* ── Auth ── */
    const refreshToken = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/token`);
            setToken(res.data.accessToken);
            const decoded = jwtDecode(res.data.accessToken);
            setExpire(decoded.exp);
        } catch {
            navigate('/login');
        }
    };

    useEffect(() => { refreshToken(); }, []);
    useEffect(() => { if (token) getUsers(); }, [token]);

    const axiosJWT = axios.create();
    axiosJWT.interceptors.request.use(async (config) => {
        if (expire * 1000 < new Date().getTime()) {
            const res = await axios.get(`${API_BASE_URL}/token`);
            config.headers.Authorization = `Bearer ${res.data.accessToken}`;
            setToken(res.data.accessToken);
            setExpire(jwtDecode(res.data.accessToken).exp);
        } else {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    }, (e) => Promise.reject(e));

    /* ── Data ── */
    const getUsers = async () => {
        const res = await axiosJWT.get(`${API_BASE_URL}/users`);
        setUsers(res.data || []);
    };

    /* ── Derived ── */
    const adminCount = users.filter(u => u.role === 'Admin' || u.role === 'Super Admin').length;
    const allRoles = ['Semua', ...Array.from(new Set(users.map(u => u.role).filter(Boolean)))];

    const filtered = users.filter(u => {
        const matchRole = filterRole === 'Semua' || u.role === filterRole;
        const q = query.toLowerCase();
        const matchQ = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
        return matchRole && matchQ;
    });

    /* ── Modal helpers ── */
    const openAdd = () => {
        setFName(''); setFEmail(''); setFPassword(''); setFConfPassword('');
        setFGender('Male'); setFRole('Guest'); setFormError('');
        setShowModal('add');
    };

    const openEdit = (user) => {
        setSelectedUser(user);
        setFName(user.name || ''); setFEmail(user.email || '');
        setFPassword(''); setFConfPassword('');
        setFGender(user.gender || 'Male'); setFRole(user.role || 'Guest');
        setFormError(''); setShowModal('edit');
    };

    const openDelete = (user) => { setSelectedUser(user); setFormError(''); setShowModal('delete'); };

    const closeModal = () => { setShowModal(null); setSelectedUser(null); setFormError(''); setFormLoading(false); };

    const flash = (msg) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    /* ── CRUD ── */
    const handleAdd = async () => {
        if (!fName || !fEmail || !fPassword || !fConfPassword) { setFormError('Semua field wajib diisi'); return; }
        if (fPassword !== fConfPassword) { setFormError('Password tidak cocok'); return; }
        setFormLoading(true); setFormError('');
        try {
            await axios.post(`${API_BASE_URL}/users`, {
                name: fName, email: fEmail, password: fPassword, confPassword: fConfPassword, gender: fGender
            });
            /* update role if not default Guest */
            if (fRole !== 'Guest') {
                const srRes = await axios.get(`${API_BASE_URL}/search?check_email=${encodeURIComponent(fEmail)}`);
                const newUser = srRes.data.response;
                if (newUser?.id) await axios.patch(`${API_BASE_URL}/users/${newUser.id}`, { role: fRole });
            }
            closeModal(); flash('User berhasil ditambahkan'); getUsers();
        } catch (err) {
            setFormError(err.response?.data?.msg || 'Gagal menambahkan user');
        }
        setFormLoading(false);
    };

    const handleEdit = async () => {
        if (!fName || !fEmail) { setFormError('Nama dan email wajib diisi'); return; }
        setFormLoading(true); setFormError('');
        try {
            await axiosJWT.patch(`${API_BASE_URL}/users/${selectedUser.id}`, {
                name: fName, email: fEmail, gender: fGender, role: fRole
            });
            closeModal(); flash('User berhasil diperbarui'); getUsers();
        } catch {
            setFormError('Gagal memperbarui user');
        }
        setFormLoading(false);
    };

    const handleDelete = async () => {
        setFormLoading(true);
        try {
            await axiosJWT.delete(`${API_BASE_URL}/users/${selectedUser.id}`);
            closeModal(); flash('User berhasil dihapus'); getUsers();
        } catch {
            setFormError('Gagal menghapus user');
        }
        setFormLoading(false);
    };

    /* ── Render ── */
    return (
        <>
            {/* Topbar */}
            <div className="ds-topbar">
                <div>
                    <span className="ds-topbar-title">User Management</span>
                    <span className="ds-topbar-crumb"> / Kelola Pengguna</span>
                </div>
            </div>

            <div className="ds-content">
                {successMsg && <div className="ds-success">{successMsg}</div>}

                {/* ── Stat Cards ── */}
                <div className="ds-metric-grid">
                    <div className="ds-metric-card si-stat">
                        <div className="si-stat-icon" style={{ background: '#E1F5EE' }}>
                            <svg viewBox="0 0 18 18" fill="#0F6E56">
                                <path d="M9 2a4 4 0 100 8 4 4 0 000-8zm-7 14c0-3.3 3.1-6 7-6s7 2.7 7 6H2z" />
                            </svg>
                        </div>
                        <div>
                            <div className="si-stat-lbl">Total User</div>
                            <div className="si-stat-val">{users.length}</div>
                            <div className="si-stat-sub ds-up">terdaftar di sistem</div>
                        </div>
                    </div>
                    <div className="ds-metric-card si-stat">
                        <div className="si-stat-icon" style={{ background: '#EEEDFE' }}>
                            <svg viewBox="0 0 18 18" fill="#3C3489">
                                <path d="M9 2a4 4 0 100 8 4 4 0 000-8zm-7 14c0-3.3 3.1-6 7-6s7 2.7 7 6H2z" />
                            </svg>
                        </div>
                        <div>
                            <div className="si-stat-lbl">Admin / Owner</div>
                            <div className="si-stat-val">{adminCount}</div>
                            <div className="si-stat-sub" style={{ color: '#6B7280' }}>level akses tertinggi</div>
                        </div>
                    </div>
                    <div className="ds-metric-card si-stat">
                        <div className="si-stat-icon" style={{ background: '#E6F1FB' }}>
                            <svg viewBox="0 0 18 18" fill="#185FA5">
                                <path d="M9 2a4 4 0 100 8 4 4 0 000-8zm-7 14c0-3.3 3.1-6 7-6s7 2.7 7 6H2z" />
                            </svg>
                        </div>
                        <div>
                            <div className="si-stat-lbl">Ditampilkan</div>
                            <div className="si-stat-val">{filtered.length}</div>
                            <div className="si-stat-sub" style={{ color: '#6B7280' }}>
                                {filterRole !== 'Semua' ? `filter: ${filterRole}` : 'semua user'}
                            </div>
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
                            <div className="si-stat-val" style={{ fontSize: 14, paddingTop: 2 }}>{query || 'Semua'}</div>
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
                                    <path d="M8 1a4 4 0 100 8 4 4 0 000-8zM2 14c0-2.8 2.7-5 6-5s6 2.2 6 5H2z" />
                                </svg>
                            </div>
                            <div>
                                <div className="si-hdr-title">Daftar Pengguna</div>
                                <div className="si-hdr-sub">{users.length} user terdaftar</div>
                            </div>
                        </div>
                        <div className="si-hdr-right">
                            <div className="si-srch">
                                <svg viewBox="0 0 16 16" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                                    <circle cx="6.5" cy="6.5" r="4" /><path d="M11 11l3 3" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Cari nama, email…"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </div>
                            <button className="ds-btn-pri" style={{ fontSize: 11, height: 30, padding: '0 11px' }} onClick={openAdd}>
                                <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" width="12" height="12">
                                    <path d="M8 2v12M2 8h12" />
                                </svg>
                                Tambah User
                            </button>
                        </div>
                    </div>

                    {/* Filter bar */}
                    <div className="si-fbar">
                        {allRoles.map(r => (
                            <button
                                key={r}
                                className={`si-chip${filterRole === r ? ' on' : ''}`}
                                onClick={() => setFilterRole(r)}
                            >{r}</button>
                        ))}
                    </div>

                    {/* Table */}
                    <div className="ds-table-wrap">
                        <table className="ds-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 40 }}>No</th>
                                    <th>Pengguna</th>
                                    <th>Role</th>
                                    <th>Gender</th>
                                    <th style={{ width: 84 }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((user, index) => {
                                    const av = getAvColor(user.name);
                                    return (
                                        <tr key={user.id}>
                                            <td style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>{index + 1}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{
                                                        width: 34, height: 34, borderRadius: '50%',
                                                        background: av.bg, color: av.fg,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: 12, fontWeight: 500, flexShrink: 0
                                                    }}>{getInitials(user.name)}</div>
                                                    <div>
                                                        <div style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>{user.name}</div>
                                                        <div style={{ fontSize: 10, color: '#6B7280', marginTop: 1 }}>{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><RoleBadge role={user.role} /></td>
                                            <td>
                                                <span className="si-badge" style={user.gender === 'Male'
                                                    ? { background: '#EFF6FF', color: '#0C447C' }
                                                    : { background: '#FDF2F8', color: '#9D174D' }}>
                                                    {user.gender || '-'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="si-act-btns">
                                                    <button className="si-act-btn" title="Edit" onClick={() => openEdit(user)}>
                                                        <svg viewBox="0 0 16 16" fill="#6B7280" width="11" height="11">
                                                            <path d="M11 2l3 3-9 9H2v-3l9-9z" />
                                                        </svg>
                                                    </button>
                                                    <button className="si-act-btn" title="Hapus" onClick={() => openDelete(user)}>
                                                        <svg viewBox="0 0 16 16" fill="#6B7280" width="11" height="11">
                                                            <path d="M3 4h10l-1 10H4L3 4zm3-3h4v2H6V1zm-4 3h12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', color: '#9CA3AF', padding: '32px 0' }}>
                                            Tidak ada user ditemukan
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="si-card-ftr">
                        <div className="si-ftr-info">
                            Total: <strong>{users.length} user</strong>
                            &nbsp;·&nbsp; Ditampilkan: <strong>{filtered.length}</strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Modal Add User ── */}
            {showModal === 'add' && (
                <div className="um-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div className="um-modal">
                        <div className="um-modal-hdr">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 30, height: 30, background: '#E1F5EE', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg viewBox="0 0 16 16" fill="#0F6E56" width="14" height="14">
                                        <path d="M8 1a4 4 0 100 8 4 4 0 000-8zM2 14c0-2.8 2.7-5 6-5s6 2.2 6 5H2z" />
                                    </svg>
                                </div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>Tambah Pengguna Baru</div>
                                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>Isi data dan tetapkan hak akses</div>
                                </div>
                            </div>
                            <button className="um-close-btn" onClick={closeModal}>✕</button>
                        </div>

                        <div className="um-modal-body">
                            {/* Avatar preview */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: '50%',
                                    background: fName ? getAvColor(fName).bg : '#E5E7EB',
                                    color: fName ? getAvColor(fName).fg : '#9CA3AF',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 16, fontWeight: 500, flexShrink: 0
                                }}>{fName ? getInitials(fName) : '?'}</div>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 500, color: '#111827', marginBottom: 2 }}>Foto Profil</div>
                                    <div style={{ fontSize: 10, color: '#6B7280' }}>Avatar otomatis dari inisial nama</div>
                                </div>
                            </div>

                            <div className="um-divider" />
                            <div className="um-sec-lbl">Data Diri</div>

                            <div className="um-form-grid">
                                <div className="um-fld">
                                    <label>Nama Lengkap <span style={{ color: '#E24B4A' }}>*</span></label>
                                    <input type="text" value={fName} onChange={(e) => setFName(e.target.value)} placeholder="Nama lengkap" />
                                </div>
                                <div className="um-fld">
                                    <label>Email <span style={{ color: '#E24B4A' }}>*</span></label>
                                    <input type="email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} placeholder="email@contoh.com" />
                                </div>
                                <div className="um-fld">
                                    <label>Gender <span style={{ color: '#E24B4A' }}>*</span></label>
                                    <select value={fGender} onChange={(e) => setFGender(e.target.value)}>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                                <div className="um-fld">
                                    <label>Role <span style={{ color: '#E24B4A' }}>*</span></label>
                                    <select value={fRole} onChange={(e) => setFRole(e.target.value)}>
                                        <option value="Guest">Guest</option>
                                        <option value="Staff">Staff</option>
                                        <option value="Manager">Manager</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                            </div>

                            <div className="um-divider" />
                            <div className="um-sec-lbl">Kata Sandi</div>

                            <div className="um-form-grid">
                                <div className="um-fld">
                                    <label>Password <span style={{ color: '#E24B4A' }}>*</span></label>
                                    <input type="password" value={fPassword} onChange={(e) => setFPassword(e.target.value)} placeholder="Min. 8 karakter" />
                                </div>
                                <div className="um-fld">
                                    <label>Konfirmasi Password <span style={{ color: '#E24B4A' }}>*</span></label>
                                    <input type="password" value={fConfPassword} onChange={(e) => setFConfPassword(e.target.value)} placeholder="Ulangi password" />
                                </div>
                            </div>

                            {formError && <div className="um-error">{formError}</div>}
                        </div>

                        <div className="um-modal-ftr">
                            <div style={{ fontSize: 11, color: '#9CA3AF' }}>Field <span style={{ color: '#E24B4A' }}>*</span> wajib diisi</div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="ds-btn-sec" onClick={closeModal}>Batal</button>
                                <button className="ds-btn-pri" onClick={handleAdd} disabled={formLoading}>
                                    {formLoading ? 'Menyimpan…' : 'Simpan User'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal Edit User ── */}
            {showModal === 'edit' && selectedUser && (
                <div className="um-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div className="um-modal">
                        <div className="um-modal-hdr">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 30, height: 30, background: '#E6F1FB', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg viewBox="0 0 16 16" fill="#185FA5" width="14" height="14">
                                        <path d="M11 2l3 3-9 9H2v-3l9-9z" />
                                    </svg>
                                </div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>Edit Pengguna</div>
                                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>{selectedUser.name} · {selectedUser.email}</div>
                                </div>
                            </div>
                            <button className="um-close-btn" onClick={closeModal}>✕</button>
                        </div>

                        <div className="um-modal-body">
                            {/* Avatar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: '50%',
                                    background: getAvColor(selectedUser.name).bg,
                                    color: getAvColor(selectedUser.name).fg,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 16, fontWeight: 500, flexShrink: 0
                                }}>{getInitials(selectedUser.name)}</div>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 500, color: '#111827', marginBottom: 2 }}>{selectedUser.name}</div>
                                    <div style={{ fontSize: 11, color: '#6B7280' }}>{selectedUser.email}</div>
                                </div>
                            </div>

                            <div className="um-divider" />
                            <div className="um-sec-lbl">Data Diri</div>

                            <div className="um-form-grid">
                                <div className="um-fld">
                                    <label>Nama Lengkap <span style={{ color: '#E24B4A' }}>*</span></label>
                                    <input type="text" value={fName} onChange={(e) => setFName(e.target.value)} />
                                </div>
                                <div className="um-fld">
                                    <label>Email <span style={{ color: '#E24B4A' }}>*</span></label>
                                    <input type="email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} />
                                </div>
                                <div className="um-fld">
                                    <label>Gender</label>
                                    <select value={fGender} onChange={(e) => setFGender(e.target.value)}>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                                <div className="um-fld">
                                    <label>Role</label>
                                    <select value={fRole} onChange={(e) => setFRole(e.target.value)}>
                                        <option value="Guest">Guest</option>
                                        <option value="Staff">Staff</option>
                                        <option value="Manager">Manager</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                            </div>

                            {formError && <div className="um-error">{formError}</div>}
                        </div>

                        <div className="um-modal-ftr">
                            <button
                                className="ds-btn-sec"
                                style={{ color: '#A32D2D', borderColor: '#F09595' }}
                                onClick={() => { closeModal(); openDelete(selectedUser); }}
                            >
                                <svg viewBox="0 0 16 16" fill="#A32D2D" width="11" height="11">
                                    <path d="M3 4h10l-1 10H4L3 4zm3-3h4v2H6V1zm-4 3h12" />
                                </svg>
                                Hapus User
                            </button>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="ds-btn-sec" onClick={closeModal}>Batal</button>
                                <button className="ds-btn-pri" onClick={handleEdit} disabled={formLoading}>
                                    {formLoading ? 'Menyimpan…' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal Delete User ── */}
            {showModal === 'delete' && selectedUser && (
                <div className="um-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div className="um-modal" style={{ width: 420 }}>
                        {/* Icon + title */}
                        <div style={{ padding: '24px 22px 16px', textAlign: 'center' }}>
                            <div style={{ width: 52, height: 52, background: '#FCEBEB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                <svg viewBox="0 0 16 16" fill="#A32D2D" width="22" height="22">
                                    <path d="M3 4h10l-1 10H4L3 4zm3-3h4v2H6V1zm-4 3h12" />
                                </svg>
                            </div>
                            <div style={{ fontSize: 15, fontWeight: 500, color: '#111827', marginBottom: 6 }}>Hapus Pengguna?</div>
                            <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6, maxWidth: 300, margin: '0 auto' }}>
                                Akun <strong>{selectedUser.name}</strong> ({selectedUser.email}) akan dihapus permanen dan tidak bisa dibatalkan.
                            </div>
                        </div>

                        {/* User info card */}
                        <div style={{ margin: '0 18px 12px', background: '#F9FAFB', borderRadius: 10, padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: '50%',
                                    background: getAvColor(selectedUser.name).bg,
                                    color: getAvColor(selectedUser.name).fg,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 13, fontWeight: 500, flexShrink: 0
                                }}>{getInitials(selectedUser.name)}</div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{selectedUser.name}</div>
                                    <div style={{ fontSize: 11, color: '#6B7280' }}>{selectedUser.role} · {selectedUser.gender}</div>
                                </div>
                                <div style={{ marginLeft: 'auto' }}>
                                    <RoleBadge role={selectedUser.role} />
                                </div>
                            </div>
                        </div>

                        {/* Warning */}
                        <div style={{ margin: '0 18px 16px', background: '#FEF2F2', borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 8 }}>
                            <svg viewBox="0 0 16 16" fill="#A32D2D" width="13" height="13" style={{ flexShrink: 0, marginTop: 1 }}>
                                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.5 4h1v4h-1zm0 5h1v1h-1z" />
                            </svg>
                            <div style={{ fontSize: 11, color: '#A32D2D', lineHeight: 1.5 }}>
                                Log aktivitas terkait user ini akan tetap tersimpan, namun akun tidak bisa digunakan kembali.
                            </div>
                        </div>

                        {formError && <div className="um-error" style={{ margin: '0 18px 12px' }}>{formError}</div>}

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: 8, padding: '0 18px 18px' }}>
                            <button className="ds-btn-sec" style={{ flex: 1, justifyContent: 'center' }} onClick={closeModal}>Batal</button>
                            <button className="um-btn-danger" style={{ flex: 1 }} onClick={handleDelete} disabled={formLoading}>
                                <svg viewBox="0 0 16 16" fill="white" width="12" height="12">
                                    <path d="M3 4h10l-1 10H4L3 4zm3-3h4v2H6V1zm-4 3h12" />
                                </svg>
                                {formLoading ? 'Menghapus…' : 'Hapus Permanen'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UserList;
