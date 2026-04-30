import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Dashboard.css';
import './PurchaseOrder.css';
import API_BASE_URL from '../config/config';
import useAxiosJWT from '../hooks/useAxiosJWT';

// ── helpers ────────────────────────────────────────────────────
const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    : '-';

const fmtRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

const PO_STATUS = {
    draft:    { cls: 'po-bdg-draft',    label: 'Draft' },
    waiting:  { cls: 'po-bdg-waiting',  label: 'Menunggu Approval' },
    approved: { cls: 'po-bdg-approved', label: 'Approved' },
    partial:  { cls: 'po-bdg-partial',  label: 'Penerimaan Sebagian' },
    done:     { cls: 'po-bdg-done',     label: 'Selesai' },
    cancel:   { cls: 'po-bdg-cancel',   label: 'Dibatalkan' },
};

function StatusBadge({ st }) {
    const s = PO_STATUS[st] || { cls: '', label: st };
    return <span className={`po-bdg ${s.cls}`}><span className="po-bdg-dot" />{s.label}</span>;
}

// ── Modal: Buat PO ─────────────────────────────────────────────
function ModalCreatePO({ axiosJWT, suppliers, barangList, onClose, onSuccess }) {
    const [form, setForm] = useState({
        id_supplier: '', tanggal_po: new Date().toISOString().split('T')[0],
        tanggal_diharapkan: '', gudang_tujuan: 'Gudang Utama',
        metode_pembayaran: 'Transfer Bank', mata_uang: 'IDR', catatan: '',
    });
    const [rows, setRows]     = useState([{ id: 1, id_barang: '', quantity: 1, satuan: 'Unit', harga_satuan: 0 }]);
    const [nomorPO, setNomor] = useState('...');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        axiosJWT.get(`${API_BASE_URL}/purchase-orders/next-nomor`)
            .then(r => setNomor(r.data.nomor_po)).catch(() => {});
    }, []);

    const addRow    = () => setRows(r => [...r, { id: Date.now(), id_barang: '', quantity: 1, satuan: 'Unit', harga_satuan: 0 }]);
    const updateRow = (id, field, val) => setRows(r => r.map(x => x.id === id ? { ...x, [field]: val } : x));
    const removeRow = (id) => setRows(r => r.filter(x => x.id !== id));

    const subtotal = rows.reduce((s, r) => s + r.quantity * r.harga_satuan, 0);
    const ppn      = subtotal * 0.11;
    const total    = subtotal + ppn;

    const handleSubmit = async (submitStatus) => {
        if (!form.id_supplier) return alert('Supplier wajib dipilih.');
        const validItems = rows.filter(r => r.id_barang && r.quantity > 0);
        if (validItems.length === 0) return alert('Minimal 1 item barang harus diisi.');
        setSaving(true);
        try {
            await axiosJWT.post(`${API_BASE_URL}/purchase-orders`, {
                ...form, status: submitStatus,
                items: validItems.map(r => ({
                    id_barang: Number(r.id_barang), quantity: Number(r.quantity),
                    satuan: r.satuan, harga_satuan: Number(r.harga_satuan),
                })),
            });
            onSuccess();
            onClose();
        } catch (err) {
            alert(err.response?.data?.error || 'Gagal membuat PO.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="po-modal-overlay">
            <div className="po-modal">
                <div className="po-mhdr">
                    <div className="po-mhdr-l">
                        <div className="po-mhdr-icon" style={{ background: '#E6F1FB' }}>
                            <svg viewBox="0 0 16 16" fill="#185FA5"><path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm1 2v8h8V4H4zm1 1h6v1H5zm0 2h4v1H5zm0 2h6v1H5z" /></svg>
                        </div>
                        <div>
                            <div className="po-mhdr-title">Buat Purchase Order Baru</div>
                            <div className="po-mhdr-sub">No. PO akan di-generate otomatis: {nomorPO}</div>
                        </div>
                    </div>
                    <button className="po-mclose" onClick={onClose}>✕</button>
                </div>

                <div className="po-mbody">
                    <div className="po-sec-lbl">Informasi PO</div>
                    <div className="po-fgrid">
                        <div className="po-fld">
                            <label>Nomor PO</label>
                            <input type="text" value={nomorPO} readOnly className="po-inp po-inp-ro" />
                            <span className="po-hint">Di-generate otomatis oleh sistem</span>
                        </div>
                        <div className="po-fld">
                            <label>Tanggal PO <span className="po-req">*</span></label>
                            <input type="date" value={form.tanggal_po} className="po-inp"
                                onChange={e => setForm(f => ({ ...f, tanggal_po: e.target.value }))} />
                        </div>
                        <div className="po-fld po-fld-full">
                            <label>Supplier <span className="po-req">*</span></label>
                            <select className="po-inp" value={form.id_supplier}
                                onChange={e => setForm(f => ({ ...f, id_supplier: e.target.value }))}>
                                <option value="">-- Pilih Supplier --</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
                            </select>
                        </div>
                        <div className="po-fld">
                            <label>Tanggal Diharapkan</label>
                            <input type="date" value={form.tanggal_diharapkan} className="po-inp"
                                onChange={e => setForm(f => ({ ...f, tanggal_diharapkan: e.target.value }))} />
                        </div>
                        <div className="po-fld">
                            <label>Gudang Tujuan</label>
                            <select className="po-inp" value={form.gudang_tujuan}
                                onChange={e => setForm(f => ({ ...f, gudang_tujuan: e.target.value }))}>
                                <option>Gudang Utama</option>
                                <option>Gudang Cabang Surabaya</option>
                                <option>Gudang Bandung</option>
                            </select>
                        </div>
                        <div className="po-fld">
                            <label>Metode Pembayaran</label>
                            <select className="po-inp" value={form.metode_pembayaran}
                                onChange={e => setForm(f => ({ ...f, metode_pembayaran: e.target.value }))}>
                                <option>Transfer Bank</option>
                                <option>COD</option>
                                <option>Net 30</option>
                                <option>Net 60</option>
                            </select>
                        </div>
                        <div className="po-fld">
                            <label>Mata Uang</label>
                            <select className="po-inp" value={form.mata_uang}
                                onChange={e => setForm(f => ({ ...f, mata_uang: e.target.value }))}>
                                <option value="IDR">IDR (Rupiah)</option>
                                <option value="USD">USD</option>
                            </select>
                        </div>
                    </div>

                    <div className="po-divider" />

                    <div className="po-items-hdr">
                        <div className="po-sec-lbl">Daftar Barang yang Dipesan</div>
                        <button className="ds-btn-sec" style={{ fontSize: 11 }} onClick={addRow}>
                            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 2v12M2 8h12" /></svg>
                            Tambah Barang
                        </button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="po-item-tbl">
                            <thead>
                                <tr>
                                    <th style={{ width: '32%' }}>Nama Barang</th>
                                    <th style={{ width: '10%' }}>Qty</th>
                                    <th style={{ width: '10%' }}>Satuan</th>
                                    <th style={{ width: '18%' }}>Harga Satuan (Rp)</th>
                                    <th style={{ width: '16%' }}>Subtotal (Rp)</th>
                                    <th style={{ width: '6%' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(r => (
                                    <tr key={r.id}>
                                        <td>
                                            <select className="po-item-sel" value={r.id_barang}
                                                onChange={e => updateRow(r.id, 'id_barang', e.target.value)}>
                                                <option value="">Pilih barang…</option>
                                                {barangList.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                            </select>
                                        </td>
                                        <td><input className="po-item-inp" type="number" min="1" value={r.quantity}
                                            onChange={e => updateRow(r.id, 'quantity', Number(e.target.value))} /></td>
                                        <td><input className="po-item-inp" type="text" value={r.satuan}
                                            onChange={e => updateRow(r.id, 'satuan', e.target.value)} /></td>
                                        <td><input className="po-item-inp" type="number" min="0" value={r.harga_satuan}
                                            onChange={e => updateRow(r.id, 'harga_satuan', Number(e.target.value))} /></td>
                                        <td><input className="po-item-inp po-item-sub" type="text"
                                            value={(r.quantity * r.harga_satuan).toLocaleString('id-ID')} readOnly /></td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button className="po-act-btn po-act-del" onClick={() => removeRow(r.id)}>
                                                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 4h10l-1 10H4L3 4zm3-3h4v2H6V1zm-4 3h12" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div className="po-summary">
                            <div className="po-sum-row"><span>Subtotal</span><span>{fmtRp(subtotal)}</span></div>
                            <div className="po-sum-row"><span>PPN (11%)</span><span>{fmtRp(ppn)}</span></div>
                            <div className="po-divider" style={{ margin: '6px 0' }} />
                            <div className="po-sum-row po-sum-total"><span>Total</span><span>{fmtRp(total)}</span></div>
                        </div>
                    </div>

                    <div className="po-divider" />
                    <div className="po-fld po-fld-full">
                        <label>Catatan</label>
                        <textarea className="po-inp po-textarea" placeholder="Catatan tambahan…"
                            value={form.catatan} onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))} />
                    </div>
                </div>

                <div className="po-mftr">
                    <div style={{ fontSize: 11, color: '#6B7280' }}>{rows.length} barang · Total {fmtRp(total)} (incl. PPN)</div>
                    <div style={{ display: 'flex', gap: 7 }}>
                        <button className="ds-btn-ghost" onClick={onClose} disabled={saving}>Batal</button>
                        <button className="ds-btn-sec" onClick={() => handleSubmit('draft')} disabled={saving}>
                            Simpan sebagai Draft
                        </button>
                        <button className="po-btn-orange" onClick={() => handleSubmit('waiting')} disabled={saving}>
                            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.5 4h1v4h-1zm0 5h1v1h-1z" /></svg>
                            Kirim untuk Approval
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── main component ─────────────────────────────────────────────
const PurchaseOrder = () => {
    const { token, axiosJWT } = useAxiosJWT();
    const [modal, setModal]           = useState(false);
    const [poList, setPoList]         = useState([]);
    const [suppliers, setSuppliers]   = useState([]);
    const [barangList, setBarangList] = useState([]);
    const [poTotal, setPoTotal]       = useState(0);
    const [chip, setChip]             = useState('');
    const [loading, setLoading]       = useState(false);

    const fetchPO = useCallback(async (status) => {
        setLoading(true);
        try {
            const params = status ? { status, limit: 20 } : { limit: 20 };
            const res = await axiosJWT.get(`${API_BASE_URL}/purchase-orders`, { params });
            setPoList(res.data.response || []);
            setPoTotal(res.data.totalRows || 0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [axiosJWT]);

    const fetchSuppliers = useCallback(async () => {
        try {
            const res = await axiosJWT.get(`${API_BASE_URL}/suppliers`, { params: { limit: 100 } });
            setSuppliers(res.data.response || []);
        } catch {}
    }, [axiosJWT]);

    const fetchBarang = useCallback(async () => {
        try {
            const res = await axiosJWT.get(`${API_BASE_URL}/barang`);
            setBarangList(Array.isArray(res.data) ? res.data : res.data.response || []);
        } catch {}
    }, [axiosJWT]);

    useEffect(() => {
        if (!token) return;
        fetchPO('');
        fetchSuppliers();
        fetchBarang();
    }, [token]);

    useEffect(() => {
        if (token) fetchPO(chip);
    }, [chip]);

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus PO ini?')) return;
        try {
            await axiosJWT.delete(`${API_BASE_URL}/purchase-orders/${id}`);
            fetchPO(chip);
        } catch (err) {
            alert(err.response?.data?.error || 'Gagal menghapus PO.');
        }
    };

    const CHIPS = [
        { label: 'Semua',                val: '' },
        { label: 'Draft',                val: 'draft' },
        { label: 'Menunggu Approval',    val: 'waiting' },
        { label: 'Approved',             val: 'approved' },
        { label: 'Penerimaan Sebagian',  val: 'partial' },
        { label: 'Selesai',              val: 'done' },
        { label: 'Dibatalkan',           val: 'cancel' },
    ];

    return (
        <>
            {modal && (
                <ModalCreatePO
                    axiosJWT={axiosJWT} suppliers={suppliers} barangList={barangList}
                    onClose={() => setModal(false)}
                    onSuccess={() => fetchPO(chip)}
                />
            )}

            <div className="po-page">
                <div className="po-topbar">
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Purchase Order</div>
                    <div style={{ flex: 1 }} />
                    <button className="ds-btn-sec">
                        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 14V6m-4 4l4-4 4 4M3 3h10" /></svg>
                        Export
                    </button>
                    <button className="ds-btn-pri" onClick={() => setModal(true)}>
                        <svg viewBox="0 0 16 16" fill="white"><path d="M8 2v12M2 8h12" /></svg>
                        Buat PO Baru
                    </button>
                </div>

                <div className="po-content">
                    {/* stat cards */}
                    <div className="po-sc-grid">
                        <div className="po-sc">
                            <div className="po-sc-icon" style={{ background: '#E6F1FB' }}>
                                <svg viewBox="0 0 18 18" fill="#185FA5"><path d="M2 2h14v2H2zm0 4h14v2H2zm0 4h10v2H2z" /></svg>
                            </div>
                            <div>
                                <div className="po-sc-lbl">Total PO</div>
                                <div className="po-sc-val">{poTotal}</div>
                            </div>
                        </div>
                        <div className="po-sc">
                            <div className="po-sc-icon" style={{ background: '#EEEDFE' }}>
                                <svg viewBox="0 0 18 18" fill="#534AB7"><path d="M9 1a8 8 0 100 16A8 8 0 009 1zm-.5 4h1v5h-1zm0 6h1v1h-1z" /></svg>
                            </div>
                            <div>
                                <div className="po-sc-lbl">Menunggu Approval</div>
                                <div className="po-sc-val" style={{ color: '#534AB7' }}>
                                    {poList.filter(p => p.status === 'waiting').length}
                                </div>
                            </div>
                        </div>
                        <div className="po-sc">
                            <div className="po-sc-icon" style={{ background: '#FAEEDA' }}>
                                <svg viewBox="0 0 18 18" fill="#854F0B"><path d="M9 1a8 8 0 100 16A8 8 0 009 1zm-.5 4h1v5h-1zm0 6h1v1h-1z" /></svg>
                            </div>
                            <div>
                                <div className="po-sc-lbl">Penerimaan Sebagian</div>
                                <div className="po-sc-val" style={{ color: '#854F0B' }}>
                                    {poList.filter(p => p.status === 'partial').length}
                                </div>
                            </div>
                        </div>
                        <div className="po-sc">
                            <div className="po-sc-icon" style={{ background: '#E1F5EE' }}>
                                <svg viewBox="0 0 18 18" fill="#0F6E56"><path d="M1 9l6 6L17 3" /></svg>
                            </div>
                            <div>
                                <div className="po-sc-lbl">Approved</div>
                                <div className="po-sc-val" style={{ color: '#0F6E56' }}>
                                    {poList.filter(p => p.status === 'approved').length}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* table card */}
                    <div className="po-card">
                        <div className="po-ch">
                            <div className="po-ch-l">
                                <div className="po-ch-icon" style={{ background: '#E6F1FB' }}>
                                    <svg viewBox="0 0 16 16" fill="#185FA5"><path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm1 2v8h8V4H4z" /></svg>
                                </div>
                                <div>
                                    <div className="po-ct">Daftar Purchase Order</div>
                                    <div className="po-cs">{poTotal} PO total</div>
                                </div>
                            </div>
                            <button className="ds-btn-pri" style={{ fontSize: 11 }} onClick={() => setModal(true)}>
                                <svg viewBox="0 0 16 16" fill="white"><path d="M8 2v12M2 8h12" /></svg>
                                Buat PO Baru
                            </button>
                        </div>

                        <div className="po-fbar">
                            {CHIPS.map(c => (
                                <button key={c.val} className={`po-chip${chip === c.val ? ' po-chip-on' : ''}`}
                                    onClick={() => setChip(c.val)}>
                                    {c.label}
                                </button>
                            ))}
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table className="po-tbl">
                                <thead>
                                    <tr>
                                        <th>No. PO</th><th>Tgl. PO</th><th>Supplier</th>
                                        <th>Total Nilai</th><th>Tgl. Diharapkan</th>
                                        <th>Dibuat Oleh</th><th>Status</th><th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && (
                                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24, color: '#9CA3AF' }}>Memuat data…</td></tr>
                                    )}
                                    {!loading && poList.length === 0 && (
                                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24, color: '#9CA3AF' }}>Belum ada Purchase Order</td></tr>
                                    )}
                                    {!loading && poList.map(r => (
                                        <tr key={r.id}>
                                            <td className="po-tbl-no po-tbl-blue">{r.nomor_po}</td>
                                            <td className="po-tbl-muted">{fmtDate(r.tanggal_po)}</td>
                                            <td className="po-tbl-name">{r.supplier?.nama || '-'}</td>
                                            <td className="po-tbl-val">{fmtRp(r.total_nilai)}</td>
                                            <td className="po-tbl-muted">{fmtDate(r.tanggal_diharapkan)}</td>
                                            <td className="po-tbl-muted">{r.dibuat_oleh || '-'}</td>
                                            <td><StatusBadge st={r.status} /></td>
                                            <td>
                                                <div className="po-act-row">
                                                    <button className="po-act-btn po-act-del" title="Hapus"
                                                        onClick={() => handleDelete(r.id)}>
                                                        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 4h10l-1 10H4L3 4zm3-3h4v2H6V1zm-4 3h12" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="po-pg-bar">
                            <div style={{ fontSize: 11, color: '#6B7280' }}>
                                Total <strong style={{ color: '#111827' }}>{poTotal}</strong> PO
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PurchaseOrder;
