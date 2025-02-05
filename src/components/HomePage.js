import logoWhite from '../assets/iconpti.png';
import logoBlack from '../assets/iconpti.png';
import blogImage from '../assets/blog1.jpg'; // Impor gambar
import videoIndonesia from '../assets/video-indonesia.mp4';
import './HomePage.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import React, { useRef, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";


const HomePage = () => {
    const tombolMenuRef = useRef(null); // Ref untuk tombol menu
    const menuRef = useRef(null); // Ref untuk menu
    const [isMenuVisible, setMenuVisible] = useState(false); // State untuk toggle menu
    const [isScrolled, setIsScrolled] = useState(false); // State untuk melacak apakah halaman di-scroll

    const [images, setImage] = useState([]);
    const [teams, setTeam] = useState([]);
    const [products, setProduct] = useState([]);

    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(10);  // Jumlah item per halaman
    const [pages, setPages] = useState(0);  // Total halaman
    const [rows, setRows] = useState(0);  // Total halaman
    const [keyword, setKeyword] = useState("");  // Total halaman


    // Referensi untuk slider dan elemen slide
    const sliderRef = useRef(null);
    const slideRef = useRef([]);
    // Fungsi untuk menangani pergeseran slide ke kanan (Next)
    const handleNext = () => {
        setImage((prevImages) => {
            const firstImage = prevImages[0];
            return [...prevImages.slice(1), firstImage];
        });
    };

    // Fungsi untuk menangani pergeseran slide ke kiri (Prev)
    const handlePrev = () => {
        setImage((prevImages) => {
            const lastImage = prevImages[prevImages.length - 1];
            return [lastImage, ...prevImages.slice(0, prevImages.length - 1)];
        });
    };


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

    useEffect(() => {
        getGallery();
    }, [page, keyword]);

    useEffect(() => {
        setPage(0); // Reset page ke 0 setiap kali keyword berubah
    }, [keyword]);

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/gallery", {
                    params: {
                        page: 0,  // halaman pertama
                        limit: 10, // jumlah per halaman
                        search_query: "", // query pencarian, bisa disesuaikan
                    }
                });
                setImage(response.data.response); // Menyimpan data produk
            } catch (error) {
                console.error("Error fetching Gallery", error);
            }
        };

        fetchGallery();
    }, []);


    const axiosJWT = axios.create();



    const getGallery = async () => {
        const response = await axiosJWT.get(`http://localhost:5000/api/gallery?search_query=${keyword}&page=${page}&limit=${limit}`,
            {
                // headers: {
                //     Authorization: `Bearer ${token}`
                // }
            }
        );
        console.log(response.data);

        setImage(response.data.response);
    };

    const getTeams = async () => {
        const response = await axiosJWT.get(`http://localhost:5000/api/teams?search_query=&page=0&limit=3`,
            {
                // headers: {
                //     Authorization: `Bearer ${token}`
                // }
            }
        );
        console.log(response.data);

        setTeam(response.data.response);
    };

    useEffect(() => {
        getTeams();
    }, [page, keyword]);

    const getProduct = async () => {
        const response = await axiosJWT.get(`http://localhost:5000/api/product?search_query=${keyword}&page=${page}&limit=1`,
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

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };
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
                            <li> <a href="#home">Home</a></li>
                            <li> <a href="#aboutus">About Us</a></li>
                            <li> <a href="#support">Support</a></li>
                            <li> <a href="#gallery">Gallery</a></li>
                            <li> <a href="#team">Team</a></li>
                            <li> <a href="#blog">Product</a></li>
                            <li> <a href="#contact">Contact</a></li>

                            {/* Login / User Dropdown */}
                            <li ref={dropdownRef}>
                                {!token ? (
                                    <a href="/login">Login</a>
                                ) : (
                                    isMobile ? (
                                        // Jika mobile, tampilkan sebagai daftar biasa
                                        <>
                                            {role === "Admin" && <li><a href="/dashboard/overview">Dashboard</a></li>}
                                            <li><a onClick={handleLogout}>Logout</a></li>
                                        </>
                                    ) : (
                                        // Jika desktop, gunakan dropdown
                                        <div className="dropdown-container">
                                            <span className="dropdown-toggle" onClick={toggleDropdown}>{name} ▼</span>
                                            {isDropdownOpen && (
                                                <ul className="dropdown-menu">
                                                    {role === "Admin" && <li><a className='mt-4' href="/dashboard/overview">Dashboard</a></li>}
                                                    <li><button onClick={handleLogout}>Logout</button></li>
                                                </ul>
                                            )}
                                        </div>
                                    )
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
                            PT Pangan Terbaik Indonesia
                        </h3>
                        <p>
                            The Leading Supplier of Agricultural Product
                        </p>
                        <p>
                            Supplying across the globe
                        </p>
                    </div>
                </header>
                <main>
                    <section id='aboutus'>
                        <div className="layar-dalam">
                            <h3>About Us</h3>
                            <p className='ringkasan'>We are a food export company!
                            </p>
                            <div className="konten-isi">
                                <p>PT Pangan Terbaik Indonesia is one of the largest
                                    distributors, exporters and suppliers of commodity
                                    in Indonesia since it’s establisment in 2019. Our
                                    company specializes in exporting international markets,
                                    but we also distribute our product to domestic market.
                                    Our product come from all over Indonesia</p>
                            </div>
                        </div>
                    </section>
                    <section className='abuabu' id='support'>
                        <div className="layar-dalam support">
                            <div>
                                <i class="fa-solid fa-hand-holding-heart"></i>
                                <h6>Integrity</h6>
                                <p>Integrity means telling the truth, keeping our word,
                                    and treating others with fairness and respect. Integrity
                                    is one of our most cherisched assets. It must not be
                                    compromised</p>
                            </div>
                            <div>
                                <i class="fa-solid fa-handshake"></i>
                                <h6>Commitment</h6>
                                <p>Commitment is important where we will continue to provide
                                    the best to our customers and investors all the time.
                                    Our opportunity to serve should be viewed as a privilege
                                    that is not tobe taken for granted</p>
                            </div>
                            <div>
                                <i class="fa-solid fa-list-check"></i>
                                <h6>Quality</h6>
                                <p>Quality is exhibited in many ways by selling
                                    and supporting products and service that delight customers,
                                    establishing a work environment, and delivering financial
                                    results that meet investor expectations.</p>
                            </div>
                        </div>
                    </section>
                    <section id='gallery'>
                        <div className="layar-dalam">
                            <h3>Gallery</h3>
                        </div>
                        <div className="container">
                            <div className="slider">
                                {Array.isArray(images) && images.map((image, index) => (

                                    <div
                                        key={image.id}
                                        className="slides"
                                        style={{ backgroundImage: `url(${image.foto})` }}
                                    >
                                        <div className="content">
                                            <h2>{image.name}</h2>
                                        </div>
                                    </div>
                                ))}

                            </div>

                            <div className="buttons">
                                <span className='prev' onClick={handlePrev}></span>
                                <span className='next' onClick={handleNext}></span>
                            </div>
                        </div>
                        {/* <div className="carousel-container">
                            <img
                                src={images[currentIndex]}
                                alt={`Slide ${currentIndex}`}
                                className="carousel-image"
                            />
                        </div> */}

                    </section>
                    <section className='quote'>
                        <div className="layar-dalam">
                            <p>Best Quality Commodity, We are Real Professionals </p>
                        </div>
                    </section>
                    <section id='team'>
                        <div className='layar-dalam'>
                            <h3>Our Team</h3>
                            <p className='ringkasan'>Here Profile Member of PT.Pangan Terbaik Indonesia!</p>
                            <div className='tim'>
                                {Array.isArray(teams) && teams.map((team, index) => (

                                    <div>
                                        <img src={team.foto} alt="" />
                                        <h6>{team.name}</h6>
                                        <p>{team.jabatan}</p>
                                        <ul>
                                            <li>
                                                <a href={team.instagram} target="_blank">
                                                    <i className='fab fa-instagram' style={{ fontSize: '20px', color: 'Black' }}></i>
                                                </a>
                                                <a href={team.linkedin}>
                                                    <i className='fa-brands fa-linkedin' style={{ fontSize: '20px', color: 'Black' }}></i>
                                                </a>
                                                <a href={team.fb}>
                                                    <i className='fa-brands fa-facebook' style={{ fontSize: '20px', color: 'Black' }}></i>
                                                </a>
                                            </li>
                                        </ul>
                                        <p>{team.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                    <section id='blog' className='abuabu'>
                        <div className="layar-dalam">
                            <h3>Our Product</h3>
                            <p className='ringkasan'>Let’s Check Our Products!</p>
                            <div className='blog'>
                                {Array.isArray(products) && products.map((product, index) => (
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

                                ))}

                            </div>
                            <div className="show-more">
                                <a href="/homepage/product/" class="custom-button whatsapp">
                                    SHOW MORE PRODUCT
                                    <i class="fa-solid fa-shop"></i>
                                </a>
                            </div>
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

export default HomePage;
