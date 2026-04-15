import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config/config";

const S = {
    page: { padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: 560, margin: '0 auto' },
    card: { background: '#fff', border: '1px solid #E8E8E5', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    mhdr: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E8E8E5' },
    mbody: { padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 },
    mftr: { display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '14px 20px', borderTop: '1px solid #E8E8E5' },
    fld: { display: 'flex', flexDirection: 'column', gap: 4 },
    flabel: { fontSize: 11, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' },
    finput: { fontSize: 13, padding: '8px 11px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#F9FAFB', color: '#111827', fontFamily: 'inherit', outline: 'none' },
    dropZone: (drag) => ({
        border: `1.5px dashed ${drag ? '#0F6E56' : '#E5E7EB'}`,
        borderRadius: 12, padding: '24px 20px', textAlign: 'center',
        background: drag ? '#E1F5EE' : '#F9FAFB', cursor: 'pointer', transition: 'all .2s',
    }),
};

const EditGallery = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [galleryData, setGalleryData] = useState(null);
    const [name, setName] = useState('');
    const [newFoto, setNewFoto] = useState(null);
    const [fotoPreview, setFotoPreview] = useState(null);
    const [drag, setDrag] = useState(false);
    const [saving, setSaving] = useState(false);
    const fileRef = useRef(null);

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/gallery/${id}`);
                const g = res.data;
                setGalleryData(g);
                setName(g.name || '');
                setFotoPreview(g.foto || null);
            } catch (err) {
                console.error("Error fetching gallery:", err.message);
            }
        };
        fetchGallery();
    }, [id]);

    const handleFile = (file) => {
        if (!file) return;
        setNewFoto(file);
        setFotoPreview(URL.createObjectURL(file));
    };

    const onDrop = (e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name) return;
        setSaving(true);
        try {
            const data = new FormData();
            data.append('name', name);
            if (newFoto) {
                data.append('foto', newFoto);
            } else {
                data.append('foto', galleryData.foto || '');
            }
            await axios.patch(`${API_BASE_URL}/gallery/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
            navigate('/dashboard/gallery', { state: { successMessage: 'Foto galeri berhasil diperbarui!' } });
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Gagal memperbarui foto.');
        } finally {
            setSaving(false);
        }
    };

    if (!galleryData) {
        return (
            <div style={{ padding: '60px 24px', textAlign: 'center', color: '#6B7280', fontSize: 13 }}>
                Memuat data...
            </div>
        );
    }

    return (
        <div style={S.page}>
            {/* Page title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                    onClick={() => navigate('/dashboard/gallery')}
                    style={{ width: 32, height: 32, border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', flexShrink: 0 }}
                >
                    <svg width={14} height={14} viewBox="0 0 16 16" fill="currentColor"><path d="M10 3L5 8l5 5" /></svg>
                </button>
                <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Edit Foto Gallery</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Perbarui nama atau ganti foto</div>
                </div>
            </div>

            {/* Form Card */}
            <div style={S.card}>
                {/* Header */}
                <div style={S.mhdr}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, background: '#E1F5EE', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width={15} height={15} viewBox="0 0 16 16" fill="#0F6E56">
                                <path d="M2 3h12a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1zm9.5 2a1 1 0 11-2 0 1 1 0 012 0zM3 11l3-2.5 2 1.5 2-3 3 3.5H3z" />
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Detail Foto</div>
                            <div style={{ fontSize: 11, color: '#6B7280' }}>Ubah informasi foto galeri</div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={S.mbody}>
                        {/* Current / new photo preview */}
                        <div style={{ border: '1px solid #E8E8E5', borderRadius: 12, overflow: 'hidden' }}>
                            <div style={{ height: 200, background: '#F4F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                {fotoPreview
                                    ? <img src={fotoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <svg width={40} height={40} viewBox="0 0 16 16" fill="#D1D5DB"><path d="M1 1h14v14H1V1zm1 1v12h12V2H2zm1 9l3-4 2 3 2-2 3 3H3z" /></svg>}
                                {newFoto && (
                                    <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, padding: '3px 9px', borderRadius: 20, background: '#0F6E56', color: '#fff' }}>
                                        Foto Baru
                                    </div>
                                )}
                            </div>
                            <div style={{ padding: '10px 14px', borderTop: '1px solid #F4F5F7' }}>
                                <div style={{ fontSize: 11, color: '#6B7280' }}>
                                    {newFoto
                                        ? <><span style={{ fontWeight: 600, color: '#111827' }}>{newFoto.name}</span> · {(newFoto.size / 1024 / 1024).toFixed(2)} MB</>
                                        : 'Foto saat ini · Klik area di bawah untuk mengganti'}
                                </div>
                            </div>
                        </div>

                        {/* Drop zone to replace photo */}
                        <div
                            style={S.dropZone(drag)}
                            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                            onDragLeave={() => setDrag(false)}
                            onDrop={onDrop}
                            onClick={() => fileRef.current?.click()}
                        >
                            <div style={{ width: 36, height: 36, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                                <svg width={17} height={17} viewBox="0 0 16 16" fill="#6B7280"><path d="M8 2v8m-4-3l4 3 4-3M3 13h10" /></svg>
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 3 }}>
                                {newFoto ? 'Ganti foto lagi' : 'Ganti foto'}
                            </div>
                            <div style={{ fontSize: 11, color: '#6B7280' }}>Drag & drop atau klik · JPG, PNG, WebP · maks. 5MB</div>
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />

                        {/* Name field */}
                        <div style={S.fld}>
                            <label style={S.flabel}>Judul / Nama Foto *</label>
                            <input
                                style={S.finput} type="text" value={name} onChange={(e) => setName(e.target.value)} required
                                placeholder="cth. Annual Company Gathering 2026"
                                onFocus={(e) => { e.target.style.borderColor = '#0F6E56'; e.target.style.background = '#fff'; }}
                                onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }}
                            />
                            <div style={{ fontSize: 10, color: '#9CA3AF' }}>Akan tampil sebagai judul foto di gallery</div>
                        </div>

                        {/* Info box */}
                        <div style={{ background: '#E1F5EE', borderRadius: 8, padding: '10px 13px', display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                            <svg width={14} height={14} viewBox="0 0 16 16" fill="#0F6E56" style={{ flexShrink: 0, marginTop: 1 }}><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.5 3h1v5h-1zm0 6h1v1h-1z" /></svg>
                            <div style={{ fontSize: 11, color: '#085041', lineHeight: 1.5 }}>Jika tidak memilih foto baru, foto lama akan tetap digunakan.</div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={S.mftr}>
                        <button type="button" className="ds-btn-sec" onClick={() => navigate('/dashboard/gallery')} disabled={saving}>
                            Batal
                        </button>
                        <button type="submit" className="ds-btn-pri" disabled={saving || !name}>
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
    );
};

export default EditGallery;
