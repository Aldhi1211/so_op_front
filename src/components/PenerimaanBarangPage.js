import React, { useState, useEffect, useCallback } from 'react';
import './Dashboard.css';
import './PurchaseOrder.css';
import API_BASE_URL from '../config/config';
import useAxiosJWT from '../hooks/useAxiosJWT';

// ── helpers ────────────────────────────────────────────────────
const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    : '-';

const fmtRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

const PB_STATUS = {
    selesai: { cls: 'po-bdg-done',    label: 'Selesai' },
    partial: { cls: 'po-bdg-partial', label: 'Sebagian' },
    waiting: { cls: 'po-bdg-waiting', label: 'Menunggu Verifikasi' },
    ditolak: { cls: 'po-bdg-cancel',  label: 'Ditolak' },
};

function StatusBadge({ st }) {
    const s = PB_STATUS[st] || { cls: '', label: st };
    return <span className={`po-bdg ${s.cls}`}><span className="po-bdg-dot" />{s.label}</span>;
}

// ── Modal: Catat Penerimaan ────────────────────────────────────
function ModalCatatPenerimaan({ axiosJWT, onClose, onSuccess }) {
    const [poList, setPoList]     = useState([]);
    const [selectedPO, setSelectedPO] = useState('');
    const [poDetail, setPoDetail] = useState(null);
    const [form, setForm]         = useState({
        tanggal_terima: new Date().toISOString().split('T')[0],
        no_surat_jalan: '', no_invoice: '',
        diterima_oleh: '', gudang: 'Gudang Utama', catatan: '',
    });
    const [qtyMap, setQtyMap]   = useState({});
    const [kondisiMap, setKMap] = useState({});
    const [nomorGRN, setNomor]  = useState('...');
    const [saving, setSaving]   = useState(false);

    useEffect(() => {
        axiosJWT.get(`${API_BASE_URL}/penerimaan/next-nomor`)
            .then(r => setNomor(r.data.nomor_grn)).catch(() => {});

        axiosJWT.get(`${API_BASE_URL}/purchase-orders`, { params: { limit: 100 } })
            .then(r => {
                const list = (r.data.response || []).filter(p => ['approved', 'partial'].includes(p.status));
                setPoList(list);
            }).catch(() => {});
    }, []);

    const loadPODetail = async (id) => {
        if (!id) { setPoDetail(null); setSelectedPO(''); return; }
        try {
            const res = await axiosJWT.get(`${API_BASE_URL}/purchase-orders/${id}`);
            setPoDetail(res.data);
            setSelectedPO(id);
            const qm = {}, km = {};
            (res.data.items || []).forEach(i => {
                qm[i.id] = i.quantity - i.qty_diterima;
                km[i.id] = 'Baik';
            });
            setQtyMap(qm);
            setKMap(km);
        } catch { alert('Gagal memuat detail PO.'); }
    };

    const handleSubmit = async () => {
        if (!selectedPO) return alert('Pilih PO terlebih dahulu.');
        if (!form.tanggal_terima) return alert('Tanggal terima wajib diisi.');
        setSaving(true);
        try {
            const items = (poDetail.items || []).map(i => ({
                id_po_item:        i.id,
                id_barang:         i.id_barang,
                quantity_po:       i.quantity - i.qty_diterima,
                quantity_diterima: Number(qtyMap[i.id] ?? (i.quantity - i.qty_diterima)),
                satuan:            i.satuan,
                kondisi:           kondisiMap[i.id] || 'Baik',
                harga_satuan:      i.harga_satuan,
            }));
            await axiosJWT.post(`${API_BASE_URL}/penerimaan`, {
                id_po: selectedPO, ...form, items,
            });
            onSuccess();
            onClose();
        } catch (err) {
            alert(err.response?.data?.error || 'Gagal mencatat penerimaan.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="po-modal-overlay">
            <div className="po-modal">
                <div className="po-mhdr">
                    <div className="po-mhdr-l">
                        <div className="po-mhdr-icon" style={{ background: '#E1F5EE' }}>
                            <svg viewBox="0 0 16 16" fill="#0F6E56"><path d="M8 2v8m-4-4l4 4 4-4M3 13h10" /></svg>
                        </div>
                        <div>
                            <div className="po-mhdr-title">Catat Penerimaan Barang</div>
                            <div className="po-mhdr-sub">
                                No. GRN: {nomorGRN}{poDetail ? ` · Ref. ${poDetail.nomor_po}` : ''}
                            </div>
                        </div>
                    </div>
                    <button className="po-mclose" onClick={onClose}>✕</button>
                </div>

                <div className="po-mbody">
                    {/* Pilih PO */}
                    <div className="po-sec-lbl">Pilih Purchase Order</div>
                    <div className="po-fld po-fld-full">
                        <label>Referensi PO <span className="po-req">*</span></label>
                        <select className="po-inp" value={selectedPO}
                            onChange={e => loadPODetail(e.target.value)}>
                            <option value="">-- Pilih PO (Approved / Penerimaan Sebagian) --</option>
                            {poList.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.nomor_po} · {p.supplier?.nama} · {fmtDate(p.tanggal_po)}
                                </option>
                            ))}
                        </select>
                        {poList.length === 0 && (
                            <span className="po-hint">Tidak ada PO berstatus Approved. Buat dan approve PO terlebih dahulu.</span>
                        )}
                    </div>

                    {poDetail && (
                        <div className="po-ref-banner">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="#0F6E56"><path d="M2 8l4 4 8-8" /></svg>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#085041' }}>
                                    {poDetail.nomor_po} · {poDetail.supplier?.nama}
                                </div>
                                <div style={{ fontSize: 11, color: '#0F6E56' }}>
                                    {poDetail.status} · {fmtDate(poDetail.tanggal_po)} · {poDetail.items?.length} item · Total {fmtRp(poDetail.total_nilai)}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="po-divider" />
                    <div className="po-sec-lbl">Informasi Penerimaan</div>
                    <div className="po-fgrid">
                        <div className="po-fld">
                            <label>No. GRN</label>
                            <input type="text" value={nomorGRN} readOnly className="po-inp po-inp-ro" />
                            <span className="po-hint">Auto-generate oleh sistem</span>
                        </div>
                        <div className="po-fld">
                            <label>Tanggal Penerimaan <span className="po-req">*</span></label>
                            <input type="date" value={form.tanggal_terima} className="po-inp"
                                onChange={e => setForm(f => ({ ...f, tanggal_terima: e.target.value }))} />
                        </div>
                        <div className="po-fld">
                            <label>No. Surat Jalan</label>
                            <input type="text" value={form.no_surat_jalan} className="po-inp"
                                placeholder="No. surat jalan supplier"
                                onChange={e => setForm(f => ({ ...f, no_surat_jalan: e.target.value }))} />
                        </div>
                        <div className="po-fld">
                            <label>No. Invoice Supplier</label>
                            <input type="text" value={form.no_invoice} className="po-inp"
                                placeholder="No. invoice"
                                onChange={e => setForm(f => ({ ...f, no_invoice: e.target.value }))} />
                        </div>
                        <div className="po-fld">
                            <label>Diterima Oleh</label>
                            <input type="text" value={form.diterima_oleh} className="po-inp"
                                placeholder="Nama penerima"
                                onChange={e => setForm(f => ({ ...f, diterima_oleh: e.target.value }))} />
                        </div>
                        <div className="po-fld">
                            <label>Gudang Penerima</label>
                            <select className="po-inp" value={form.gudang}
                                onChange={e => setForm(f => ({ ...f, gudang: e.target.value }))}>
                                <option>Gudang Utama</option>
                                <option>Gudang Cabang Surabaya</option>
                                <option>Gudang Bandung</option>
                            </select>
                        </div>
                    </div>

                    {poDetail && (poDetail.items || []).length > 0 && (
                        <>
                            <div className="po-divider" />
                            <div className="po-items-hdr">
                                <div className="po-sec-lbl">Detail Barang Diterima</div>
                                <div style={{ fontSize: 11, color: '#6B7280' }}>Sesuaikan qty aktual yang diterima</div>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="po-item-tbl">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '28%' }}>Barang</th>
                                            <th style={{ width: '11%' }}>Sisa PO</th>
                                            <th style={{ width: '13%' }}>Qty Diterima</th>
                                            <th style={{ width: '11%' }}>Selisih</th>
                                            <th style={{ width: '10%' }}>Satuan</th>
                                            <th style={{ width: '14%' }}>Kondisi</th>
                                            <th style={{ width: '13%' }}>Harga Sat.</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {poDetail.items.map(i => {
                                            const sisa    = i.quantity - i.qty_diterima;
                                            const terima  = Number(qtyMap[i.id] ?? sisa);
                                            const selisih = terima - sisa;
                                            return (
                                                <tr key={i.id}>
                                                    <td className="po-item-name">{i.barang?.name || '-'}</td>
                                                    <td className="po-item-muted">{sisa}</td>
                                                    <td>
                                                        <input className="po-item-inp" type="number"
                                                            min="0" max={sisa} value={qtyMap[i.id] ?? sisa}
                                                            onChange={e => setQtyMap(m => ({ ...m, [i.id]: Number(e.target.value) }))} />
                                                    </td>
                                                    <td style={{ fontWeight: 600, color: selisih < 0 ? '#A32D2D' : '#0F6E56' }}>
                                                        {selisih === 0 ? '0' : selisih > 0 ? `+${selisih}` : selisih}
                                                    </td>
                                                    <td className="po-item-muted">{i.satuan}</td>
                                                    <td>
                                                        <select className="po-item-sel po-item-sel-sm"
                                                            value={kondisiMap[i.id] || 'Baik'}
                                                            onChange={e => setKMap(m => ({ ...m, [i.id]: e.target.value }))}>
                                                            <option>Baik</option>
                                                            <option>Rusak Sebagian</option>
                                                            <option>Ditolak</option>
                                                        </select>
                                                    </td>
                                                    <td className="po-item-muted">
                                                        {Number(i.harga_satuan).toLocaleString('id-ID')}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {poDetail.items.some(i => (qtyMap[i.id] ?? (i.quantity - i.qty_diterima)) < (i.quantity - i.qty_diterima)) && (
                                <div className="po-alert-warning">
                                    <svg viewBox="0 0 16 16" fill="#854F0B" width="13" height="13"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.5 4h1v4h-1zm0 5h1v1h-1z" /></svg>
                                    <p>Ada barang yang diterima kurang dari jumlah PO. Status PO akan otomatis menjadi Penerimaan Sebagian.</p>
                                </div>
                            )}
                        </>
                    )}

                    <div className="po-divider" />
                    <div className="po-fld po-fld-full">
                        <label>Catatan Penerimaan</label>
                        <textarea className="po-inp po-textarea"
                            placeholder="Catatan kondisi barang, selisih, atau informasi lainnya…"
                            value={form.catatan}
                            onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))} />
                    </div>
                </div>

                <div className="po-mftr">
                    <div style={{ fontSize: 11, color: '#6B7280' }}>
                        {poDetail ? `${poDetail.items?.length} item · Ref. ${poDetail.nomor_po}` : 'Pilih PO terlebih dahulu'}
                    </div>
                    <div style={{ display: 'flex', gap: 7 }}>
                        <button className="ds-btn-ghost" onClick={onClose} disabled={saving}>Batal</button>
                        <button className="ds-btn-pri" onClick={handleSubmit} disabled={saving || !selectedPO}>
                            <svg viewBox="0 0 16 16" fill="white"><path d="M2 8l4 4 8-8" /></svg>
                            {saving ? 'Menyimpan…' : 'Simpan & Update Stok'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── main page ──────────────────────────────────────────────────
const PenerimaanBarangPage = () => {
    const { token, axiosJWT } = useAxiosJWT();
    const [pbList, setPbList]   = useState([]);
    const [total, setTotal]     = useState(0);
    const [chip, setChip]       = useState('');
    const [modal, setModal]     = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchPB = useCallback(async (status) => {
        setLoading(true);
        try {
            const params = status ? { status, limit: 20 } : { limit: 20 };
            const res = await axiosJWT.get(`${API_BASE_URL}/penerimaan`, { params });
            setPbList(res.data.response || []);
            setTotal(res.data.totalRows || 0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [axiosJWT]);

    useEffect(() => {
        if (token) fetchPB('');
    }, [token]);

    useEffect(() => {
        if (token) fetchPB(chip);
    }, [chip]);

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus data penerimaan ini?')) return;
        try {
            await axiosJWT.delete(`${API_BASE_URL}/penerimaan/${id}`);
            fetchPB(chip);
        } catch (err) {
            alert(err.response?.data?.error || 'Gagal menghapus penerimaan.');
        }
    };

    const CHIPS = [
        { label: 'Semua',                val: '' },
        { label: 'Selesai',              val: 'selesai' },
        { label: 'Sebagian',             val: 'partial' },
        { label: 'Menunggu Verifikasi',  val: 'waiting' },
        { label: 'Ditolak',              val: 'ditolak' },
    ];

    return (
        <>
            {modal && (
                <ModalCatatPenerimaan
                    axiosJWT={axiosJWT}
                    onClose={() => setModal(false)}
                    onSuccess={() => fetchPB(chip)}
                />
            )}

            <div className="po-page">
                <div className="po-topbar">
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Penerimaan Barang</div>
                    <div style={{ flex: 1 }} />
                    <button className="ds-btn-sec">
                        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 14V6m-4 4l4-4 4 4M3 3h10" /></svg>
                        Export
                    </button>
                    <button className="ds-btn-pri" onClick={() => setModal(true)}>
                        <svg viewBox="0 0 16 16" fill="white"><path d="M8 2v12M2 8h12" /></svg>
                        Catat Penerimaan
                    </button>
                </div>

                <div className="po-content">
                    {/* stat cards */}
                    <div className="po-sc-grid">
                        <div className="po-sc">
                            <div className="po-sc-icon" style={{ background: '#E1F5EE' }}>
                                <svg viewBox="0 0 18 18" fill="#0F6E56"><path d="M9 2v10M5 8l4 4 4-4M3 15h12" /></svg>
                            </div>
                            <div>
                                <div className="po-sc-lbl">Total Penerimaan</div>
                                <div className="po-sc-val">{total}</div>
                            </div>
                        </div>
                        <div className="po-sc">
                            <div className="po-sc-icon" style={{ background: '#E1F5EE' }}>
                                <svg viewBox="0 0 18 18" fill="#0F6E56"><path d="M1 9l6 6L17 3" /></svg>
                            </div>
                            <div>
                                <div className="po-sc-lbl">Selesai</div>
                                <div className="po-sc-val" style={{ color: '#0F6E56' }}>
                                    {pbList.filter(p => p.status === 'selesai').length}
                                </div>
                            </div>
                        </div>
                        <div className="po-sc">
                            <div className="po-sc-icon" style={{ background: '#FAEEDA' }}>
                                <svg viewBox="0 0 18 18" fill="#854F0B"><path d="M9 1a8 8 0 100 16A8 8 0 009 1zm-.5 4h1v5h-1zm0 6h1v1h-1z" /></svg>
                            </div>
                            <div>
                                <div className="po-sc-lbl">Menunggu Verifikasi</div>
                                <div className="po-sc-val" style={{ color: '#854F0B' }}>
                                    {pbList.filter(p => p.status === 'waiting').length}
                                </div>
                            </div>
                        </div>
                        <div className="po-sc">
                            <div className="po-sc-icon" style={{ background: '#EEEDFE' }}>
                                <svg viewBox="0 0 18 18" fill="#534AB7"><path d="M9 1a8 8 0 100 16A8 8 0 009 1zm-.5 4h1v5h-1zm0 6h1v1h-1z" /></svg>
                            </div>
                            <div>
                                <div className="po-sc-lbl">Sebagian</div>
                                <div className="po-sc-val" style={{ color: '#534AB7' }}>
                                    {pbList.filter(p => p.status === 'partial').length}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* table card */}
                    <div className="po-card">
                        <div className="po-ch">
                            <div className="po-ch-l">
                                <div className="po-ch-icon" style={{ background: '#E1F5EE' }}>
                                    <svg viewBox="0 0 16 16" fill="#0F6E56"><path d="M8 2v8m-4-4l4 4 4-4M3 13h10" /></svg>
                                </div>
                                <div>
                                    <div className="po-ct">Riwayat Penerimaan Barang</div>
                                    <div className="po-cs">{total} penerimaan total</div>
                                </div>
                            </div>
                            <button className="ds-btn-pri" style={{ fontSize: 11 }} onClick={() => setModal(true)}>
                                <svg viewBox="0 0 16 16" fill="white"><path d="M8 2v12M2 8h12" /></svg>
                                Catat Penerimaan
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
                                        <th>No. GRN</th>
                                        <th>Ref. PO</th>
                                        <th>Supplier</th>
                                        <th>Tgl. Terima</th>
                                        <th>No. Surat Jalan</th>
                                        <th>No. Invoice</th>
                                        <th>Diterima Oleh</th>
                                        <th>Status</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && (
                                        <tr><td colSpan={9} style={{ textAlign: 'center', padding: 24, color: '#9CA3AF' }}>Memuat data…</td></tr>
                                    )}
                                    {!loading && pbList.length === 0 && (
                                        <tr><td colSpan={9} style={{ textAlign: 'center', padding: 24, color: '#9CA3AF' }}>Belum ada data penerimaan</td></tr>
                                    )}
                                    {!loading && pbList.map(r => (
                                        <tr key={r.id}>
                                            <td className="po-tbl-no po-tbl-green">{r.nomor_grn}</td>
                                            <td className="po-tbl-no po-tbl-blue">{r.po?.nomor_po || '-'}</td>
                                            <td className="po-tbl-name">{r.po?.supplier?.nama || '-'}</td>
                                            <td className="po-tbl-muted">{fmtDate(r.tanggal_terima)}</td>
                                            <td className="po-tbl-muted">{r.no_surat_jalan || '-'}</td>
                                            <td className="po-tbl-muted">{r.no_invoice || '-'}</td>
                                            <td className="po-tbl-muted">{r.diterima_oleh || '-'}</td>
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
                                Total <strong style={{ color: '#111827' }}>{total}</strong> penerimaan
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PenerimaanBarangPage;
