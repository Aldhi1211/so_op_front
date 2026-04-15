import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../config/config";

const S = {
    page: { padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: 600, margin: '0 auto' },
    card: { background: '#fff', border: '1px solid #E8E8E5', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    mhdr: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E8E8E5' },
    mbody: { padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 },
    mftr: { display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '14px 20px', borderTop: '1px solid #E8E8E5' },
    fgrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    fld: { display: 'flex', flexDirection: 'column', gap: 4 },
    flabel: { fontSize: 11, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' },
    finput: { fontSize: 13, padding: '8px 11px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#F9FAFB', color: '#111827', fontFamily: 'inherit', outline: 'none' },
};

const EditTeams = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ name: '', jabatan: '', fb: '', instagram: '', linkedin: '', description: '' });
    const [teamsData, setTeamsData] = useState(null);
    const [newFoto, setNewFoto] = useState(null);
    const [fotoPreview, setFotoPreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const fotoRef = useRef(null);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/teams/${id}`);
                const t = res.data;
                setTeamsData(t);
                setFormData({ name: t.name || '', jabatan: t.jabatan || '', fb: t.fb || '', instagram: t.instagram || '', linkedin: t.linkedin || '', description: t.description || '' });
                setFotoPreview(t.foto || null);
            } catch (err) {
                console.error("Error fetching teams:", err.message);
            }
        };
        fetchTeams();
    }, [id]);

    const handleChange = (e) => setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleFoto = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setNewFoto(file);
        setFotoPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = new FormData();
            Object.entries(formData).forEach(([k, v]) => data.append(k, v));
            if (newFoto) {
                data.append('foto', newFoto);
            } else {
                data.append('foto', teamsData.foto || '');
            }
            await axios.patch(`${API_BASE_URL}/teams/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
            navigate('/dashboard/teams', { state: { successMessage: 'Anggota tim berhasil diperbarui!' } });
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Gagal memperbarui anggota.');
        } finally {
            setSaving(false);
        }
    };

    if (!teamsData) {
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
                    onClick={() => navigate('/dashboard/teams')}
                    style={{ width: 32, height: 32, border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', flexShrink: 0 }}
                >
                    <svg width={14} height={14} viewBox="0 0 16 16" fill="currentColor"><path d="M10 3L5 8l5 5" /></svg>
                </button>
                <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Edit Anggota Tim</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Perbarui informasi anggota</div>
                </div>
            </div>

            {/* Form Card */}
            <div style={S.card}>
                {/* Header */}
                <div style={S.mhdr}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, background: '#E1F5EE', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width={15} height={15} viewBox="0 0 16 16" fill="#0F6E56"><path d="M8 1a3 3 0 100 6 3 3 0 000-6zM3 13c0-2.5 2-4 5-4s5 1.5 5 4v1H3v-1z" /></svg>
                        </div>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Informasi Anggota</div>
                            <div style={{ fontSize: 11, color: '#6B7280' }}>Ubah data anggota tim di bawah ini</div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={S.mbody}>
                        {/* Photo upload */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottom: '1px solid #E8E8E5' }}>
                            <div
                                style={{ width: 56, height: 56, borderRadius: '50%', border: '1.5px dashed #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0, background: fotoPreview ? 'transparent' : '#F4F5F7' }}
                                onClick={() => fotoRef.current?.click()}
                            >
                                {fotoPreview
                                    ? <img src={fotoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <svg width={20} height={20} viewBox="0 0 16 16" fill="#9CA3AF"><path d="M8 1a3 3 0 100 6 3 3 0 000-6zM3 13c0-2.5 2-4 5-4s5 1.5 5 4v1H3v-1z" /></svg>}
                            </div>
                            <div>
                                <div style={{ fontSize: 12, color: '#374151', fontWeight: 600, marginBottom: 2 }}>Foto Profil</div>
                                <div style={{ fontSize: 11, color: '#6B7280' }}>Klik foto untuk mengganti · JPG, PNG · maks. 5MB</div>
                            </div>
                            <input ref={fotoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFoto} />
                        </div>

                        {/* Name & Jabatan */}
                        <div style={S.fgrid}>
                            <div style={S.fld}>
                                <label style={S.flabel}>Nama Lengkap *</label>
                                <input
                                    style={S.finput} name="name" value={formData.name} onChange={handleChange} required placeholder="cth. Siti Rahayu"
                                    onFocus={(e) => { e.target.style.borderColor = '#0F6E56'; e.target.style.background = '#fff'; }}
                                    onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }}
                                />
                            </div>
                            <div style={S.fld}>
                                <label style={S.flabel}>Jabatan *</label>
                                <input
                                    style={S.finput} name="jabatan" value={formData.jabatan} onChange={handleChange} required placeholder="cth. Frontend Developer"
                                    onFocus={(e) => { e.target.style.borderColor = '#0F6E56'; e.target.style.background = '#fff'; }}
                                    onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }}
                                />
                            </div>
                            <div style={S.fld}>
                                <label style={S.flabel}>Facebook</label>
                                <input
                                    style={S.finput} name="fb" value={formData.fb} onChange={handleChange} placeholder="URL Facebook"
                                    onFocus={(e) => { e.target.style.borderColor = '#0F6E56'; e.target.style.background = '#fff'; }}
                                    onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }}
                                />
                            </div>
                            <div style={S.fld}>
                                <label style={S.flabel}>LinkedIn</label>
                                <input
                                    style={S.finput} name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="URL LinkedIn"
                                    onFocus={(e) => { e.target.style.borderColor = '#0F6E56'; e.target.style.background = '#fff'; }}
                                    onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }}
                                />
                            </div>
                            <div style={{ ...S.fld, gridColumn: '1 / -1' }}>
                                <label style={S.flabel}>Instagram</label>
                                <input
                                    style={S.finput} name="instagram" value={formData.instagram} onChange={handleChange} placeholder="@username"
                                    onFocus={(e) => { e.target.style.borderColor = '#0F6E56'; e.target.style.background = '#fff'; }}
                                    onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }}
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div style={S.fld}>
                            <label style={S.flabel}>Bio / Deskripsi</label>
                            <textarea
                                style={{ ...S.finput, minHeight: 80, resize: 'vertical', lineHeight: 1.5 }}
                                name="description" value={formData.description} onChange={handleChange}
                                placeholder="Tuliskan deskripsi singkat anggota…"
                                onFocus={(e) => { e.target.style.borderColor = '#0F6E56'; e.target.style.background = '#fff'; }}
                                onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; }}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={S.mftr}>
                        <button type="button" className="ds-btn-sec" onClick={() => navigate('/dashboard/teams')} disabled={saving}>
                            Batal
                        </button>
                        <button type="submit" className="ds-btn-pri" disabled={saving || !formData.name || !formData.jabatan}>
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

export default EditTeams;
