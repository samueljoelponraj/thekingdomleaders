function runInit() {
    // 1. Initialize AOS (Animate On Scroll)
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            once: true,
            offset: 50
        });
    }

    // 2. Active Page Highlighting
    highlightActivePage();

    // 3. Desktop Dropdown Accessibility/Toggles
    initDesktopDropdowns();

    // 4. Mobile Navigation & Accordion
    initMobileNav();

    // 5. Header Scroll Effect
    initHeaderScroll();

    // 6. Smooth Scroll for Page Anchors
    initSmoothScroll();

    // 7. Interactive Form Handler
    initFormHandlers();

    // 8. Dynamic Back to Top Button
    initBackToTop();

    // 9. Chennai Regional Map Interactivity
    initChennaiMap();

    // 10. Vision & Mission Bilingual Language Toggle
    initVisionMissionLangToggle();

    // 11. Gallery Lightbox Modal
    initGalleryLightbox();

    // 12. Premium Events Countdown
    initPremiumEventsCountdown();

    // 13. Events Carousel Slider
    initEventsCarousel();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runInit);
} else {
    runInit();
}

/**
 * Highlights the active link in desktop and mobile navigation menus based on current URL path.
 */
function highlightActivePage() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    
    // Desktop Nav Links
    const desktopLinks = document.querySelectorAll('header nav a');
    desktopLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === page || (page === 'index.html' && href === '#home') || (page === '' && href === 'index.html')) {
            link.classList.add('nav-link-active');
        } else {
            link.classList.remove('nav-link-active');
        }
    });

    // Highlight group button if we are on a dropdown page
    const groups = document.querySelectorAll('header nav .group');
    groups.forEach(group => {
        const btn = group.querySelector('button');
        const links = group.querySelectorAll('.nav-dropdown a');
        let active = false;
        links.forEach(l => {
            const href = l.getAttribute('href').split('#')[0];
            if (href === page) active = true;
        });
        if (btn) {
            if (active) {
                btn.classList.add('text-blue-800', 'font-semibold');
            } else {
                btn.classList.remove('text-blue-800', 'font-semibold');
            }
        }
    });

    // Mobile Nav Links
    const mobileLinks = document.querySelectorAll('#mobile-menu a');
    mobileLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === page) {
            link.classList.add('text-blue-800', 'font-semibold');
        }
    });
}

/**
 * Configures accessibility and interaction for desktop menu dropdowns.
 */
function initDesktopDropdowns() {
    // Desktop hover state is mainly CSS via .group, but we can manage keyboard/focus here if needed
    const dropdownBtns = document.querySelectorAll('header nav .group button');
    dropdownBtns.forEach(btn => {
        btn.addEventListener('focus', () => {
            const dropdown = btn.nextElementSibling;
            if (dropdown) {
                dropdown.classList.remove('hidden');
                dropdown.classList.add('block', 'opacity-100', 'visible');
            }
        });
    });
}

