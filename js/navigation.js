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
    var mobileServicesOverlay = document.querySelector('.mobile-services-overlay');
    var mobileServicesClose = document.querySelector('.mobile-services-close');
    
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
            closeMobileServicesDropdown();
        } else {
            openMobileServicesDropdown();
        }
    });
    
    // Open dropdown function
    function openMobileServicesDropdown() {
        mobileServicesDropdown.classList.add('open');
        mobileServicesBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden'; // Prevent body scrolling
        
        // Focus first service link for accessibility
        var firstServiceLink = mobileServicesDropdown.querySelector('.mobile-service-link');
        if (firstServiceLink) {
            setTimeout(function() {
                firstServiceLink.focus();
            }, 300); // Delay to allow animation to complete
        }
        
        console.log('Mobile services dropdown opened');
    }
    
    // Close dropdown function
    function closeMobileServicesDropdown() {
        mobileServicesDropdown.classList.remove('open');
        mobileServicesBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = ''; // Restore body scrolling
        mobileServicesBtn.focus(); // Return focus to button
        console.log('Mobile services dropdown closed');
    }
    
    // Close button functionality
    if (mobileServicesClose) {
        mobileServicesClose.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeMobileServicesDropdown();
        });
    }
    
    // Handle touch events for better mobile support
    mobileServicesBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        this.click();
    });
    
    // Close dropdown when clicking on service links
    var serviceLinks = mobileServicesDropdown.querySelectorAll('.mobile-service-link');
    serviceLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
            // Add small delay to show click feedback before closing
            setTimeout(function() {
                closeMobileServicesDropdown();
            }, 150);
            console.log('Mobile services dropdown closed by link click');
        });
        
        // Handle touch events for service links
        link.addEventListener('touchend', function(e) {
            e.preventDefault();
            this.click();
        });
    });
    
    // Close dropdown when clicking on overlay
    if (mobileServicesOverlay) {
        mobileServicesOverlay.addEventListener('click', function(e) {
            e.preventDefault();
            closeMobileServicesDropdown();
        });
    }
    
    // Close dropdown when clicking outside (but not on the button)
    document.addEventListener('click', function(e) {
        var target = e.target;
        var isDropdownClick = target.closest('.mobile-services-dropdown');
        var isButtonClick = target.closest('.mobile-services-btn');
        
        if (!isDropdownClick && !isButtonClick && mobileServicesDropdown.classList.contains('open')) {
            closeMobileServicesDropdown();
            console.log('Mobile services dropdown closed by outside click');
        }
    });
    
    // Close dropdown on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mobileServicesDropdown.classList.contains('open')) {
            closeMobileServicesDropdown();
        }
    });
    
    // Handle focus trap for accessibility
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab' && mobileServicesDropdown.classList.contains('open')) {
            var focusableElements = mobileServicesDropdown.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            var firstElement = focusableElements[0];
            var lastElement = focusableElements[focusableElements.length - 1];
            
            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        }
    });
    
    // Prevent scrolling when dropdown is open
    mobileServicesDropdown.addEventListener('wheel', function(e) {
        if (mobileServicesDropdown.classList.contains('open')) {
            e.preventDefault();
        }
    }, { passive: false });
    
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
        e.stopPropagation(); // Prevent event bubbling
        
        var isOpen = dropdown.classList.contains('open');
        console.log('Dropdown clicked, currently open:', isOpen);
        
        if (isOpen) {
            dropdown.classList.remove('open');
            console.log('Dropdown closed');
        } else {
            dropdown.classList.add('open');
            console.log('Dropdown opened');
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
    
    // Close dropdown on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && dropdown.classList.contains('open')) {
            dropdown.classList.remove('open');
            console.log('Dropdown closed by escape key');
        }
    });
    
    // Handle hover for desktop (optional)
    if (window.innerWidth > 768) {
        dropdown.addEventListener('mouseenter', function() {
            dropdown.classList.add('open');
        });
        
        dropdown.addEventListener('mouseleave', function() {
            dropdown.classList.remove('open');
        });
    }
    
    console.log('Dropdown functionality initialized');
}