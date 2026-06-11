import React, { useState, useEffect, useCallback } from 'react';
import './PurchaseOrder.css';
import API_BASE_URL from '../config/config';
import useAxiosJWT from '../hooks/useAxiosJWT';

function ModalSupplier({ axiosJWT, editData, onClose, onSuccess }) {
    const isEdit = !!editData;
    const [form, setForm] = useState({
        nama: '', alamat: '', telepon: '',
        email: '', contact_person: '', keterangan: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (editData) setForm({ ...editData });
    }, [editData]);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async () => {
        if (!form.nama.trim()) return alert('Nama supplier wajib diisi.');
        setSaving(true);
        try {
            if (isEdit) {
                await axiosJWT.put(`${API_BASE_URL}/suppliers/${editData.id}`, form);
            } else {
                await axiosJWT.post(`${API_BASE_URL}/suppliers`, form);
            }
            onSuccess();
            onClose();
        } catch (err) {
            alert(err.response?.data?.error || 'Gagal menyimpan supplier.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="po-modal-overlay" onClick={onClose}>
            <div className="po-modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
                <div className="po-mhdr">
                    <span>{isEdit ? 'Edit Supplier' : 'Tambah Supplier'}</span>
                    <button className="po-mclose" onClick={onClose}>✕</button>
                </div>
                <div className="po-mbody">
                    <div className="po-fgrid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <div className="po-fld" style={{ gridColumn: '1 / -1' }}>
                            <label>Nama Supplier <span style={{ color: 'red' }}>*</span></label>
                            <input className="po-inp" value={form.nama}
                                onChange={e => set('nama', e.target.value)} placeholder="PT. Contoh Supplier" />
                        </div>
                        <div className="po-fld">
                            <label>Telepon</label>
                            <input className="po-inp" value={form.telepon}
                                onChange={e => set('telepon', e.target.value)} placeholder="021-12345678" />
                        </div>
                        <div className="po-fld">
                            <label>Email</label>
                            <input className="po-inp" type="email" value={form.email}
                                onChange={e => set('email', e.target.value)} placeholder="supplier@email.com" />
                        </div>
                        <div className="po-fld">
                            <label>Contact Person</label>
                            <input className="po-inp" value={form.contact_person}
                                onChange={e => set('contact_person', e.target.value)} placeholder="Nama PIC" />
                        </div>
                        <div className="po-fld" style={{ gridColumn: '1 / -1' }}>
                            <label>Alamat</label>
                            <textarea className="po-inp" rows={2} value={form.alamat}
                                onChange={e => set('alamat', e.target.value)} placeholder="Alamat lengkap supplier" />
                        </div>
                        <div className="po-fld" style={{ gridColumn: '1 / -1' }}>
                            <label>Keterangan</label>
                            <textarea className="po-inp" rows={2} value={form.keterangan}
                                onChange={e => set('keterangan', e.target.value)} placeholder="Catatan tambahan (opsional)" />
                        </div>
                    </div>
                </div>
                <div className="po-mftr">
                    <button className="po-btn-sec" onClick={onClose}>Batal</button>
                    <button className="po-btn-pri" onClick={handleSubmit} disabled={saving}>
                        {saving ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Tambah Supplier')}
                    </button>
                </div>
            </div>
        </div>
    );
}

const Supplier = () => {
    const { axiosJWT } = useAxiosJWT();
    const [list, setList]         = useState([]);
    const [total, setTotal]       = useState(0);
    const [search, setSearch]     = useState('');
    const [page, setPage]         = useState(0);
    const [modal, setModal]       = useState(false);
    const [editData, setEditData] = useState(null);

    const limit = 10;

    const fetchList = useCallback(async (q, pg) => {
        try {
            const res = await axiosJWT.get(`${API_BASE_URL}/suppliers`, {
                params: { search_query: q, page: pg, limit },
            });
            setList(res.data.response || []);
            setTotal(res.data.totalRows || 0);
        } catch (_) {}
    }, [axiosJWT]);

    useEffect(() => {
        fetchList(search, page);
    }, [search, page, fetchList]);

    const handleDelete = async (id, nama) => {
        if (!window.confirm(`Hapus supplier "${nama}"?`)) return;
        try {
            await axiosJWT.delete(`${API_BASE_URL}/suppliers/${id}`);
            fetchList(search, page);
        } catch (err) {
            alert(err.response?.data?.error || 'Gagal menghapus supplier.');
        }
    };

    const openAdd  = () => { setEditData(null); setModal(true); };
    const openEdit = (row) => { setEditData(row); setModal(true); };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="po-page">
            <div className="po-topbar">
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>Supplier</div>
                    <div style={{ fontSize: 12, color: '#888' }}>Manajemen data supplier</div>
                </div>
                <input
                    className="po-inp"
                    style={{ width: 220 }}
                    placeholder="Cari nama supplier..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(0); }}
                />
                <button className="ds-btn-pri" onClick={openAdd} style={{ fontSize: 11, height: 30, padding: '0 11px' }}>
                    <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" width="12" height="12">
                        <path d="M8 2v12M2 8h12" />
                    </svg>
                    Tambah Supplier
                </button>
            </div>

            <div style={{ padding: '20px 24px', flex: 1 }}>
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E8E8E5', overflow: 'hidden' }}>
                    <table className="po-tbl" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Kode</th>
                                <th>Nama Supplier</th>
                                <th>Telepon</th>
                                <th>Email</th>
                                <th>Contact Person</th>
                                <th>Alamat</th>
                                <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.length === 0 ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#aaa', padding: '32px 0' }}>
                                    Belum ada data supplier
                                </td></tr>
                            ) : list.map((row, i) => (
                                <tr key={row.id}>
                                    <td>{page * limit + i + 1}</td>
                                    <td>{row.kode || '-'}</td>
                                    <td className="po-tbl-name">{row.nama}</td>
                                    <td>{row.telepon || '-'}</td>
                                    <td>{row.email || '-'}</td>
                                    <td>{row.contact_person || '-'}</td>
                                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {row.alamat || '-'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                            <button className="po-act-btn" onClick={() => openEdit(row)}>Edit</button>
                                            <button className="po-act-del" onClick={() => handleDelete(row.id, row.nama)}>Hapus</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                        <button className="po-btn-sec" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
                        <span style={{ lineHeight: '32px', fontSize: 13, color: '#555' }}>
                            {page + 1} / {totalPages}
                        </span>
                        <button className="po-btn-sec" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</button>
                    </div>
                )}
            </div>

            {modal && (
                <ModalSupplier
                    axiosJWT={axiosJWT}
                    editData={editData}
                    onClose={() => setModal(false)}
                    onSuccess={() => fetchList(search, page)}
                />
            )}
        </div>
    );
};

export default Supplier;