function initMobileNav() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenuDrawer = document.getElementById('mobile-menu-drawer');
    const mobileMenuBackdrop = document.getElementById('mobile-menu-backdrop');
    const mobileMenuCloseBtn = document.getElementById('mobile-menu-close-btn');

    // Function to open drawer
    const openDrawer = () => {
        if (mobileMenuDrawer && mobileMenuBackdrop) {
            mobileMenuBackdrop.classList.remove('opacity-0', 'pointer-events-none');
            mobileMenuBackdrop.classList.add('opacity-100', 'pointer-events-auto');
            mobileMenuDrawer.classList.remove('-translate-x-full');
            mobileMenuDrawer.classList.add('translate-x-0');
            document.body.classList.add('drawer-open');
            if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'true');
        }
    };

    // Function to close drawer
    const closeDrawer = () => {
        if (mobileMenuDrawer && mobileMenuBackdrop) {
            mobileMenuBackdrop.classList.remove('opacity-100', 'pointer-events-auto');
            mobileMenuBackdrop.classList.add('opacity-0', 'pointer-events-none');
            mobileMenuDrawer.classList.remove('translate-x-0');
            mobileMenuDrawer.classList.add('-translate-x-full');
            document.body.classList.remove('drawer-open');
            if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'false');
        }
    };

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (mobileMenuDrawer) {
                const isOpen = mobileMenuDrawer.classList.contains('translate-x-0');
                if (isOpen) {
                    closeDrawer();
                } else {
                    openDrawer();
                }
            }
        });
    }

    if (mobileMenuCloseBtn) {
        mobileMenuCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeDrawer();
        });
    }

    if (mobileMenuBackdrop) {
        mobileMenuBackdrop.addEventListener('click', (e) => {
            e.stopPropagation();
            closeDrawer();
        });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenuDrawer && mobileMenuDrawer.classList.contains('translate-x-0')) {
            closeDrawer();
        }
    });

    // Support accordion-style menus with plus signs or toggle indicators inside drawer
    const accordionButtons = document.querySelectorAll('.mobile-dropdown-btn');
    accordionButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const menu = btn.nextElementSibling;
            const indicator = btn.querySelector('.mobile-dropdown-indicator');

            if (menu) {
                const isHidden = menu.classList.contains('hidden');
                if (isHidden) {
                    menu.classList.remove('hidden');
                    if (indicator) {
                        indicator.classList.add('rotate-45');
                        indicator.classList.add('text-blue-800');
                    }
                } else {
                    menu.classList.add('hidden');
                    if (indicator) {
                        indicator.classList.remove('rotate-45');
                        indicator.classList.remove('text-blue-800');
                    }
                }
            }
        });
    });

    // Close menu when clicking internal anchor links in drawer
    const drawerLinks = document.querySelectorAll('#mobile-menu-drawer a:not(.mobile-dropdown-btn)');
    drawerLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeDrawer();
        });
    });

    // Backwards compatibility for legacy pages just in case
    const legacyMobileMenu = document.getElementById('mobile-menu');
    if (legacyMobileMenu && mobileMenuBtn && !mobileMenuDrawer) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            legacyMobileMenu.classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
            if (!legacyMobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                legacyMobileMenu.classList.add('hidden');
            }
        });
        
        // Mobile "About Us" dropdown toggler
        const mobileAboutBtn = document.getElementById('mobile-about-btn');
        const mobileAboutMenu = document.getElementById('mobile-about-menu');
        const mobileAboutArrow = document.getElementById('mobile-about-arrow');

        if (mobileAboutBtn && mobileAboutMenu) {
            mobileAboutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const isHidden = mobileAboutMenu.classList.contains('hidden');
                if (isHidden) {
                    mobileAboutMenu.classList.remove('hidden');
                    if (mobileAboutArrow) mobileAboutArrow.classList.add('rotate-180');
                } else {
                    mobileAboutMenu.classList.add('hidden');
                    if (mobileAboutArrow) mobileAboutArrow.classList.remove('rotate-180');
                }
            });
        }

        // Mobile "Chapters" dropdown toggler
        const mobileChaptersBtn = document.getElementById('mobile-chapters-btn');
        const mobileChaptersMenu = document.getElementById('mobile-chapters-menu');
        const mobileChaptersArrow = document.getElementById('mobile-chapters-arrow');

        if (mobileChaptersBtn && mobileChaptersMenu) {
            mobileChaptersBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const isHidden = mobileChaptersMenu.classList.contains('hidden');
                if (isHidden) {
                    mobileChaptersMenu.classList.remove('hidden');
                    if (mobileChaptersArrow) mobileChaptersArrow.classList.add('rotate-180');
                } else {
                    mobileChaptersMenu.classList.add('hidden');
                    if (mobileChaptersArrow) mobileChaptersArrow.classList.remove('rotate-180');
                }
            });
        }
    }
}

/**
 * Adds background style & shadow to header upon scrolling.
 */
