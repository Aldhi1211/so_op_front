import './HomePage.css';
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import React, { useRef, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import API_BASE_URL from '../config/config';

const TEAM_AV_COLORS = [
    { bg: '#B5D4F4', fg: '#0C447C' },
    { bg: '#F5C4B3', fg: '#712B13' },
    { bg: '#CECBF6', fg: '#3C3489' },
    { bg: '#9FE1CB', fg: '#085041' },
    { bg: '#FAEEDA', fg: '#633806' },
    { bg: '#E1F5EE', fg: '#0F6E56' },
    { bg: '#DDD6FE', fg: '#3C3489' },
    { bg: '#FBCFE8', fg: '#DB2777' },
];

const GAL_BG_COLORS = ['#1D9E75','#378ADD','#C0DD97','#FAC775','#3B6D11','#B5D4F4','#888780','#9FE1CB','#0F6E56'];

const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

const getTeamAvColor = (name, idx) => {
    if (!name) return TEAM_AV_COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return TEAM_AV_COLORS[Math.abs(hash) % TEAM_AV_COLORS.length];
};

const PROD_THUMB_COLORS = [
    { bg: '#E1F5EE', stroke: '#1D9E75' },
    { bg: '#EAF3DE', stroke: '#3B6D11' },
    { bg: '#E6F1FB', stroke: '#185FA5' },
    { bg: '#EEEDFE', stroke: '#534AB7' },
    { bg: '#FAEEDA', stroke: '#854F0B' },
    { bg: '#F1EFE8', stroke: '#5F5E5A' },
    { bg: '#FAECE7', stroke: '#993C1D' },
    { bg: '#E1F5EE', stroke: '#0F6E56' },
];

const SERVICES = [
    {
        title: 'Konsultasi Strategi Bisnis',
        desc: 'Analisis mendalam dan perencanaan strategis untuk memastikan bisnis Anda tumbuh secara terarah dan berkelanjutan.',
        icon: <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
    },
    {
        title: 'Pengembangan Teknologi',
        desc: 'Solusi perangkat lunak dan infrastruktur digital yang scalable, aman, dan sesuai kebutuhan operasional bisnis modern.',
        icon: <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
    },
    {
        title: 'Manajemen Operasional',
        desc: 'Optimasi proses bisnis, supply chain, dan SDM agar operasional berjalan efisien dan responsif terhadap perubahan pasar.',
        icon: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
    },
    {
        title: 'Pengembangan SDM',
        desc: 'Program pelatihan, coaching, dan kultur kerja yang memperkuat kapabilitas tim untuk menghadapi tantangan ke depan.',
        icon: <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
    },
    {
        title: 'Strategi Keuangan',
        desc: 'Perencanaan keuangan, pengelolaan arus kas, dan pendampingan investasi untuk memaksimalkan nilai jangka panjang.',
        icon: <svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
    },
    {
        title: 'Ekspansi Pasar',
        desc: 'Riset pasar, penetrasi regional, dan kemitraan strategis untuk membawa produk atau jasa ke pasar yang lebih luas.',
        icon: <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
    },
];

const TESTIMONIALS = [
    {
        quote: '"VerdaCo membantu kami menyusun roadmap digital yang jelas. Dalam 18 bulan, efisiensi operasional kami naik 40% dan biaya overhead turun drastis."',
        name: 'Rizky Hadiman',
        co: 'Direktur Utama, PT Sumber Maju',
        initials: 'RH',
    },
    {
        quote: '"Tim konsultan VerdaCo sangat berpengalaman dan responsif. Mereka benar-benar memahami tantangan industri manufaktur kami dan memberikan solusi tepat sasaran."',
        name: 'Wulan Andriani',
        co: 'VP Operations, Gresik Industries',
        initials: 'WA',
    },
    {
        quote: '"Ekspansi ke 5 kota baru terasa lebih terstruktur dengan pendampingan VerdaCo. Mereka bukan hanya konsultan — mereka bagian dari tim kami."',
        name: 'Fajar Kurniawan',
        co: 'Founder, KafeKita Chain',
        initials: 'FK',
    },
];

const HomePage = () => {
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [contactForm, setContactForm] = useState({ nama: '', email: '', perusahaan: '', pesan: '' });
    const [contactStatus, setContactStatus] = useState(null); // 'sending' | 'success' | 'error'

    const [images, setImages] = useState([]);
    const [teams, setTeams] = useState([]);
    const [products, setProducts] = useState([]);
    const [prodSearch, setProdSearch] = useState('');

    const [token, setToken] = useState(null);
    const [name, setName] = useState(null);
    const [role, setRole] = useState(null);

    // Scroll tracking
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Click outside dropdown
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Auth
    useEffect(() => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            try {
                const decoded = jwtDecode(accessToken);
                setName(decoded.name);
                setRole(decoded.role);
                setToken(accessToken);
            } catch {
                localStorage.removeItem('accessToken');
            }
        }
    }, []);

    const handleLogout = async () => {
        try {
            await axios.delete(`${API_BASE_URL}/logout`);
        } catch {}
        localStorage.removeItem('accessToken');
        setToken(null);
        setName(null);
        setRole(null);
        navigate('/login');
    };

    const handleContactSubmit = async (e) => {
        e.preventDefault();
        const { nama, email, pesan } = contactForm;
        if (!nama.trim() || !email.trim() || !pesan.trim()) return;
        setContactStatus('sending');
        try {
            await axios.post(`${API_BASE_URL}/contacts`, contactForm);
            setContactStatus('success');
            setContactForm({ nama: '', email: '', perusahaan: '', pesan: '' });
            setTimeout(() => setContactStatus(null), 4000);
        } catch {
            setContactStatus('error');
            setTimeout(() => setContactStatus(null), 4000);
        }
    };

    // Fetch data
    useEffect(() => {
        axios.get(`${API_BASE_URL}/gallery?page=0&limit=9`)
            .then(r => setImages(r.data.response || []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        axios.get(`${API_BASE_URL}/teams?page=0&limit=8`)
            .then(r => setTeams(r.data.response || []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        axios.get(`${API_BASE_URL}/product?page=0&limit=6`)
            .then(r => setProducts(r.data.response || []))
            .catch(() => {});
    }, []);

    const scrollTo = (id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        setMobileMenuOpen(false);
    };

    const filteredProducts = products.filter(p =>
        p.name?.toLowerCase().includes(prodSearch.toLowerCase()) ||
        p.description?.toLowerCase().includes(prodSearch.toLowerCase())
    );

    // Gallery item layout pattern
    const getGalClass = (idx) => {
        if (idx === 0) return 'wide';
        if (idx === 1) return 'tall';
        if (idx === 6) return 'wide';
        return '';
    };

    const getGalBg = (item, idx) => {
        if (item.foto) return { backgroundImage: `url(${item.foto})` };
        return { backgroundColor: GAL_BG_COLORS[idx % GAL_BG_COLORS.length] };
    };

    return (
        <div className="hp-site">

            {/* ═══ NAV ═══ */}
            <nav className={`hp-nav${isScrolled ? ' scrolled' : ''}`}>
                <div className="hp-nav-logo" onClick={() => scrollTo('hero')}>
                    PTI<span>.</span>
                </div>
                <ul className="hp-nav-links">
                    <li><a onClick={() => scrollTo('hero')}>Beranda</a></li>
                    <li><a onClick={() => scrollTo('layanan')}>Layanan</a></li>
                    <li><a onClick={() => scrollTo('produk')}>Produk</a></li>
                    <li><a onClick={() => scrollTo('tentang')}>Tentang Kami</a></li>
                    <li><a onClick={() => scrollTo('gallery')}>Galeri</a></li>
                    <li><a onClick={() => scrollTo('kontak')}>Kontak</a></li>
                </ul>
                <div className="hp-nav-right">
                    {!token ? (
                        <Link to="/login" className="hp-nav-cta">Login</Link>
                    ) : (
                        <div className="hp-nav-user" ref={dropdownRef}>
                            <button className="hp-nav-user-btn" onClick={() => setIsDropdownOpen(v => !v)}>
                                {name} ▾
                            </button>
                            {isDropdownOpen && (
                                <div className="hp-nav-dropdown">
                                    {role === 'Admin' && (
                                        <a href="/dashboard/overview">Dashboard</a>
                                    )}
                                    <button onClick={handleLogout}>Logout</button>
                                </div>
                            )}
                        </div>
                    )}
                    <button className="hp-hamburger" onClick={() => setMobileMenuOpen(v => !v)}>
                        <span /><span /><span />
                    </button>
                </div>
            </nav>

            {/* Mobile menu */}
            <div className={`hp-mobile-menu${mobileMenuOpen ? ' open' : ''}`}>
                <a onClick={() => scrollTo('hero')}>Beranda</a>
                <a onClick={() => scrollTo('layanan')}>Layanan</a>
                <a onClick={() => scrollTo('produk')}>Produk</a>
                <a onClick={() => scrollTo('tentang')}>Tentang Kami</a>
                <a onClick={() => scrollTo('gallery')}>Galeri</a>
                <a onClick={() => scrollTo('kontak')}>Kontak</a>
                {!token ? (
                    <a onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}>Login</a>
                ) : (
                    <>
                        {role === 'Admin' && <a href="/dashboard/overview">Dashboard</a>}
                        <a onClick={handleLogout}>Logout</a>
                    </>
                )}
            </div>

            {/* ═══ HERO ═══ */}
            <section id="hero" className="hp-hero">
                <div className="hp-hero-left">
                    <div className="hp-hero-tag">Solusi Bisnis Terpercaya</div>
                    <h1 className="hp-hero-title">
                        Kami Membangun<br />
                        <em>Masa Depan</em><br />
                        Bersama Anda
                    </h1>
                    <p className="hp-hero-desc">
                        PT Pangan Terbaik Indonesia adalah mitra strategis pertumbuhan bisnis Anda.
                        Kami menyediakan solusi inovatif yang mendorong efisiensi, profitabilitas,
                        dan keberlanjutan jangka panjang.
                    </p>
                    <div className="hp-hero-actions">
                        <button className="hp-btn-primary" onClick={() => scrollTo('layanan')}>
                            Pelajari Layanan Kami
                        </button>
                        <button className="hp-btn-outline" onClick={() => scrollTo('gallery')}>
                            Lihat Galeri
                        </button>
                    </div>
                </div>
                <div className="hp-hero-right">
                    <div className="hp-hero-visual">
                        <div className="hp-hero-card">
                            <div className="hp-hc-label">Pertumbuhan Revenue</div>
                            <div className="hp-hc-value">+127%</div>
                            <div className="hp-hc-sub">YoY dibanding tahun lalu</div>
                            <div className="hp-hc-bar">
                                <div className="hp-hc-bar-fill" style={{ width: '73%' }} />
                            </div>
                        </div>
                        <div className="hp-hero-mini">
                            <div className="hp-mini-card">
                                <div className="hp-mc-num">850+</div>
                                <div className="hp-mc-txt">Klien Aktif</div>
                            </div>
                            <div className="hp-mini-card">
                                <div className="hp-mc-num">14 th</div>
                                <div className="hp-mc-txt">Pengalaman</div>
                            </div>
                            <div className="hp-mini-card">
                                <div className="hp-mc-num">98%</div>
                                <div className="hp-mc-txt">Kepuasan Klien</div>
                            </div>
                            <div className="hp-mini-card">
                                <div className="hp-mc-num">32</div>
                                <div className="hp-mc-txt">Kota Operasi</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ STATS ═══ */}
            <div className="hp-stats">
                <div className="hp-stat-item">
                    <div className="hp-stat-num">1.200+</div>
                    <div className="hp-stat-lbl">Proyek Selesai</div>
                </div>
                <div className="hp-stat-item">
                    <div className="hp-stat-num">850+</div>
                    <div className="hp-stat-lbl">Klien di Seluruh Indonesia</div>
                </div>
                <div className="hp-stat-item">
                    <div className="hp-stat-num">180+</div>
                    <div className="hp-stat-lbl">Tenaga Ahli Profesional</div>
                </div>
                <div className="hp-stat-item">
                    <div className="hp-stat-num">14 th</div>
                    <div className="hp-stat-lbl">Berdiri & Berkembang</div>
                </div>
            </div>

            {/* ═══ LAYANAN ═══ */}
            <section id="layanan" className="hp-section">
                <div className="hp-section-header">
                    <div className="hp-sec-eyebrow">Apa yang Kami Tawarkan</div>
                    <h2 className="hp-sec-title">
                        Layanan Unggulan untuk <em>Pertumbuhan Nyata</em>
                    </h2>
                </div>
                <div className="hp-svc-grid">
                    {SERVICES.map((svc, i) => (
                        <div className="hp-svc-card" key={i}>
                            <div className="hp-svc-icon">{svc.icon}</div>
                            <div className="hp-svc-title">{svc.title}</div>
                            <div className="hp-svc-desc">{svc.desc}</div>
                        </div>
                    ))}
                </div>
            </section>

            <div className="hp-divider" />

            {/* ═══ PRODUK ═══ */}
            <section id="produk" className="hp-section">
                <div className="hp-prod-header">
                    <div>
                        <div className="hp-sec-eyebrow">Produk & Paket Layanan</div>
                        <h2 className="hp-sec-title">
                            Solusi untuk <em>Setiap Skala</em> Bisnis
                        </h2>
                    </div>
                    <div className="hp-search-box">
                        <svg viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Cari produk..."
                            value={prodSearch}
                            onChange={e => setProdSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="hp-prod-grid">
                    {filteredProducts.length === 0 && (
                        <div className="hp-prod-empty">
                            {prodSearch ? 'Tidak ada produk yang cocok dengan pencarian Anda.' : 'Belum ada produk tersedia.'}
                        </div>
                    )}
                    {filteredProducts.map((product, idx) => {
                        const thumb = PROD_THUMB_COLORS[idx % PROD_THUMB_COLORS.length];
                        const hasImage = product.images && product.images.trim && product.images.trim() !== '';
                        return (
                            <div className="hp-prod-card" key={product.id || idx}>
                                <div
                                    className="hp-pc-thumb"
                                    style={hasImage
                                        ? { backgroundImage: `url(${product.images})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                                        : { background: thumb.bg }
                                    }
                                >
                                    {!hasImage && (
                                        <svg width="56" height="56" viewBox="0 0 24 24" fill="none"
                                            stroke={thumb.stroke} strokeWidth="1.2"
                                            strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                            <line x1="12" y1="22.08" x2="12" y2="12" />
                                        </svg>
                                    )}
                                </div>
                                <div className="hp-pc-body">
                                    <div className="hp-pc-name">{product.name}</div>
                                    <div className="hp-pc-desc">{product.description}</div>
                                    {product.specs && product.specs.length > 0 && (
                                        <ul className="hp-pc-feats">
                                            {product.specs.slice(0, 3).map((spec, si) => (
                                                <li key={si}>{spec.spesification}</li>
                                            ))}
                                        </ul>
                                    )}
                                    <div className="hp-pc-footer">
                                        {product.link_whatsapp && (
                                            <a
                                                href={product.link_whatsapp}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hp-pc-btn"
                                            >
                                                Hubungi
                                            </a>
                                        )}
                                        {product.link_tokped && (
                                            <a
                                                href={product.link_tokped}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hp-pc-btn-ol"
                                            >
                                                Beli
                                            </a>
                                        )}
                                        {!product.link_whatsapp && !product.link_tokped && (
                                            <button className="hp-pc-btn" onClick={() => scrollTo('kontak')}>
                                                Lihat Detail
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="hp-count-bar">
                    <span className="hp-count-txt">
                        Menampilkan <span className="hp-count-num">{filteredProducts.length}</span> produk
                    </span>
                </div>
            </section>

            <div className="hp-divider" />

            {/* ═══ TENTANG ═══ */}
            <div id="tentang" className="hp-about">
                <div className="hp-about-left">
                    <div style={{ width: '100%', aspectRatio: '4/3', borderRadius: '12px', overflow: 'hidden', background: '#C0DD97' }}>
                        <div className="hp-about-photo-grid" style={{ margin: 0, padding: '16px', width: '100%', height: '100%' }}>
                            <div className="hp-aphoto" style={{ background: '#9FE1CB' }} />
                            <div className="hp-aphoto" style={{ background: '#5DCAA5' }} />
                            <div className="hp-aphoto" style={{ background: '#1D9E75' }} />
                            <div className="hp-aphoto" style={{ background: '#0F6E56' }} />
                        </div>
                    </div>
                </div>
                <div className="hp-about-right">
                    <div className="hp-sec-eyebrow">Tentang Kami</div>
                    <h2 className="hp-sec-title" style={{ fontSize: '28px' }}>
                        Didirikan atas <em>kepercayaan</em>, tumbuh bersama klien
                    </h2>
                    <p className="hp-about-desc">
                        PT Pangan Terbaik Indonesia adalah salah satu distributor, eksportir, dan pemasok
                        komoditas terbesar di Indonesia sejak berdiri. Perusahaan kami mengkhususkan diri
                        dalam ekspor ke pasar internasional, namun juga mendistribusikan produk ke pasar
                        domestik. Produk kami berasal dari seluruh penjuru Indonesia.
                    </p>
                    <ul className="hp-values-list">
                        <li><div className="hp-v-dot" />Integritas sebagai fondasi dari setiap keputusan dan hubungan bisnis.</li>
                        <li><div className="hp-v-dot" />Komitmen untuk selalu memberikan yang terbaik kepada pelanggan kami.</li>
                        <li><div className="hp-v-dot" />Kualitas dibuktikan dengan produk dan layanan yang memuaskan pelanggan.</li>
                        <li><div className="hp-v-dot" />Dampak nyata dan terukur sebagai standar keberhasilan setiap proyek.</li>
                    </ul>
                </div>
            </div>

            {/* ═══ TIM ═══ */}
            <section className="hp-section">
                <div className="hp-section-header">
                    <div className="hp-sec-eyebrow">Orang-orang di Balik Kami</div>
                    <h2 className="hp-sec-title">Tim Kami</h2>
                </div>
                <div className="hp-team-grid">
                    {teams.map((team, idx) => {
                        const av = getTeamAvColor(team.name, idx);
                        const hasPhoto = team.foto && team.foto.trim() !== '';
                        return (
                            <div className="hp-team-card" key={team.id || idx}>
                                <div
                                    className="hp-team-avatar"
                                    style={hasPhoto ? {} : { background: av.bg, color: av.fg }}
                                >
                                    {hasPhoto
                                        ? <img src={team.foto} alt={team.name} />
                                        : getInitials(team.name)
                                    }
                                </div>
                                <div className="hp-team-name">{team.name}</div>
                                <div className="hp-team-role">{team.jabatan}</div>
                                {(team.instagram || team.linkedin || team.fb) && (
                                    <div className="hp-team-links">
                                        {team.instagram && (
                                            <a href={team.instagram} target="_blank" rel="noopener noreferrer">IG</a>
                                        )}
                                        {team.linkedin && (
                                            <a href={team.linkedin} target="_blank" rel="noopener noreferrer">LI</a>
                                        )}
                                        {team.fb && (
                                            <a href={team.fb} target="_blank" rel="noopener noreferrer">FB</a>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            <div className="hp-divider" />

            {/* ═══ GALLERY ═══ */}
            <section id="gallery" className="hp-section">
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px' }}>
                    <div>
                        <div className="hp-sec-eyebrow">Dokumentasi Perusahaan</div>
                        <h2 className="hp-sec-title">Galeri <em>Kami</em></h2>
                    </div>
                </div>
                <div className="hp-gal-grid">
                    {images.map((image, idx) => {
                        const galClass = getGalClass(idx);
                        const bgStyle = getGalBg(image, idx);
                        return (
                            <div className={`hp-gal-item${galClass ? ' ' + galClass : ''}`} key={image.id || idx}>
                                <div className="hp-gal-photo" style={bgStyle}>
                                    {!image.foto && (
                                        <div className="hp-gal-placeholder">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                                                stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeLinecap="round">
                                                <rect x="3" y="9" width="18" height="13" rx="2" />
                                                <path d="M8 9V7a4 4 0 018 0v2" />
                                            </svg>
                                        </div>
                                    )}
                                    <div className="hp-gal-overlay" />
                                    <div className="hp-gal-info">
                                        <div className="hp-gal-title">{image.name}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {images.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: '#9CA3AF', fontSize: '14px' }}>
                            Belum ada foto galeri.
                        </div>
                    )}
                </div>
            </section>

            {/* ═══ TESTIMONI ═══ */}
            <div className="hp-testi">
                <div className="hp-testi-eyebrow">Apa Kata Mereka</div>
                <h2 className="hp-testi-title">Dipercaya oleh ratusan pemimpin bisnis</h2>
                <div className="hp-testi-grid">
                    {TESTIMONIALS.map((t, i) => (
                        <div className="hp-testi-card" key={i}>
                            <div className="hp-testi-quote">{t.quote}</div>
                            <div className="hp-testi-author">
                                <div className="hp-ta-avatar">{t.initials}</div>
                                <div>
                                    <div className="hp-ta-name">{t.name}</div>
                                    <div className="hp-ta-co">{t.co}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ═══ KONTAK ═══ */}
            <div id="kontak" className="hp-contact">
                <div className="hp-contact-left">
                    <div className="hp-sec-eyebrow">Hubungi Kami</div>
                    <h2 className="hp-sec-title" style={{ fontSize: '28px' }}>
                        Siap memulai <em>perjalanan bersama</em>?
                    </h2>
                    <p className="hp-contact-desc">
                        Kami siap membantu bisnis Anda tumbuh. Hubungi tim kami untuk konsultasi awal tanpa biaya.
                    </p>
                    <div className="hp-ci-item">
                        <div className="hp-ci-icon">
                            <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        </div>
                        <div>
                            <div className="hp-ci-label">Alamat Kantor</div>
                            <div className="hp-ci-value">Jakarta, Indonesia</div>
                        </div>
                    </div>
                    <div className="hp-ci-item">
                        <div className="hp-ci-icon">
                            <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>
                        </div>
                        <div>
                            <div className="hp-ci-label">Telepon</div>
                            <div className="hp-ci-value">+62 21 0000 0000</div>
                        </div>
                    </div>
                    <div className="hp-ci-item">
                        <div className="hp-ci-icon">
                            <svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                        </div>
                        <div>
                            <div className="hp-ci-label">Email</div>
                            <div className="hp-ci-value">hello@pti.id</div>
                        </div>
                    </div>
                </div>
                <div className="hp-contact-right">
                    <form onSubmit={handleContactSubmit}>
                        <div className="hp-form-row">
                            <label>Nama Lengkap *</label>
                            <input
                                type="text"
                                placeholder="Contoh: Budi Santoso"
                                value={contactForm.nama}
                                onChange={e => setContactForm(f => ({ ...f, nama: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="hp-form-row">
                            <label>Alamat Email *</label>
                            <input
                                type="email"
                                placeholder="budi@perusahaan.com"
                                value={contactForm.email}
                                onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="hp-form-row">
                            <label>Nama Perusahaan</label>
                            <input
                                type="text"
                                placeholder="PT / CV / ..."
                                value={contactForm.perusahaan}
                                onChange={e => setContactForm(f => ({ ...f, perusahaan: e.target.value }))}
                            />
                        </div>
                        <div className="hp-form-row">
                            <label>Pesan *</label>
                            <textarea
                                placeholder="Ceritakan kebutuhan bisnis Anda..."
                                value={contactForm.pesan}
                                onChange={e => setContactForm(f => ({ ...f, pesan: e.target.value }))}
                                required
                            />
                        </div>

                        {contactStatus === 'success' && (
                            <div style={{
                                background: '#E1F5EE', color: '#085041', border: '0.5px solid #6FD8B8',
                                borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 12
                            }}>
                                Pesan berhasil dikirim! Kami akan segera menghubungi Anda.
                            </div>
                        )}
                        {contactStatus === 'error' && (
                            <div style={{
                                background: '#FCEBEB', color: '#791F1F', border: '0.5px solid #F5A5A5',
                                borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 12
                            }}>
                                Gagal mengirim pesan. Silakan coba lagi.
                            </div>
                        )}

                        <button
                            type="submit"
                            className="hp-form-submit"
                            disabled={contactStatus === 'sending'}
                        >
                            {contactStatus === 'sending' ? 'Mengirim...' : 'Kirim Pesan'}
                        </button>
                    </form>
                </div>
            </div>

            {/* ═══ FOOTER ═══ */}
            <footer className="hp-footer">
                <div className="hp-footer-logo">PTI<span>.</span></div>
                <div className="hp-footer-copy">© {new Date().getFullYear()} PT Pangan Terbaik Indonesia. Semua hak dilindungi.</div>
                <div className="hp-footer-links">
                    <a>Kebijakan Privasi</a>
                    <a>Syarat & Ketentuan</a>
                    <a>Karir</a>
                </div>
            </footer>

        </div>
    );
};

export default HomePage;
