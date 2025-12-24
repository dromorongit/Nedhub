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