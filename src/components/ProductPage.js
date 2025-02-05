import logoWhite from '../assets/iconpti.png';
import logoBlack from '../assets/iconpti.png';
import blogImage from '../assets/blog1.jpg'; // Impor gambar
import videoIndonesia from '../assets/video-indonesia.mp4';
import './HomePage.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import React, { useRef, useEffect, useState } from "react";


const ProductPage = () => {
    const tombolMenuRef = useRef(null); // Ref untuk tombol menu
    const menuRef = useRef(null); // Ref untuk menu
    const [isMenuVisible, setMenuVisible] = useState(false); // State untuk toggle menu
    const [isScrolled, setIsScrolled] = useState(false); // State untuk melacak apakah halaman di-scroll

    const [products, setProduct] = useState([]);

    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(10);  // Jumlah item per halaman
    const [pages, setPages] = useState(0);  // Total halaman
    const [rows, setRows] = useState(0);  // Total halaman
    const [keyword, setKeyword] = useState("");  // Total halaman


    // Referensi untuk slider dan elemen slide
    const sliderRef = useRef(null);
    const slideRef = useRef([]);

    useEffect(() => {
        const width = window.innerWidth;
        if (width < 990) {
            handleMobileMenu();
        }
    }, []);

    const handleResize = () => {
        const width = window.innerWidth;

        if (width > 989) {
            // Tampilkan menu secara default jika lebar layar lebih dari 989px
            if (menuRef.current) {
                menuRef.current.style.display = "block";
            }
        } else {
            // Sembunyikan menu jika lebar layar kurang dari 990px
            if (menuRef.current) {
                menuRef.current.style.display = isMenuVisible ? "block" : "none";
            }
        }
    };

    // Hook untuk mengatur event listener resize
    useEffect(() => {
        // Panggil handleResize saat komponen pertama kali dimuat
        handleResize();

        // Tambahkan event listener resize
        window.addEventListener("resize", handleResize);

        // Bersihkan event listener saat komponen dilepas
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [isMenuVisible]); // Dependency pada isMenuVisible agar menu menyesuaikan status

    useEffect(() => {
        window.addEventListener("scroll", handleScroll); // Tambahkan event listener saat komponen dimuat

        // Bersihkan event listener saat komponen dilepas
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    // Fungsi untuk menangani klik tombol menu
    const handleClick = () => {
        setMenuVisible(!isMenuVisible); // Toggle visibility state
    };

    // Fungsi untuk menangani toggle menu di perangkat mobile
    const handleMobileMenu = () => {
        const menu = menuRef.current;

        if (menu) {
            // Set toggle logic jika klik terjadi
            menu.addEventListener("click", () => {
                setMenuVisible(false); // Menutup menu jika salah satu item diklik
            });
        }
    };

    const handleScroll = () => {
        const scrollPos = window.scrollY; // Mendapatkan posisi scroll
        if (scrollPos > 0) {
            setIsScrolled(true); // Jika posisi scroll lebih dari 0, tambahkan kelas
        } else {
            setIsScrolled(false); // Jika posisi scroll kembali ke atas, hapus kelas
        }
    };

    // State untuk melacak accordion yang terbuka
    const [isOpen, setIsOpen] = useState(false);
    const [isOpen2, setIsOpen2] = useState(false);


    // Fungsi toggle untuk setiap accordion
    const toggleAccordion = () => {
        console.log("Accordion clicked");
        setIsOpen((prev) => !prev);
    };

    const toggleAccordion2 = () => {
        console.log("Accordion clicked");
        setIsOpen2((prev) => !prev);
    };


    const axiosJWT = axios.create();


    const getProduct = async () => {
        const response = await axiosJWT.get(`http://localhost:5000/api/product?search_query=${keyword}&page=${page}&limit=100`,
            {
                // headers: {
                //     Authorization: `Bearer ${token}`
                // }
            }
        );
        console.log(response.data);

        setProduct(response.data.response);

    };

    useEffect(() => {
        getProduct();
    }, [page, keyword]);

    const [isMenuVisibleLogin, setMenuVisibleLogin] = useState(false);
    const [token, setToken] = useState(null);
    const [name, setName] = useState(null);
    const [role, setRole] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const accessToken = localStorage.getItem("accessToken");
        if (accessToken) {
            try {
                const decoded = jwtDecode(accessToken);
                setName(decoded.name);
                setRole(decoded.role);
                setToken(accessToken);
            } catch (error) {
                console.error("Invalid token:", error);
                localStorage.removeItem("accessToken");
            }
        }
    }, []);

    const handleLogout = async () => {
        try {
            await axios.delete("http://localhost:5000/api/logout");
            localStorage.removeItem("accessToken");
            setToken(null);
            setName(null);
            setRole(null);
            navigate("/login");
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Fungsi untuk toggle dropdown saat nama diklik
    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    // Menutup dropdown jika klik di luar elemen dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


    return (
        <div>
            <nav className={isScrolled ? "putih" : ""}>
                <div className="layar-dalam">
                    <div className="logo">
                        <a href="#home">
                            <img
                                src={isScrolled ? logoBlack : logoWhite} // Pilih logo berdasarkan `isScrolled`
                                className='putih'
                                alt="Logo"
                            />
                        </a>
                    </div>
                    <div className="menu">
                        <a
                            ref={tombolMenuRef}
                            href="#"
                            className="tombol-menu"
                            onClick={handleClick}
                        >
                            <span className='garis'></span>
                            <span className='garis'></span>
                            <span className='garis'></span>
                        </a>
                        <ul ref={menuRef}
                            className={isMenuVisible ? "active" : ""}
                            style={{
                                display: isMenuVisible ? "block" : "none", // Menyesuaikan tampilan menu
                            }}>
                            <li> <a href="/homepage/#home">Home</a></li>
                            <li> <a href="/homepage/#aboutus">About Us</a></li>
                            <li> <a href="/homepage/#support">Support</a></li>
                            <li> <a href="/homepage/#gallery">Gallery</a></li>
                            <li> <a href="/homepage/#team">Team</a></li>
                            <li> <a href="#blog">Product</a></li>
                            <li> <a href="/homepage/#contact">Contact</a></li>
                            {/* Login / User Dropdown */}
                            <li ref={dropdownRef}>
                                {!token ? (
                                    <a href="/login">Login</a>
                                ) : (
                                    <div className="dropdown-container">
                                        <span className="dropdown-toggle" onClick={toggleDropdown}>{name} ▼</span>
                                        {isDropdownOpen && (
                                            <ul className="dropdown-menu">
                                                {role === "Admin" && (
                                                    <li><a className='mt-4' href="/dashboard">Dashboard</a></li>
                                                )}
                                                <li><button onClick={handleLogout}>Logout</button></li>
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
            <div className="layar-penuh">
                <header id='home'>
                    <div className="overlay"></div>
                    <video autoPlay muted loop>
                        <source src={videoIndonesia} type='video/mp4'></source>
                    </video>
                    <div className="intro">
                        <h3>
                            OUR PRODUCT !
                        </h3>
                        <p>
                            Lets Check Our Product
                        </p>
                    </div>
                </header>
                <main>
                    <section id='blog' className='abuabu'>
                        <div className="layar-dalam">
                            <h3>Our Product</h3>
                            <p className='ringkasan'>Let’s Check Our Products!</p>
                            {Array.isArray(products) && products.map((product, index) => (
                                <div className='blog'>
                                    <div className='area'>
                                        <div
                                            className="gambar"
                                            style={{
                                                backgroundImage: `url(${product.images})`

                                            }}
                                        ></div>
                                        <div className="text">
                                            <article>
                                                <h4><a href="#">{product.name}</a></h4>
                                                <p>{product.description}</p>

                                                <div className="specs" onClick={toggleAccordion}>
                                                    <div className="spesifikasi">
                                                        <div className="judul">
                                                            Spesifikasi
                                                            <span className={`icon ${isOpen ? "open" : ""}`}>{isOpen ? "-" : "+"}</span>
                                                        </div>
                                                        <div
                                                            className="list"
                                                            style={{
                                                                maxHeight: isOpen ? "200px" : "0",
                                                                opacity: isOpen ? "1" : "0",
                                                                transition: "max-height 0.4s ease, opacity 0.4s ease",
                                                            }}
                                                        >
                                                            {product.specs && product.specs.length > 0 ? (
                                                                <ol>
                                                                    {product.specs.map((spec, idx) => (
                                                                        <li key={idx}>{`${idx + 1}. ${spec.spesification}`}</li>
                                                                    ))}
                                                                </ol>
                                                            ) : (
                                                                <ol>
                                                                    <li>No Spesification</li>
                                                                </ol>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="specs" onClick={toggleAccordion2}>
                                                    <div className="spesifikasi">
                                                        <div className="judul">
                                                            Custom
                                                            <span className={`icon ${isOpen2 ? "open" : ""}`}>{isOpen2 ? "-" : "+"}</span>
                                                        </div>
                                                        <div
                                                            className="list"
                                                            style={{
                                                                maxHeight: isOpen2 ? "200px" : "0",
                                                                opacity: isOpen2 ? "1" : "0",
                                                                transition: "max-height 0.4s ease, opacity 0.4s ease",
                                                            }}
                                                        >
                                                            {product.customs && product.customs.length > 0 ? (
                                                                <ol>
                                                                    {product.customs.map((custom, idx) => (
                                                                        <li key={idx}>{`${idx + 1}. ${custom.custom}`}</li>
                                                                    ))}
                                                                </ol>
                                                            ) : (
                                                                <ol>
                                                                    <li>No Customs</li>
                                                                </ol>
                                                            )}

                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="button-container">
                                                    {/* <!-- Contact Us Button --> */}
                                                    <a href={product.link_whatsapp} class="custom-button whatsapp">
                                                        CONTACT US
                                                        <i class="fa-brands fa-whatsapp"></i>
                                                    </a>

                                                    {/* <!-- Buy Now Button --> */}
                                                    <a href={product.link_tokped} class="custom-button tokopedia">
                                                        BUY NOW
                                                        <img src="https://assets.tokopedia.net/assets-tokopedia-lite/v2/arael/kratos/0c292173.png" alt="Tokopedia" class="icon-tokopedia" />
                                                    </a>
                                                </div>
                                            </article>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </main>
                <footer id='contact'>
                    <div className="layar-dalam">
                        <div>
                            <h5>Info</h5>
                            For any inquiries please WhatsApp or Email

                        </div>
                        <div>
                            <h5>Contact</h5>
                            <span>
                                <i class="fa-solid fa-envelope"></i>
                                &nbsp; panganterbaikindonesia@gmail.com
                            </span>
                            <span>
                                <i class="fa-solid fa-envelope"></i>
                                &nbsp; deni@panganterbaikindonesia.com
                            </span>
                            <span>
                                <i class="fa-brands fa-whatsapp"></i>
                                &nbsp; Deni : +628973539372
                            </span>

                        </div>
                    </div>
                    <div className="layar-dalam">
                        <div className="copyright">
                            &copy; 2024 Pangan Terbaik Indonesia
                        </div>
                    </div>
                </footer>
            </div>
        </div>

    );
};

export default ProductPage;
