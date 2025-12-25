// Simple Navigation Script - Works directly in browser
// No TypeScript compilation needed

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Simple Navigation Script Loaded');
    
    // Get navigation elements
    var mobileMenuBtn = document.getElementById('mobile-menu-btn');
    var navMenu = document.getElementById('nav-menu');
    
    if (!mobileMenuBtn || !navMenu) {
        console.error('Navigation elements not found');
        console.log('Mobile menu button:', mobileMenuBtn);
        console.log('Navigation menu:', navMenu);
        return;
    }
    
    console.log('Navigation elements found:', {
        mobileMenuBtn: mobileMenuBtn,
        navMenu: navMenu
    });
    
    // Mobile menu state
    var isMobileMenuOpen = false;
    
    // Toggle mobile menu
    mobileMenuBtn.addEventListener('click', function() {
        console.log('Mobile menu button clicked');
        
        isMobileMenuOpen = !isMobileMenuOpen;
        
        if (isMobileMenuOpen) {
            // Open menu
            navMenu.classList.add('active');
            mobileMenuBtn.classList.add('active');
            mobileMenuBtn.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
            
            console.log('Menu opened');
            console.log('Menu classes:', navMenu.classList);
            console.log('Button classes:', mobileMenuBtn.classList);
        } else {
            // Close menu
            navMenu.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
            
            console.log('Menu closed');
            console.log('Menu classes:', navMenu.classList);
            console.log('Button classes:', mobileMenuBtn.classList);
        }
    });
    
    // Close mobile menu when clicking on a nav link
    var navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(function(link) {
        link.addEventListener('click', function() {
            if (isMobileMenuOpen) {
                isMobileMenuOpen = false;
                navMenu.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
                
                console.log('Menu closed by link click');
            }
        });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (isMobileMenuOpen && 
            !e.target.closest('.nav-menu') && 
            !e.target.closest('.mobile-menu-btn')) {
            
            isMobileMenuOpen = false;
            navMenu.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
            
            console.log('Menu closed by outside click');
        }
    });
    
    // Initialize dropdown functionality
    initDropdown();
    
    // Initialize mobile services dropdown
    initMobileServicesDropdown();
    
    // Set active link based on current page
    setActiveNavLink();
    
    // Handle window resize
    window.addEventListener('resize', debounce(function() {
        if (window.innerWidth > 768 && isMobileMenuOpen) {
            isMobileMenuOpen = false;
            navMenu.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
            
            console.log('Menu closed by resize');
        }
    }, 100));
    
    console.log('Navigation script initialized successfully');
});

// Set active navigation link based on current page
function setActiveNavLink() {
    var currentPath = window.location.pathname.split('/').pop() || 'index.html';
    var navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(function(link) {
        var linkHref = link.getAttribute('href');
        if (linkHref === currentPath) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        } else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        }
    });
    
    console.log('Active link set to:', currentPath);
}

// Debounce function for resize events
function debounce(func, wait) {
    if (wait === undefined) {
        wait = 100;
    }
    
    var timeout = null;
    
    return function() {
        var context = this;
        var args = arguments;
        
        var later = function() {
            timeout = null;
            func.apply(context, args);
        };
        
        if (timeout) {
            clearTimeout(timeout);
        }
        
        timeout = setTimeout(later, wait);
    };
}

// Initialize mobile services dropdown functionality
function initMobileServicesDropdown() {
    var mobileServicesBtn = document.querySelector('.mobile-services-btn');
    var mobileServicesDropdown = document.querySelector('.mobile-services-dropdown');
    
    if (!mobileServicesBtn || !mobileServicesDropdown) {
        console.log('Mobile services dropdown elements not found');
        return;
    }
    
    console.log('Mobile services dropdown initialized');
    
    // Toggle dropdown on button click
    mobileServicesBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        var isOpen = mobileServicesDropdown.classList.contains('open');
        console.log('Mobile services dropdown clicked, currently open:', isOpen);
        
        if (isOpen) {
            mobileServicesDropdown.classList.remove('open');
            mobileServicesBtn.setAttribute('aria-expanded', 'false');
            console.log('Mobile services dropdown closed');
        } else {
            mobileServicesDropdown.classList.add('open');
            mobileServicesBtn.setAttribute('aria-expanded', 'true');
            console.log('Mobile services dropdown opened');
        }
    });
    
    // Handle touch events for better mobile support
    mobileServicesBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        this.click();
    });
    
    // Close dropdown when clicking on service links
    var serviceLinks = document.querySelectorAll('.mobile-service-link');
    serviceLinks.forEach(function(link) {
        link.addEventListener('click', function() {
            mobileServicesDropdown.classList.remove('open');
            mobileServicesBtn.setAttribute('aria-expanded', 'false');
            console.log('Mobile services dropdown closed by link click');
        });
        
        // Handle touch events for service links
        link.addEventListener('touchend', function(e) {
            e.preventDefault();
            this.click();
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        var target = e.target;
        if (!target.closest('.mobile-services-dropdown')) {
            mobileServicesDropdown.classList.remove('open');
            mobileServicesBtn.setAttribute('aria-expanded', 'false');
            console.log('Mobile services dropdown closed by outside click');
        }
    });
    
    // Close dropdown on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mobileServicesDropdown.classList.contains('open')) {
            mobileServicesDropdown.classList.remove('open');
            mobileServicesBtn.setAttribute('aria-expanded', 'false');
            mobileServicesBtn.focus();
            console.log('Mobile services dropdown closed by escape key');
        }
    });
    
    console.log('Mobile services dropdown functionality initialized');
}

// Initialize dropdown functionality
function initDropdown() {
    var dropdown = document.querySelector('.dropdown');
    if (!dropdown) {
        console.log('No dropdown found');
        return;
    }
    
    var dropdownLink = dropdown.querySelector('.nav-link');
    if (!dropdownLink) {
        console.log('No dropdown link found');
        return;
    }
    
    console.log('Dropdown initialized');
    
    dropdownLink.addEventListener('click', function(e) {
        e.preventDefault();
        
        var currentPath = window.location.pathname.split('/').pop() || 'index.html';
        var isServicesPage = currentPath === 'services.html';
        
        console.log('Dropdown clicked, current page:', currentPath, 'is services page:', isServicesPage);
        
        if (!isServicesPage) {
            // If not on services page, navigate to services page
            console.log('Navigating to services page');
            window.location.href = 'services.html';
        } else {
            // If on services page, toggle dropdown
            var isOpen = dropdown.classList.contains('open');
            console.log('Dropdown is currently open:', isOpen);
            
            if (isOpen) {
                dropdown.classList.remove('open');
                console.log('Dropdown closed');
            } else {
                dropdown.classList.add('open');
                console.log('Dropdown opened');
            }
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        var target = e.target;
        if (!target.closest('.dropdown')) {
            dropdown.classList.remove('open');
            console.log('Dropdown closed by outside click');
        }
    });
    
    console.log('Dropdown functionality initialized');
}