function initHeaderScroll() {
    const header = document.getElementById('header');
    if (header) {
        const toggleHeaderStyle = () => {
            if (window.scrollY > 20) {
                header.classList.add('header-scrolled');
            } else {
                header.classList.remove('header-scrolled');
            }
        };
        
        window.addEventListener('scroll', toggleHeaderStyle);
        // Initial run in case page is refreshed while scrolled
        toggleHeaderStyle();
    }
}

/**
 * Implements smooth scroll behavior for local hash links with fixed header clearance.
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (!href || href === '#') return;
            
            try {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    
                    // Close mobile drawer if open
                    const drawer = document.getElementById('mobile-menu-drawer');
                    const backdrop = document.getElementById('mobile-menu-backdrop');
                    const btn = document.getElementById('mobile-menu-btn');
                    if (drawer && backdrop) {
                        backdrop.classList.remove('opacity-100', 'pointer-events-auto');
                        backdrop.classList.add('opacity-0', 'pointer-events-none');
                        drawer.classList.remove('translate-x-0');
                        drawer.classList.add('-translate-x-full');
                        document.body.classList.remove('drawer-open');
                        if (btn) btn.setAttribute('aria-expanded', 'false');
                    }
                    
                    // Hide legacy mobile menu if present
                    const mobileMenu = document.getElementById('mobile-menu');
                    if (mobileMenu) {
                        mobileMenu.classList.add('hidden');
                    }

                    // Calculate position accounting for fixed header
                    const header = document.getElementById('header');
                    const headerOffset = (header ? header.offsetHeight : 64) + 16;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: Math.max(0, offsetPosition),
                        behavior: 'smooth'
                    });

                    if (history.pushState) {
                        history.pushState(null, null, href);
                    }
                }
            } catch (err) {
                // Not a valid query selector, allow default browser behavior
            }
        });
    });
}

/**
 * Validates and handles contact form submission.
 */
function initFormHandlers() {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Extract values (supporting both registration form and legacy contact forms)
            const fullNameEl = document.getElementById('reg-fullname') || contactForm.querySelector('input[type="text"]');
            const nameVal = fullNameEl ? fullNameEl.value.trim() : '';
            
            if (fullNameEl && fullNameEl.hasAttribute('required') && !nameVal) {
                alert('Please fill out all required fields.');
                return;
            }

            // Mock success alert (in production, connect to a backend api)
            alert(`Thank you, ${nameVal || 'Member'}! Your registration has been submitted successfully. We will get back to you soon.`);
            contactForm.reset();
        });
    }
}

/**
 * Creates and toggles a floating Back-to-Top button.
 */
