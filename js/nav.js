export function initNavigation() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.getElementById('nav-menu');
    const navbar = document.getElementById('main-nav');
    if (!mobileMenuBtn || !navMenu || !navbar)
        return;
    let isMobileMenuOpen = false;
    mobileMenuBtn.addEventListener('click', () => {
        isMobileMenuOpen = !isMobileMenuOpen;
        toggleMobileMenu(isMobileMenuOpen, navMenu, mobileMenuBtn, navbar);
    });
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (isMobileMenuOpen) {
                isMobileMenuOpen = false;
                toggleMobileMenu(false, navMenu, mobileMenuBtn, navbar);
            }
        });
    });
    document.addEventListener('click', (e) => {
        const target = e.target;
        if (isMobileMenuOpen &&
            !target.closest('.nav-menu') &&
            !target.closest('.mobile-menu-btn')) {
            isMobileMenuOpen = false;
            toggleMobileMenu(false, navMenu, mobileMenuBtn, navbar);
        }
    });
    setActiveNavLink();
    window.addEventListener('resize', debounce(() => {
        if (window.innerWidth > 768 && isMobileMenuOpen) {
            isMobileMenuOpen = false;
            toggleMobileMenu(false, navMenu, mobileMenuBtn, navbar);
        }
    }, 100));
}
function toggleMobileMenu(isOpen, navMenu, mobileMenuBtn, navbar) {
    if (isOpen) {
        navMenu.classList.add('active');
        mobileMenuBtn.classList.add('active');
        navbar.classList.add('mobile-open');
        document.body.style.overflow = 'hidden';
        navMenu.classList.add('mobile-menu-enter-active');
        navMenu.classList.remove('mobile-menu-exit');
        trapFocus(navMenu);
    }
    else {
        navMenu.classList.remove('active');
        mobileMenuBtn.classList.remove('active');
        navbar.classList.remove('mobile-open');
        document.body.style.overflow = '';
        navMenu.classList.add('mobile-menu-exit');
        navMenu.classList.remove('mobile-menu-enter-active');
        releaseFocusTrap();
    }
}
function setActiveNavLink() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPath) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
        else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        }
    });
}
function trapFocus(element) {
    const focusableElements = getFocusableElements(element);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    if (!firstElement || !lastElement)
        return;
    firstElement.focus();
    const handleTab = (e) => {
        if (e.key === 'Tab') {
            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
            else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    };
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            const mobileMenuBtn = document.getElementById('mobile-menu-btn');
            if (mobileMenuBtn) {
                mobileMenuBtn.click();
            }
        }
    };
    document.addEventListener('keydown', handleTab);
    document.addEventListener('keydown', handleEscape);
    element._focusTrapListeners = [handleTab, handleEscape];
}
function releaseFocusTrap() {
    const navMenu = document.getElementById('nav-menu');
    if (navMenu && navMenu._focusTrapListeners) {
        navMenu._focusTrapListeners.forEach((listener) => {
            document.removeEventListener('keydown', listener);
        });
        delete navMenu._focusTrapListeners;
    }
}
function getFocusableElements(container) {
    return Array.from(container.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'));
}
function debounce(func, wait = 100) {
    let timeout = null;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            func(...args);
        };
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = window.setTimeout(later, wait);
    };
}
export { toggleMobileMenu, setActiveNavLink, trapFocus, releaseFocusTrap, getFocusableElements };
//# sourceMappingURL=nav.js.map