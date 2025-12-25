// Navigation Module for Nedhub Website
// Handles responsive navigation, mobile menu, and active link states

// Mobile menu toggle functionality
export function initNavigation(): void {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn') as HTMLElement | null;
    const navMenu = document.getElementById('nav-menu') as HTMLElement | null;
    const navbar = document.getElementById('main-nav') as HTMLElement | null;

    if (!mobileMenuBtn || !navMenu || !navbar) return;

    // Mobile menu state
    let isMobileMenuOpen = false;

    // Toggle mobile menu
    mobileMenuBtn.addEventListener('click', () => {
        isMobileMenuOpen = !isMobileMenuOpen;
        toggleMobileMenu(isMobileMenuOpen, navMenu, mobileMenuBtn, navbar);
    });

    // Close mobile menu when clicking on a nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (isMobileMenuOpen) {
                isMobileMenuOpen = false;
                toggleMobileMenu(false, navMenu, mobileMenuBtn, navbar);
            }
            // Close dropdown if open
            const dropdown = document.querySelector('.dropdown') as HTMLElement | null;
            if (dropdown) {
                dropdown.classList.remove('open');
            }
        });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        
        if (isMobileMenuOpen && 
            !target.closest('.nav-menu') && 
            !target.closest('.mobile-menu-btn')) {
            isMobileMenuOpen = false;
            toggleMobileMenu(false, navMenu, mobileMenuBtn, navbar);
        }
    });

    // Initialize dropdown functionality
    initDropdown();

    // Set active link based on current page
    setActiveNavLink();

    // Handle window resize
    window.addEventListener('resize', debounce(() => {
        if (window.innerWidth > 768 && isMobileMenuOpen) {
            isMobileMenuOpen = false;
            toggleMobileMenu(false, navMenu, mobileMenuBtn, navbar);
        }
    }, 100) as EventListener);
}

// Toggle mobile menu visibility
function toggleMobileMenu(
    isOpen: boolean,
    navMenu: HTMLElement,
    mobileMenuBtn: HTMLElement,
    navbar: HTMLElement
): void {
    if (isOpen) {
        navMenu.classList.add('active');
        mobileMenuBtn.classList.add('active');
        navbar.classList.add('mobile-open');
        document.body.style.overflow = 'hidden';
        
        // Add animation classes
        navMenu.classList.add('mobile-menu-enter-active');
        navMenu.classList.remove('mobile-menu-exit');
        
        // Focus trap for accessibility
        trapFocus(navMenu);
    } else {
        navMenu.classList.remove('active');
        mobileMenuBtn.classList.remove('active');
        navbar.classList.remove('mobile-open');
        document.body.style.overflow = '';
        
        // Add animation classes
        navMenu.classList.add('mobile-menu-exit');
        navMenu.classList.remove('mobile-menu-enter-active');
        
        // Remove focus trap
        releaseFocusTrap();
    }
}

// Initialize dropdown functionality
function initDropdown(): void {
    const dropdown = document.querySelector('.dropdown') as HTMLElement | null;
    if (!dropdown) return;

    const dropdownLink = dropdown.querySelector('.nav-link') as HTMLElement | null;
    if (!dropdownLink) return;

    // Toggle dropdown on click
    dropdownLink.addEventListener('click', (e) => {
        e.preventDefault();
        const isOpen = dropdown.classList.contains('open');
        if (!isOpen) {
            dropdown.classList.add('open');
        } else {
            window.location.href = 'services.html';
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.dropdown')) {
            dropdown.classList.remove('open');
        }
    });
}

// Set active navigation link based on current page
function setActiveNavLink(): void {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');

    // Services pages that should highlight the Services dropdown
    const servicesPages = [
        'recruitment.html',
        'outsourcing.html',
        'training.html',
        'career-coaching.html',
        'data-analytics.html',
        'services.html'
    ];

    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        let shouldBeActive = linkHref === currentPath;

        // Special case for services dropdown
        if (servicesPages.includes(currentPath) && linkHref === 'services.html') {
            shouldBeActive = true;
        }

        if (shouldBeActive) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        } else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        }
    });
}

// Focus trap for mobile menu accessibility
function trapFocus(element: HTMLElement): void {
    const focusableElements = getFocusableElements(element);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (!firstElement || !lastElement) return;

    // Focus first element
    (firstElement as HTMLElement).focus();

    // Trap tab navigation
    const handleTab = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                (lastElement as HTMLElement).focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                (firstElement as HTMLElement).focus();
            }
        }
    };

    // Close menu on escape
    const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            const mobileMenuBtn = document.getElementById('mobile-menu-btn') as HTMLElement | null;
            if (mobileMenuBtn) {
                mobileMenuBtn.click();
            }
        }
    };

    document.addEventListener('keydown', handleTab);
    document.addEventListener('keydown', handleEscape);

    // Store event listeners for cleanup
    (element as any)._focusTrapListeners = [handleTab as EventListener, handleEscape as EventListener];
}

// Release focus trap
function releaseFocusTrap(): void {
    const navMenu = document.getElementById('nav-menu') as HTMLElement | null;
    if (navMenu && (navMenu as any)._focusTrapListeners) {
        (navMenu as any)._focusTrapListeners.forEach((listener: EventListener) => {
            document.removeEventListener('keydown', listener);
        });
        delete (navMenu as any)._focusTrapListeners;
    }
}

// Get all focusable elements within a container
function getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )) as HTMLElement[];
}

// Debounce function for resize events
function debounce(func: Function, wait: number = 100): Function {
    let timeout: number | null = null;

    return function executedFunction(...args: any[]) {
        const later = () => {
            timeout = null;
            func(...args);
        };

        if (timeout) {
            clearTimeout(timeout as number);
        }

        timeout = window.setTimeout(later, wait);
    };
}

// Export navigation functions for testing
export {
    toggleMobileMenu,
    setActiveNavLink,
    trapFocus,
    releaseFocusTrap,
    getFocusableElements
};