function initBackToTop() {
    // Check if button already exists
    if (document.getElementById('back-to-top')) return;

    const btn = document.createElement('button');
    btn.id = 'back-to-top';
    btn.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
        </svg>
    `;
    
    // Style the button dynamically
    btn.className = 'fixed bottom-8 right-8 bg-gradient-to-r from-blue-800 to-blue-900 text-white w-12 h-12 rounded-full shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 hidden z-50 flex items-center justify-center focus:outline-none';
    document.body.appendChild(btn);

    // Scroll listener
    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            btn.classList.remove('hidden');
            btn.classList.add('flex');
        } else {
            btn.classList.add('hidden');
            btn.classList.remove('flex');
        }
    });

    // Click handler
    btn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/**
 * Initializes interactive SVG map functionality for Chennai regional hubs.
 */
function initChennaiMap() {
    const mapContainer = document.getElementById('map');
    const detailsCard = document.getElementById('region-details-card');
    
    if (!mapContainer || !detailsCard) return;

    const data = {
        south: {
            title: "South Chennai",
            sector: "South Sector",
            hub: "Medavakkam Hub",
            president: { name: "Isaac Selvin Raj", phone: "93407 07495", image: "images/chapter learder images/issac_president.jpeg", fitClass: "object-cover object-[center_20%]" },
            secretary: { name: "Devarajan", phone: "95606 44447", image: "images/chapter learder images/devaraj_secretary.jpg", fitClass: "object-contain bg-gray-50 border border-gray-100" },
            treasurer: { name: "I. Jebasingh Immanuel", phone: "98414 98500", image: "images/chapter learder images/jebasing.jpeg", fitClass: "object-contain bg-gray-50 border border-gray-100" },
            colorClass: "border-l-purple-500",
            tagClass: "bg-purple-100 text-purple-800"
        },
        west: {
            title: "West Chennai",
            sector: "West Sector",
            hub: "Ambattur Hub",
            president: { name: "Elias Inbaraj", phone: "99402 23756", image: "images/chapter learder images/Elias Inbaraj.jpeg", fitClass: "object-cover object-top" },
            secretary: { name: "Balachandar Thayalamani", phone: "84288 46088", image: "images/chapter learder images/Balachandar Thayalamani.jpeg", fitClass: "object-cover object-top" },
            treasurer: { name: "Rajan", phone: "88258 17389", image: "images/chapter learder images/Rajan.jpg", fitClass: "object-cover object-top" },
            colorClass: "border-l-red-500",
            tagClass: "bg-red-100 text-red-800"
        },
        central: {
            title: "Central Chennai",
            sector: "Central Sector",
            hub: "Kathipara, Porur Hub",
            president: { name: "Lenin", phone: "81481 87386", image: "images/chapter learder images/lenin_president.jpeg", fitClass: "object-contain bg-gray-50 border border-gray-100" },
            secretary: { name: "Kishore Abishek", phone: "81489 373830", image: "images/chapter learder images/kishore_secretary.jpeg", fitClass: "object-cover object-[center_25%]" },
            treasurer: { name: "Franklin", phone: "99401 50812", image: "images/chapter learder images/franklin_treasurer.jpeg", fitClass: "object-cover object-top" },
            colorClass: "border-l-yellow-500",
            tagClass: "bg-yellow-100 text-yellow-800"
        },
        north: {
            title: "North Chennai",
            sector: "North Sector",
            hub: "Rayapuram Hub",
            president: { name: "None", phone: "", image: "", fitClass: "" },
            secretary: { name: "Gladson", phone: "80123 32113", image: "", fitClass: "" },
            treasurer: { name: "Justin", phone: "97511 98064", image: "", fitClass: "" },
            colorClass: "border-l-blue-500",
            tagClass: "bg-blue-100 text-blue-800"
        },
        east: {
            title: "East Chennai",
            sector: "East Sector",
            hub: "Adyar Hub",
            president: { name: "Saravanan", phone: "90943 56041", image: "images/chapter learder images/saravanan.jpeg", fitClass: "object-cover object-[center_35%] scale-[2.1] origin-[70%_34%]" },
            secretary: { name: "Gnanapragasam", phone: "99416 35869", image: "images/chapter learder images/gnanapragasam.jpeg", fitClass: "object-cover object-top" },
            treasurer: { name: "V. Paul Sarangapani", phone: "97911 23466", image: "images/chapter learder images/sarangapani.jpeg", fitClass: "object-contain bg-gray-50 border border-gray-100" },
            colorClass: "border-l-green-500",
            tagClass: "bg-green-100 text-green-800"
        }
    };

    const detailsTag = document.getElementById('details-tag');
    const detailsRegion = document.getElementById('details-region');
    const detailsHub = document.getElementById('details-hub');
    const detailsPresident = document.getElementById('details-president');
    const detailsSecretary = document.getElementById('details-secretary');
    const detailsTreasurer = document.getElementById('details-treasurer');

    let mapLayers = {};

    function getInitials(name) {
        if (!name || name.toLowerCase() === "none") return "";
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    function getGradientClass(regionKey) {
        switch(regionKey) {
            case 'west': return 'from-red-500 to-rose-600';
            case 'central': return 'from-yellow-500 to-amber-600';
            case 'north': return 'from-blue-500 to-sky-600';
            case 'east': return 'from-green-500 to-emerald-600';
            case 'south': return 'from-purple-500 to-violet-600';
            default: return 'from-gray-500 to-slate-600';
        }
    }

    function updateDetails(regionKey) {
        const item = data[regionKey];
        if (!item) return;

        if (detailsTag) detailsTag.textContent = item.title;
        if (detailsRegion) detailsRegion.textContent = item.sector;
        if (detailsHub) detailsHub.textContent = item.hub;

        const renderLeader = (leader, defaultRole) => {
            if (!leader || leader.name === "None") {
                return `
                    <div class="flex flex-col py-2 w-full">
                        <div class="w-full h-48 rounded-2xl bg-gray-100 border border-dashed border-gray-300 text-gray-400 flex items-center justify-center font-semibold text-sm mb-3">
                            N/A
                        </div>
                        <div>
                            <div class="font-bold text-gray-400 leading-tight italic text-sm sm:text-base">Position Open</div>
                            <div class="text-xs text-gray-400 mt-1">Contact HQ to apply</div>
                        </div>
                    </div>
                `;
            }
            return `
                <div class="flex flex-col py-2 w-full">
                    ${leader.image 
                        ? `<div class="w-full h-48 rounded-2xl overflow-hidden border border-gray-200 shadow-sm mb-3">
                               <img src="${leader.image}" alt="${leader.name}" class="w-full h-full ${leader.fitClass || 'object-cover object-top'}">
                           </div>` 
                        : `<div class="w-full h-48 rounded-2xl bg-gradient-to-br ${getGradientClass(regionKey)} text-white flex items-center justify-center font-bold text-4xl shadow-sm mb-3">${getInitials(leader.name)}</div>`
                    }
                    <div>
                        <div class="font-bold text-gray-900 leading-tight text-sm sm:text-base break-words">${leader.name}</div>
                        <a href="tel:+91${leader.phone.replace(/\s+/g, '')}" class="text-xs sm:text-sm text-blue-800 hover:text-blue-900 font-semibold flex items-center mt-2 transition-colors flex-wrap">
                            <svg class="w-3.5 h-3.5 mr-1.5 text-blue-800 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                            </svg>
                            <span>+91 ${leader.phone}</span>
                        </a>
                    </div>
                </div>
            `;
        };

        if (detailsPresident) detailsPresident.innerHTML = renderLeader(item.president, "President");
        if (detailsSecretary) detailsSecretary.innerHTML = renderLeader(item.secretary, "Secretary");
        if (detailsTreasurer) detailsTreasurer.innerHTML = renderLeader(item.treasurer, "Treasurer");

        if (detailsCard) {
            detailsCard.className = `bg-white rounded-3xl p-8 border border-gray-150 shadow-xl transition-all duration-300 border-l-8 ${item.colorClass} h-full flex flex-col justify-between`;
        }
        if (detailsTag) {
            detailsTag.className = `px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${item.tagClass}`;
        }

        Object.keys(mapLayers).forEach(key => {
            if (mapLayers[key] && mapLayers[key].setStyle) {
                mapLayers[key].setStyle({
                    fillOpacity: 0.15,
                    weight: 1.5
                });
            }
        });

        if (mapLayers[regionKey] && mapLayers[regionKey].setStyle) {
            mapLayers[regionKey].setStyle({
                fillOpacity: 0.45,
                weight: 3.0
            });
        }
    }

    // Expose selectSector globally
    window.selectSector = function(regionKey) {
        updateDetails(regionKey);
    };

    // IMMEDIATELY render South Sector leader details & photos on page load!
    updateDetails('south');

    function setupMap() {
        if (typeof L === 'undefined') return;
        if (mapContainer._leaflet_id) {
            if (window._chennaiMapInstance) {
                window._chennaiMapInstance.invalidateSize();
            }
            return;
        }

        try {
            const hubs = [
                { key: "west",    name: "Ambattur",         coords: [13.1143, 80.1548], color: "#e74c3c" },
                { key: "central", name: "Kathipara, Porur", coords: [13.0356, 80.1948], color: "#f1c40f" },
                { key: "north",   name: "Rayapuram",        coords: [13.1097, 80.2925], color: "#3498db" },
                { key: "east",    name: "Adyar",            coords: [13.0012, 80.2565], color: "#2ecc71" },
                { key: "south",   name: "Medavakkam",       coords: [12.9186, 80.1987], color: "#9b59b6" }
            ];

            const map = L.map('map', {
                zoomControl: true,
                scrollWheelZoom: false
            }).setView([13.02, 80.22], 11);

            window._chennaiMapInstance = map;

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 18,
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            hubs.forEach(h => {
                const marker = L.marker(h.coords).addTo(map);
                marker.bindPopup(`<div class="font-bold text-xs">${h.name} Hub</div>`);

                const circle = L.circle(h.coords, {
                    radius: 6000,
                    color: h.color,
                    fillColor: h.color,
                    fillOpacity: 0.15,
                    weight: 1.5
                }).addTo(map);

                mapLayers[h.key] = circle;

                circle.on('mouseover', () => updateDetails(h.key));
                circle.on('click', () => {
                    updateDetails(h.key);
                    map.setView(h.coords, 12);
                });

                marker.on('mouseover', () => updateDetails(h.key));
                marker.on('click', () => {
                    updateDetails(h.key);
                    map.setView(h.coords, 12);
                    marker.openPopup();
                });
            });

            setTimeout(() => map.invalidateSize(), 200);
            setTimeout(() => map.invalidateSize(), 800);

            window.addEventListener('resize', () => map.invalidateSize());

            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            map.invalidateSize();
                        }
                    });
                }, { threshold: 0.1 });
                observer.observe(mapContainer);
            }
        } catch (err) {
            console.warn('Leaflet map notice:', err);
        }
    }

    if (typeof L !== 'undefined') {
        setupMap();
    } else {
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (typeof L !== 'undefined') {
                clearInterval(interval);
                setupMap();
            } else if (attempts > 40) {
                clearInterval(interval);
            }
        }, 100);
    }
}

/**
 * Configures bilingual language switching for the Vision & Mission section.
 */
function initVisionMissionLangToggle() {
    const enBtn = document.getElementById('vision-lang-en');
    const taBtn = document.getElementById('vision-lang-ta');
    
    if (!enBtn || !taBtn) return;
    
    const enElements = document.querySelectorAll('.vision-en, .mission-en');
    const taElements = document.querySelectorAll('.vision-ta, .mission-ta');
    
    enBtn.addEventListener('click', () => {
        // Toggle buttons active state styling
        enBtn.className = 'px-5 py-2 text-sm font-bold rounded-full bg-white text-blue-900 shadow transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20';
        taBtn.className = 'px-5 py-2 text-sm font-bold rounded-full text-gray-500 hover:text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20';
        
        // Show English, Hide Tamil
        enElements.forEach(el => el.classList.remove('hidden'));
        taElements.forEach(el => el.classList.add('hidden'));
    });
    
    taBtn.addEventListener('click', () => {
        // Toggle buttons active state styling
        taBtn.className = 'px-5 py-2 text-sm font-bold rounded-full bg-white text-blue-900 shadow transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20';
        enBtn.className = 'px-5 py-2 text-sm font-bold rounded-full text-gray-500 hover:text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20';
        
        // Show Tamil, Hide English
        taElements.forEach(el => el.classList.remove('hidden'));
        enElements.forEach(el => el.classList.add('hidden'));
    });
}

/**
 * Configures the lightbox slideshow and trigger click handlers for premium gallery cards.
 */
function initGalleryLightbox() {
    const lightbox = document.getElementById('gallery-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxCounter = document.getElementById('lightbox-counter');
    const closeBtn = document.getElementById('lightbox-close');
    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');
    const triggerCards = document.querySelectorAll('.gallery-trigger-card');

    if (!lightbox || triggerCards.length === 0) return;

    // Gallery folders details mapping
    const galleryData = {
        'leadersmeet-2026': {
            title: 'Leaders Meet (June 2026)',
            images: [
                'images/leadersmeet 20.6.2026/IMG_4804.jpg',
                'images/leadersmeet 20.6.2026/IMG_4805.jpg',
                'images/leadersmeet 20.6.2026/IMG_4811.jpg',
                'images/leadersmeet 20.6.2026/IMG_4815.jpg'
            ]
        },
        'civil-awareness': {
            title: 'Civil Awareness Programs',
            images: [
                'images/Civil awarness/IMG_4422.jpg',
                'images/Civil awarness/IMG_4425.jpg',
                'images/Civil awarness/IMG_4429.jpg',
                'images/Civil awarness/IMG_4430.jpg',
                'images/Civil awarness/IMG_4431.jpg',
                'images/Civil awarness/IMG_4432.jpg',
                'images/Civil awarness/IMG_4433.jpg',
                'images/Civil awarness/IMG_4803.jpg'
            ]
        },
        'leadersmeet-2025': {
            title: 'Leaders Meet (Dec 2025)',
            images: [
                'images/leaders meet 19.12.2025/IMG_2661.jpg',
                'images/leaders meet 19.12.2025/IMG_2663.jpg',
                'images/leaders meet 19.12.2025/IMG_2664.jpg',
                'images/leaders meet 19.12.2025/IMG_2665.jpg',
                'images/leaders meet 19.12.2025/IMG_2667.jpg',
                'images/leaders meet 19.12.2025/IMG_2668.jpg',
                'images/leaders meet 19.12.2025/IMG_2670.jpg',
                'images/leaders meet 19.12.2025/IMG_2671.jpg',
                'images/leaders meet 19.12.2025/IMG_2672.jpg',
                'images/leaders meet 19.12.2025/IMG_2673.jpg'
            ]
        }
    };

    let currentCategory = '';
    let currentIndex = 0;

    function openLightbox(category, index = 0) {
        if (!galleryData[category]) return;
        currentCategory = category;
        currentIndex = index;

        updateLightboxContent();
        
        lightbox.classList.remove('hidden');
        // Force layout repaint
        void lightbox.offsetWidth;
        lightbox.classList.remove('opacity-0');
        document.body.style.overflow = 'hidden'; // Stop page scrolling
    }

    function closeLightbox() {
        lightbox.classList.add('opacity-0');
        setTimeout(() => {
            lightbox.classList.add('hidden');
        }, 300);
        document.body.style.overflow = ''; // Resume page scrolling
    }

    function updateLightboxContent() {
        const data = galleryData[currentCategory];
        const images = data.images;
        const total = images.length;

        lightboxImg.src = images[currentIndex];
        lightboxTitle.textContent = data.title;
        lightboxCounter.textContent = `${currentIndex + 1} / ${total}`;
    }

    function prevImage() {
        const total = galleryData[currentCategory].images.length;
        currentIndex = (currentIndex - 1 + total) % total;
        updateLightboxContent();
    }

    function nextImage() {
        const total = galleryData[currentCategory].images.length;
        currentIndex = (currentIndex + 1) % total;
        updateLightboxContent();
    }

    // Trigger click listeners
    triggerCards.forEach(card => {
        card.addEventListener('click', (e) => {
            const cat = card.getAttribute('data-gallery-category');
            if (cat) {
                openLightbox(cat);
            }
        });
    });

    // Close buttons handlers
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);

    // Close on backdrop overlay click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.id === 'gallery-lightbox') {
            closeLightbox();
        }
    });

    // Navigation button handlers
    if (prevBtn) prevBtn.addEventListener('click', prevImage);
    if (nextBtn) nextBtn.addEventListener('click', nextImage);

    // Keyboard handlers (Escape, Arrows)
    document.addEventListener('keydown', (e) => {
        if (lightbox.classList.contains('hidden')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'ArrowRight') nextImage();
    });
}

/**
 * Interactive countdown timer for the upcoming featured event (Grand Launch East Chapter / Next Event).
 */
function initPremiumEventsCountdown() {
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

    const container = daysEl.closest('[data-target-date]');
    const customTarget = container ? container.getAttribute('data-target-date') : null;
    const targetDate = customTarget 
        ? new Date(customTarget).getTime() 
        : new Date('September 11, 2026 17:30:00').getTime();

    function updateCountdown() {
        const now = new Date().getTime();
        const difference = targetDate - now;

        if (difference <= 0) {
            daysEl.textContent = '00';
            hoursEl.textContent = '00';
            minutesEl.textContent = '00';
            secondsEl.textContent = '00';
            clearInterval(timerInterval);
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        daysEl.textContent = days.toString().padStart(2, '0');
        hoursEl.textContent = hours.toString().padStart(2, '0');
        minutesEl.textContent = minutes.toString().padStart(2, '0');
        secondsEl.textContent = seconds.toString().padStart(2, '0');
    }

    updateCountdown();
    const timerInterval = setInterval(updateCountdown, 1000);
}

/**
 * Interactive Events Carousel Slider with tab pills, navigation buttons, touch swipe, and auto-play.
 */
function initEventsCarousel() {
    const track = document.getElementById('events-carousel-track');
    const prevBtn = document.getElementById('events-prev-btn');
    const nextBtn = document.getElementById('events-next-btn');
    const tabBtns = document.querySelectorAll('.event-tab-btn');
    const dotBtns = document.querySelectorAll('#events-carousel-dots .event-dot');
    const carousel = document.getElementById('events-carousel');

    if (!track) return;

    const totalSlides = track.children.length;
    if (totalSlides <= 1) return;

    let currentIndex = 0;
    let autoPlayInterval = null;

    function goToSlide(index) {
        currentIndex = (index + totalSlides) % totalSlides;
        track.style.transform = `translateX(-${currentIndex * 100}%)`;

        // Update Tab buttons
        tabBtns.forEach((btn, i) => {
            if (i === currentIndex) {
                btn.classList.remove('inactive-event-tab');
                btn.classList.add('active-event-tab');
            } else {
                btn.classList.remove('active-event-tab');
                btn.classList.add('inactive-event-tab');
            }
        });

        // Update Dots
        dotBtns.forEach((dot, i) => {
            if (i === currentIndex) {
                dot.className = 'event-dot w-8 h-2.5 rounded-full bg-orange-600 transition-all duration-300';
            } else {
                dot.className = 'event-dot w-2.5 h-2.5 rounded-full bg-gray-300 hover:bg-gray-400 transition-all duration-300';
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            goToSlide(currentIndex - 1);
            resetAutoPlay();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            goToSlide(currentIndex + 1);
            resetAutoPlay();
        });
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const slideIndex = parseInt(btn.getAttribute('data-slide-index'), 10);
            goToSlide(slideIndex);
            resetAutoPlay();
        });
    });

    dotBtns.forEach(dot => {
        dot.addEventListener('click', () => {
            const slideIndex = parseInt(dot.getAttribute('data-slide-index'), 10);
            goToSlide(slideIndex);
            resetAutoPlay();
        });
    });

    // Touch / Swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    track.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const threshold = 40;
        if (touchEndX < touchStartX - threshold) {
            goToSlide(currentIndex + 1);
            resetAutoPlay();
        } else if (touchEndX > touchStartX + threshold) {
            goToSlide(currentIndex - 1);
            resetAutoPlay();
        }
    }

    // Auto-play timer (slides every 7 seconds)
    function startAutoPlay() {
        if (!autoPlayInterval) {
            autoPlayInterval = setInterval(() => {
                goToSlide(currentIndex + 1);
            }, 7000);
        }
    }

    function stopAutoPlay() {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
        }
    }

    function resetAutoPlay() {
        stopAutoPlay();
        startAutoPlay();
    }

    if (carousel) {
        carousel.addEventListener('mouseenter', stopAutoPlay);
        carousel.addEventListener('mouseleave', startAutoPlay);
    }

    startAutoPlay();
}

