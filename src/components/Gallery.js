import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import API_BASE_URL from '../config/config';

/* ── inline styles ── */
const S = {
    page: { padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '18px' },
    header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
    title: { fontSize: 20, fontWeight: 700, color: '#111827' },
    sub: { fontSize: 13, color: '#6B7280', marginTop: 3 },
    actions: { display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 },
    // stat cards
    scGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12 },
    sc: { background: '#fff', border: '1px solid #E8E8E5', borderRadius: 12, padding: '12px 16px' },
    scL: { fontSize: 11, color: '#6B7280', marginBottom: 4 },
    scV: { fontSize: 22, fontWeight: 700, color: '#111827' },
    scS: { fontSize: 11, color: '#6B7280', marginTop: 2 },
    // toolbar
    toolbar: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    chip: (on) => ({
        fontSize: 11, padding: '5px 13px', borderRadius: 20,
        background: on ? '#E1F5EE' : '#F4F5F7',
        color: on ? '#0F6E56' : '#6B7280',
        border: `1px solid ${on ? '#9FE1CB' : '#E5E7EB'}`,
        cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
        transition: 'all .15s',
    }),
    // gallery grid
    galGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 },
    galItem: { background: '#fff', border: '1px solid #E8E8E5', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'border-color .15s, box-shadow .15s' },
    galThumb: { height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
    galInfo: { padding: '10px 12px', borderTop: '1px solid #F4F5F7' },
    galTitle: { fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    galMeta: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
    // lightbox
    lbBackdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
    lbBox: { background: '#fff', borderRadius: 14, width: 640, maxWidth: '96vw', display: 'flex', flexDirection: 'column', boxShadow: '0 16px 48px rgba(0,0,0,0.3)' },
    lbImg: { height: 340, borderRadius: '14px 14px 0 0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F5F7' },
    // upload modal
    modalBackdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 60, paddingBottom: 40, overflowY: 'auto' },
    modal: { background: '#fff', borderRadius: 14, width: 640, maxWidth: '96vw', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' },
    mhdr: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E8E8E5' },
    mhdrL: { display: 'flex', alignItems: 'center', gap: 10 },
    mhdrIcon: { width: 32, height: 32, background: '#E1F5EE', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    mbody: { padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 },
    mftr: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid #E8E8E5' },
    // step indicator
    stepsWrap: { display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #E8E8E5', gap: 0 },
    stepItem: { display: 'flex', alignItems: 'center', gap: 7, flex: 1 },
    stepCircle: (state) => ({
        width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 600, flexShrink: 0,
        background: state === 'idle' ? '#F4F5F7' : '#0F6E56',
        color: state === 'idle' ? '#9CA3AF' : 'white',
        border: state === 'idle' ? '1px solid #E5E7EB' : 'none',
        outline: state === 'active' ? '3px solid #9FE1CB' : 'none',
        outlineOffset: 1,
    }),
    stepLabel: (state) => ({ fontSize: 11, fontWeight: state === 'active' ? 600 : 400, color: state === 'active' ? '#0F6E56' : '#9CA3AF' }),
    stepLine: (done) => ({ flex: 1, height: 1, background: done ? '#0F6E56' : '#E5E7EB', margin: '0 8px' }),
    // upload zone
    dropZone: (drag) => ({
        border: `1.5px dashed ${drag ? '#0F6E56' : '#E5E7EB'}`,
        borderRadius: 12, padding: '28px 20px', textAlign: 'center',
        background: drag ? '#E1F5EE' : '#F9FAFB', cursor: 'pointer', transition: 'all .2s',
    }),
    // preview grid
    prevGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 8 },
    prevItem: { position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1', background: '#E1F5EE' },
    prevRemoveBtn: { position: 'absolute', top: 4, right: 4, width: 18, height: 18, background: 'rgba(0,0,0,0.55)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', fontSize: 10, border: 'none' },
    // form fields
    fgrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    fld: { display: 'flex', flexDirection: 'column', gap: 5 },
    flabel: { fontSize: 11, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' },
    finput: { fontSize: 13, padding: '8px 11px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#F9FAFB', color: '#111827', fontFamily: 'inherit', outline: 'none' },
    // progress bar
    progWrap: { background: '#F9FAFB', borderRadius: 8, padding: '11px 13px', border: '1px solid #E8E8E5' },
    progBar: { height: 5, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden', marginTop: 6 },
    // success
    successScreen: { padding: '32px 20px', textAlign: 'center' },
    successIcon: { width: 56, height: 56, background: '#E1F5EE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' },
};

const PLACEHOLDER_COLORS = ['#E1F5EE', '#E6F1FB', '#FAEEDA', '#F5F3FF', '#FDF2F8', '#F0FDF4'];

const Gallery = () => {
    const [images, setImages] = useState([]);
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

    // Lightbox
    const [lbItem, setLbItem] = useState(null);
    const [lbIdx, setLbIdx] = useState(0);

    // Add modal
    const [showAdd, setShowAdd] = useState(false);
    const [addStep, setAddStep] = useState(1);
    const [addFile, setAddFile] = useState(null);
    const [addPreview, setAddPreview] = useState(null);
    const [addName, setAddName] = useState('');
    const [addDrag, setAddDrag] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadDone, setUploadDone] = useState(false);
    const fileInputRef = useRef(null);

    // Edit modal
    const [showEdit, setShowEdit] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editOrigFoto, setEditOrigFoto] = useState(null);
    const [editNewFile, setEditNewFile] = useState(null);
    const [editPreview, setEditPreview] = useState(null);
    const [editDrag, setEditDrag] = useState(false);
    const [editSaving, setEditSaving] = useState(false);
    const editFileRef = useRef(null);

    const refreshToken = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/token`, { withCredentials: true });
            setToken(response.data.accessToken);
            const decoded = jwtDecode(response.data.accessToken);
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
            const res = await axios.get(`${API_BASE_URL}/token`, { withCredentials: true });
            config.headers.Authorization = `Bearer ${res.data.accessToken}`;
            setToken(res.data.accessToken);
            const decoded = jwtDecode(res.data.accessToken);
            setName(decoded.name);
            setExpire(decoded.exp);
        }
        return config;
    }, (err) => Promise.reject(err));

    const getGallery = useCallback(async () => {
        try {
            const res = await axiosJWT.get(`${API_BASE_URL}/gallery?search_query=${keyword}&page=${page}&limit=${limit}`);
            setImages(res.data.response || []);
            setPage(res.data.page ?? 0);
            setPages(res.data.totalPage ?? 0);
            setRows(res.data.totalRows ?? 0);
        } catch { /* handled by interceptor */ }
    }, [page, keyword, limit]);

    useEffect(() => {
        if (token) getGallery();
    }, [page, keyword, token]);

    useEffect(() => { setPage(0); }, [keyword]);

    const deleteGallery = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Hapus foto ini?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/gallery/${id}`);
            getGallery();
        } catch (err) { console.error(err); }
    };

    const openLB = (item, idx) => { setLbItem(item); setLbIdx(idx); };
    const closeLB = () => setLbItem(null);
    const lbPrev = () => {
        const ni = (lbIdx - 1 + images.length) % images.length;
        setLbItem(images[ni]); setLbIdx(ni);
    };
    const lbNext = () => {
        const ni = (lbIdx + 1) % images.length;
        setLbItem(images[ni]); setLbIdx(ni);
    };

    // Add modal handlers
    const openAdd = () => { setShowAdd(true); setAddStep(1); setAddFile(null); setAddPreview(null); setAddName(''); setUploadDone(false); };
    const closeAdd = () => { setShowAdd(false); setAddFile(null); setAddPreview(null); };

    // Edit modal handlers
    const openEdit = (img) => {
        setEditId(img.id);
        setEditName(img.name || '');
        setEditOrigFoto(img.foto || null);
        setEditNewFile(null);
        setEditPreview(img.foto || null);
        setShowEdit(true);
    };
    const closeEdit = () => { setShowEdit(false); setEditNewFile(null); };

    const handleEditFilePick = (file) => {
        if (!file) return;
        setEditNewFile(file);
        setEditPreview(URL.createObjectURL(file));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editName) return;
        setEditSaving(true);
        try {
            const data = new FormData();
            data.append('name', editName);
            if (editNewFile) data.append('foto', editNewFile);
            else data.append('foto', editOrigFoto || '');
            await axios.patch(`${API_BASE_URL}/gallery/${editId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
            setShowEdit(false);
            getGallery();
            setSuccessMessage('Foto galeri berhasil diperbarui!');
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal memperbarui foto.');
        } finally {
            setEditSaving(false);
        }
    };

    const handleFilePick = (file) => {
        if (!file) return;
        setAddFile(file);
        setAddPreview(URL.createObjectURL(file));
        if (!addName) setAddName(file.name.replace(/\.[^.]+$/, ''));
    };
    const onFileInput = (e) => handleFilePick(e.target.files[0]);
    const onDrop = (e) => { e.preventDefault(); setAddDrag(false); handleFilePick(e.dataTransfer.files[0]); };

    const handleAddSubmit = async () => {
        if (!addFile || !addName) return;
        setUploading(true);
        try {
            const data = new FormData();
            data.append('name', addName);
            data.append('foto', addFile);
            await axios.post(`${API_BASE_URL}/gallery`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
            setUploadDone(true);
            setAddStep(4);
            getGallery();
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal upload foto.');
        } finally {
            setUploading(false);
        }
    };

    const thumbBg = (idx) => PLACEHOLDER_COLORS[idx % PLACEHOLDER_COLORS.length];

    const stepState = (s) => {
        if (s < addStep) return 'done';
        if (s === addStep) return 'active';
        return 'idle';
    };

    return (
        <div style={S.page}>
            {successMessage && (
                <div className="ds-success">{successMessage}</div>
            )}

            {/* Page Header */}
            <div style={S.header}>
                <div>
                    <div style={S.title}>Gallery</div>
                    <div style={S.sub}>Dokumentasi kegiatan, acara, dan foto perusahaan</div>
                </div>
                <div style={S.actions}>
                    <button className="ds-btn-sec" onClick={() => navigate('add')} style={{ fontSize: 12 }}>
                        <svg viewBox="0 0 16 16" fill="currentColor" width={13} height={13}><path d="M2 4h12v8H2V4zm1 1v1l5 3 5-3V5L8 8 3 5z" /></svg>
                        Kelola
                    </button>
                    <button className="ds-btn-pri" onClick={openAdd} style={{ fontSize: 12 }}>
                        <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" width={13} height={13}><path d="M8 2v12M2 8h12" /></svg>
                        Upload Foto
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div style={S.scGrid}>
                <div style={S.sc}>
                    <div style={S.scL}>Total Foto</div>
                    <div style={S.scV}>{rows}</div>
                    <div style={S.scS}>dalam galeri</div>
                </div>
                <div style={S.sc}>
                    <div style={S.scL}>Halaman</div>
                    <div style={S.scV}>{pages}</div>
                    <div style={S.scS}>total halaman</div>
                </div>
                <div style={S.sc}>
                    <div style={S.scL}>Ditampilkan</div>
                    <div style={S.scV}>{images.length}</div>
                    <div style={S.scS}>foto di halaman ini</div>
                </div>
                <div style={S.sc}>
                    <div style={S.scL}>Halaman Aktif</div>
                    <div style={S.scV}>{rows ? page + 1 : 0}</div>
                    <div style={S.scS}>dari {pages} halaman</div>
                </div>
            </div>

            {/* Toolbar / Search */}
            <div style={S.toolbar}>
                <form onSubmit={(e) => { e.preventDefault(); setPage(0); setKeyword(query); }} style={{ flex: 1, maxWidth: 280 }}>
                    <div className="ds-search-form">
                        <svg viewBox="0 0 16 16" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                            <circle cx="6.5" cy="6.5" r="4" /><path d="M11 11l3 3" />
                        </svg>
                        <input placeholder="Cari foto…" value={query} onChange={(e) => setQuery(e.target.value)} />
                        <button type="submit" />
                    </div>
                </form>
                {keyword && (
                    <button className="ds-btn-sec" style={{ fontSize: 11 }} onClick={() => { setKeyword(''); setQuery(''); }}>
                        ✕ Reset
                    </button>
                )}
            </div>

            {/* Gallery Grid */}
            {images.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7280', fontSize: 13 }}>
                    <svg width={40} height={40} viewBox="0 0 16 16" fill="#D1D5DB" style={{ display: 'block', margin: '0 auto 10px' }}>
                        <path d="M1 1h14v14H1V1zm1 1v12h12V2H2zm1 9l3-4 2 3 2-2 3 3H3z" />
                    </svg>
                    Belum ada foto di galeri
                </div>
            ) : (
                <div style={S.galGrid}>
                    {images.map((img, idx) => (
                        <div
                            key={img.id}
                            style={S.galItem}
                            onClick={() => openLB(img, idx)}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#9FE1CB'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,110,86,.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8E8E5'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                            <div style={{ ...S.galThumb, background: thumbBg(idx) }}>
                                {img.foto ? (
                                    <img src={img.foto} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <svg width={36} height={36} viewBox="0 0 16 16" fill="#0F6E56" style={{ opacity: 0.3 }}>
                                        <path d="M1 1h14v14H1V1zm1 1v12h12V2H2zm1 9l3-4 2 3 2-2 3 3H3z" />
                                    </svg>
                                )}
                                {/* Hover overlay */}
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,110,86,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity .2s' }}
                                    className="gal-overlay-inner"
                                >
                                    <div style={{ width: 38, height: 38, background: '#0F6E56', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width={16} height={16} viewBox="0 0 16 16" fill="white"><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" /><circle cx="8" cy="8" r="2" fill="white" /></svg>
                                    </div>
                                </div>
                            </div>
                            <div style={S.galInfo}>
                                <div style={S.galTitle} title={img.name}>{img.name}</div>
                                <div style={S.galMeta}>
                                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#E1F5EE', color: '#0F6E56', border: '1px solid #9FE1CB' }}>Foto</span>
                                    <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                                        <button className="ds-btn-sm primary" style={{ fontSize: 10, padding: '3px 8px' }} onClick={(e) => { e.stopPropagation(); openEdit(img); }}>Edit</button>
                                        <button className="ds-btn-sm danger" style={{ fontSize: 10, padding: '3px 8px' }} onClick={(e) => deleteGallery(img.id, e)}>Hapus</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            <div className="ds-pagination">
                <div className="ds-pg-info">Total: {rows} foto · Halaman {rows ? page + 1 : 0} dari {pages}</div>
                <div className="ds-pg-nav">
                    <button className="ds-pg-btn" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page <= 0}>‹</button>
                    {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                        const p = Math.max(0, Math.min(page - 2, pages - 5)) + i;
                        return (
                            <button key={p} className={`ds-pg-btn${p === page ? ' cur' : ''}`} onClick={() => setPage(p)}>{p + 1}</button>
                        );
                    })}
                    <button className="ds-pg-btn" onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1}>›</button>
                </div>
            </div>

            {/* ── LIGHTBOX ── */}
            {lbItem && (
                <div style={S.lbBackdrop} onClick={closeLB}>
                    <div style={S.lbBox} onClick={(e) => e.stopPropagation()}>
                        <div style={S.lbImg}>
                            {lbItem.foto
                                ? <img src={lbItem.foto} alt={lbItem.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                : <svg width={60} height={60} viewBox="0 0 16 16" fill="#0F6E56" style={{ opacity: 0.3 }}><path d="M1 1h14v14H1V1zm1 1v12h12V2H2zm1 9l3-4 2 3 2-2 3 3H3z" /></svg>
                            }
                        </div>
                        <div style={{ padding: '14px 18px' }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{lbItem.name}</div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, background: '#E1F5EE', color: '#0F6E56', border: '1px solid #9FE1CB' }}>Foto</span>
                                <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, background: '#F4F5F7', color: '#6B7280', border: '1px solid #E5E7EB' }}>{lbIdx + 1} / {images.length}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderTop: '1px solid #E8E8E5' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button className="ds-btn-sec" style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }} onClick={lbPrev}>
                                    <svg width={12} height={12} viewBox="0 0 12 12" fill="currentColor"><path d="M8 2L4 6l4 4" /></svg>
                                </button>
                                <button className="ds-btn-sec" style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }} onClick={lbNext}>
                                    <svg width={12} height={12} viewBox="0 0 12 12" fill="currentColor"><path d="M4 2l4 4-4 4" /></svg>
                                </button>
                            </div>
                            <div style={{ display: 'flex', gap: 7 }}>
                                {lbItem.foto && (
                                    <a href={lbItem.foto} download className="ds-btn-sec" style={{ fontSize: 11, textDecoration: 'none' }}>
                                        <svg width={12} height={12} viewBox="0 0 16 16" fill="currentColor"><path d="M8 2v8m-4-3l4 3 4-3M3 13h10" /></svg>
                                        Unduh
                                    </a>
                                )}
                                <button className="ds-btn-sec" style={{ fontSize: 11 }} onClick={() => { closeLB(); openEdit(lbItem); }}>Edit</button>
                                <button className="ds-btn-pri" style={{ fontSize: 11 }} onClick={closeLB}>Tutup</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── EDIT GALLERY MODAL ── */}
            {showEdit && (
                <div style={S.modalBackdrop} onClick={closeEdit}>
                    <div style={{ ...S.modal, width: 480 }} onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div style={S.mhdr}>
                            <div style={S.mhdrL}>
                                <div style={S.mhdrIcon}>
                                    <svg width={15} height={15} viewBox="0 0 16 16" fill="#0F6E56">
                                        <path d="M2 3h12a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1zm9.5 2a1 1 0 11-2 0 1 1 0 012 0zM3 11l3-2.5 2 1.5 2-3 3 3.5H3z" />
                                    </svg>
                                </div>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Edit Foto Gallery</div>
                                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>Perbarui nama atau ganti foto</div>
                                </div>
                            </div>
                            <button style={{ width: 28, height: 28, border: '1px solid #E5E7EB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fff', fontSize: 14, color: '#6B7280' }} onClick={closeEdit}>×</button>
                        </div>

                        <form onSubmit={handleEditSubmit}>
                            <div style={S.mbody}>
                                {/* Current / new photo preview */}
                                <div style={{ border: '1px solid #E8E8E5', borderRadius: 12, overflow: 'hidden' }}>
                                    <div style={{ height: 180, background: '#F4F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                        {editPreview
                                            ? <img src={editPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <svg width={40} height={40} viewBox="0 0 16 16" fill="#D1D5DB"><path d="M1 1h14v14H1V1zm1 1v12h12V2H2zm1 9l3-4 2 3 2-2 3 3H3z" /></svg>}
                                        {editNewFile && (
                                            <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, padding: '3px 9px', borderRadius: 20, background: '#0F6E56', color: '#fff' }}>Foto Baru</div>
                                        )}
                                    </div>
                                    <div style={{ padding: '9px 14px', borderTop: '1px solid #F4F5F7' }}>
                                        <div style={{ fontSize: 11, color: '#6B7280' }}>
                                            {editNewFile
                                                ? <><span style={{ fontWeight: 600, color: '#111827' }}>{editNewFile.name}</span> · {(editNewFile.size / 1024 / 1024).toFixed(2)} MB</>
                                                : 'Foto saat ini · Klik area di bawah untuk mengganti'}
                                        </div>
                                    </div>
                                </div>

                                {/* Drop zone */}
                                <div
                                    style={S.dropZone(editDrag)}
                                    onDragOver={(e) => { e.preventDefault(); setEditDrag(true); }}
                                    onDragLeave={() => setEditDrag(false)}
                                    onDrop={(e) => { e.preventDefault(); setEditDrag(false); handleEditFilePick(e.dataTransfer.files[0]); }}
                                    onClick={() => editFileRef.current?.click()}
                                >
                                    <div style={{ width: 36, height: 36, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                                        <svg width={17} height={17} viewBox="0 0 16 16" fill="#6B7280"><path d="M8 2v8m-4-3l4 3 4-3M3 13h10" /></svg>
                                    </div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 3 }}>{editNewFile ? 'Ganti foto lagi' : 'Ganti foto'}</div>
                                    <div style={{ fontSize: 11, color: '#6B7280' }}>Drag & drop atau klik · JPG, PNG, WebP · maks. 5MB</div>
                                </div>
                                <input ref={editFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleEditFilePick(e.target.files[0])} />

                                {/* Name field */}
                                <div style={S.fld}>
                                    <label style={S.flabel}>Judul / Nama Foto *</label>
                                    <input
                                        style={S.finput} type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required
                                        placeholder="cth. Annual Company Gathering 2026"
                                        onFocus={(e) => { e.target.style.borderColor = '#0F6E56'; e.target.style.background = '#fff'; }}
                                        onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }}
                                    />
                                </div>

                                {/* Info box */}
                                <div style={{ background: '#E1F5EE', borderRadius: 8, padding: '10px 13px', display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                                    <svg width={14} height={14} viewBox="0 0 16 16" fill="#0F6E56" style={{ flexShrink: 0, marginTop: 1 }}><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.5 3h1v5h-1zm0 6h1v1h-1z" /></svg>
                                    <div style={{ fontSize: 11, color: '#085041', lineHeight: 1.5 }}>Jika tidak memilih foto baru, foto lama akan tetap digunakan.</div>
                                </div>
                            </div>

                            <div style={S.mftr}>
                                <button type="button" className="ds-btn-sec" onClick={closeEdit} disabled={editSaving}>Batal</button>
                                <button type="submit" className="ds-btn-pri" disabled={editSaving || !editName}>
                                    {editSaving ? 'Menyimpan…' : (
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

            {/* ── ADD GALLERY MODAL ── */}
            {showAdd && (
                <div style={S.modalBackdrop} onClick={closeAdd}>
                    <div style={S.modal} onClick={(e) => e.stopPropagation()}>

                        {/* Header */}
                        <div style={S.mhdr}>
                            <div style={S.mhdrL}>
                                <div style={S.mhdrIcon}>
                                    <svg width={15} height={15} viewBox="0 0 16 16" fill="#0F6E56">
                                        <path d="M2 3h12a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1zm9.5 2a1 1 0 11-2 0 1 1 0 012 0zM3 11l3-2.5 2 1.5 2-3 3 3.5H3z" />
                                    </svg>
                                </div>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                                        {addStep === 4 ? 'Upload Berhasil!' : 'Upload Foto ke Gallery'}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>
                                        {addStep === 4 ? 'Foto sudah live di gallery' : `Langkah ${addStep} dari 3`}
                                    </div>
                                </div>
                            </div>
                            <button style={{ width: 28, height: 28, border: '1px solid #E5E7EB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fff', fontSize: 14, color: '#6B7280' }} onClick={closeAdd}>×</button>
                        </div>

                        {/* Step Indicator */}
                        {addStep !== 4 && (
                            <div style={S.stepsWrap}>
                                {[['Pilih Foto', 1], ['Detail Info', 2], ['Pratinjau & Upload', 3]].map(([label, s], i) => (
                                    <React.Fragment key={s}>
                                        <div style={S.stepItem}>
                                            <div style={S.stepCircle(stepState(s))}>
                                                {stepState(s) === 'done'
                                                    ? <svg width={10} height={10} viewBox="0 0 10 10" fill="white"><path d="M1.5 5l2.5 2.5 4.5-4" /></svg>
                                                    : s}
                                            </div>
                                            <span style={S.stepLabel(stepState(s))}>{label}</span>
                                        </div>
                                        {i < 2 && <div style={S.stepLine(s < addStep)} />}
                                    </React.Fragment>
                                ))}
                            </div>
                        )}

                        {/* ── Step 1: Pilih Foto ── */}
                        {addStep === 1 && (
                            <div style={S.mbody}>
                                <div
                                    style={S.dropZone(addDrag)}
                                    onDragOver={(e) => { e.preventDefault(); setAddDrag(true); }}
                                    onDragLeave={() => setAddDrag(false)}
                                    onDrop={onDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div style={{ width: 44, height: 44, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                                        <svg width={20} height={20} viewBox="0 0 16 16" fill="#6B7280"><path d="M8 2v8m-4-3l4 3 4-3M3 13h10" /></svg>
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Drag & drop foto di sini</div>
                                    <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 12 }}>atau klik untuk memilih dari komputer</div>
                                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                                        {['JPG', 'PNG', 'WebP', 'GIF', 'Max 10 MB'].map(f => (
                                            <span key={f} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#fff', border: '1px solid #E5E7EB', color: '#6B7280' }}>{f}</span>
                                        ))}
                                    </div>
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileInput} />

                                {addFile && (
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>File Terpilih</div>
                                        <div style={S.prevGrid}>
                                            <div style={{ ...S.prevItem, overflow: 'hidden' }}>
                                                {addPreview
                                                    ? <img src={addPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <svg width={20} height={20} viewBox="0 0 16 16" fill="#0F6E56"><path d="M1 1h14v14H1V1zm1 1v12h12V2H2zm1 9l3-4 2 3 2-2 3 3H3z" /></svg>
                                                    </div>}
                                                <button style={S.prevRemoveBtn} onClick={() => { setAddFile(null); setAddPreview(null); }}>×</button>
                                                <div style={{ position: 'absolute', bottom: 4, left: 4, fontSize: 9, padding: '1px 5px', borderRadius: 20, background: '#0F6E56', color: 'white' }}>utama</div>
                                            </div>
                                        </div>
                                        <div style={{ marginTop: 8, fontSize: 12, color: '#374151' }}>
                                            <span style={{ fontWeight: 600 }}>{addFile.name}</span>
                                            <span style={{ color: '#6B7280', marginLeft: 8 }}>{(addFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Step 2: Detail Info ── */}
                        {addStep === 2 && (
                            <div style={S.mbody}>
                                <div style={S.fld}>
                                    <label style={S.flabel}>Judul / Nama Foto <span style={{ color: '#A32D2D' }}>*</span></label>
                                    <input
                                        style={S.finput}
                                        type="text"
                                        value={addName}
                                        onChange={(e) => setAddName(e.target.value)}
                                        placeholder="cth. Annual Company Gathering 2026"
                                        onFocus={(e) => { e.target.style.borderColor = '#0F6E56'; e.target.style.background = '#fff'; }}
                                        onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }}
                                    />
                                    <div style={{ fontSize: 10, color: '#9CA3AF' }}>Akan tampil sebagai judul foto di gallery</div>
                                </div>

                                {addFile && (
                                    <div style={{ background: '#F9FAFB', border: '1px solid #E8E8E5', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'center' }}>
                                        <div style={{ width: 52, height: 52, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {addPreview
                                                ? <img src={addPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                : <svg width={20} height={20} viewBox="0 0 16 16" fill="#0F6E56"><path d="M1 1h14v14H1V1zm1 1v12h12V2H2zm1 9l3-4 2 3 2-2 3 3H3z" /></svg>}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{addFile.name}</div>
                                            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{(addFile.size / 1024 / 1024).toFixed(2)} MB</div>
                                        </div>
                                        <div style={{ marginLeft: 'auto', fontSize: 10, padding: '3px 8px', borderRadius: 20, background: '#E1F5EE', color: '#0F6E56', border: '1px solid #9FE1CB' }}>Siap</div>
                                    </div>
                                )}

                                <div style={{ background: '#E1F5EE', borderRadius: 8, padding: '10px 13px', display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                                    <svg width={14} height={14} viewBox="0 0 16 16" fill="#0F6E56" style={{ flexShrink: 0, marginTop: 1 }}><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.5 3h1v5h-1zm0 6h1v1h-1z" /></svg>
                                    <div style={{ fontSize: 11, color: '#085041', lineHeight: 1.5 }}>Foto akan tampil di halaman Gallery setelah diupload. Pastikan foto sudah sesuai dengan kebijakan konten perusahaan.</div>
                                </div>
                            </div>
                        )}

                        {/* ── Step 3: Pratinjau & Upload ── */}
                        {addStep === 3 && (
                            <div style={S.mbody}>
                                {/* Preview Card */}
                                <div style={{ border: '1px solid #E8E8E5', borderRadius: 12, overflow: 'hidden' }}>
                                    <div style={{ height: 160, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {addPreview
                                            ? <img src={addPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <svg width={40} height={40} viewBox="0 0 16 16" fill="#0F6E56" style={{ opacity: 0.4 }}><path d="M1 1h14v14H1V1zm1 1v12h12V2H2zm1 9l3-4 2 3 2-2 3 3H3z" /></svg>}
                                    </div>
                                    <div style={{ padding: '12px 16px' }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{addName || '—'}</div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, background: '#E1F5EE', color: '#0F6E56', border: '1px solid #9FE1CB' }}>Foto</span>
                                            <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, background: '#F4F5F7', color: '#6B7280', border: '1px solid #E5E7EB' }}>{addFile?.name}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Checklist */}
                                <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '12px 14px' }}>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 9 }}>Ringkasan sebelum upload</div>
                                    {[
                                        [!!addFile, '1 foto siap diupload'],
                                        [!!addName, 'Nama foto sudah diisi'],
                                    ].map(([ok, label], i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: ok ? '#111827' : '#6B7280', marginBottom: 6 }}>
                                            <div style={{ width: 16, height: 16, borderRadius: '50%', background: ok ? '#E1F5EE' : '#FAEEDA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                {ok
                                                    ? <svg width={9} height={9} viewBox="0 0 10 10" fill="#0F6E56"><path d="M1.5 5l2.5 2.5 4.5-4" /></svg>
                                                    : <svg width={9} height={9} viewBox="0 0 10 10" fill="#854F0B"><path d="M5 1a4 4 0 100 8A4 4 0 005 1zm-.4 2h.8v2.5h-.8zm0 3.2h.8v.8h-.8z" /></svg>}
                                            </div>
                                            {label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Success ── */}
                        {addStep === 4 && (
                            <div style={S.successScreen}>
                                <div style={S.successIcon}>
                                    <svg width={24} height={24} viewBox="0 0 24 24" fill="#0F6E56"><path d="M4 12l5 5L20 7" /></svg>
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Foto berhasil diupload!</div>
                                <div style={{ fontSize: 12, color: '#6B7280', maxWidth: 360, margin: '0 auto 18px', lineHeight: 1.6 }}>
                                    "{addName}" sudah tampil di halaman Gallery.
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                                    <button className="ds-btn-sec" onClick={() => { setAddStep(1); setAddFile(null); setAddPreview(null); setAddName(''); setUploadDone(false); }}>Upload Lagi</button>
                                    <button className="ds-btn-pri" onClick={closeAdd}>Tutup</button>
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        {addStep !== 4 && (
                            <div style={S.mftr}>
                                <div style={{ fontSize: 11, color: '#6B7280' }}>
                                    {addStep === 1 && (addFile ? `1 foto terpilih · ${(addFile.size / 1024 / 1024).toFixed(2)} MB` : 'Belum ada foto dipilih')}
                                    {addStep === 2 && 'Isi detail foto sebelum upload'}
                                    {addStep === 3 && 'Siap diupload ke gallery'}
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {addStep > 1 && (
                                        <button className="ds-btn-sec" onClick={() => setAddStep(s => s - 1)} disabled={uploading}>← Kembali</button>
                                    )}
                                    <button className="ds-btn-sec" onClick={closeAdd} disabled={uploading}>Batal</button>
                                    {addStep < 3 ? (
                                        <button
                                            className="ds-btn-pri"
                                            onClick={() => setAddStep(s => s + 1)}
                                            disabled={(addStep === 1 && !addFile) || (addStep === 2 && !addName)}
                                        >
                                            {addStep === 1 ? 'Lanjut: Detail Info' : 'Lanjut: Pratinjau'}
                                            <svg width={12} height={12} viewBox="0 0 16 16" fill="white"><path d="M6 4l4 4-4 4" /></svg>
                                        </button>
                                    ) : (
                                        <button className="ds-btn-pri" onClick={handleAddSubmit} disabled={uploading || !addFile || !addName}>
                                            {uploading ? 'Mengupload…' : 'Upload Sekarang'}
                                            {!uploading && <svg width={12} height={12} viewBox="0 0 16 16" fill="white"><path d="M8 2v8m-4-3l4 3 4-3M3 13h10" /></svg>}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Hover overlay style injection */}
            <style>{`.gal-overlay-inner { opacity: 0 !important; } .gal-item:hover .gal-overlay-inner { opacity: 1 !important; }`}</style>
        </div>
    );
};

export default Gallery;
