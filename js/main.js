import { initNavigation } from './nav.js';
import { initAnimations } from './animations.js';
import { initFormValidation } from './form-validation.js';
document.addEventListener('DOMContentLoaded', () => {
    console.log('Nedhub Website Initialized');
    initNavigation();
    initAnimations();
    initFormValidation();
    setupScrollAnimations();
    setupStickyNavbar();
    setupSmoothScrolling();
    setupMobileBehaviors();
    setupFAQ();
});
function setupScrollAnimations() {
    const scrollElements = document.querySelectorAll('.scroll-animate');
    const elementInView = (el, dividend = 1) => {
        const elementTop = el.getBoundingClientRect().top;
        return elementTop <= (window.innerHeight || document.documentElement.clientHeight) / dividend;
    };
    const displayScrollElement = (element) => {
        element.classList.add('visible');
    };
    const hideScrollElement = (element) => {
        element.classList.remove('visible');
    };
    const handleScrollAnimation = () => {
        scrollElements.forEach((element) => {
            if (elementInView(element, 1.25)) {
                displayScrollElement(element);
            }
            else {
                hideScrollElement(element);
            }
        });
    };
    handleScrollAnimation();
    window.addEventListener('scroll', handleScrollAnimation);
}
function setupStickyNavbar() {
    const navbar = document.getElementById('main-nav');
    if (!navbar)
        return;
    const handleScroll = () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        }
        else {
            navbar.classList.remove('scrolled');
        }
    };
    window.addEventListener('scroll', handleScroll);
}
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = anchor.getAttribute('href');
            if (!targetId)
                return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                history.pushState(null, '', targetId);
            }
        });
    });
}
function setupMobileBehaviors() {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
        document.body.classList.add('is-mobile');
        setupTouchEvents();
    }
    window.matchMedia('(max-width: 768px)').addEventListener('change', (e) => {
        if (e.matches) {
            document.body.classList.add('is-mobile');
            setupTouchEvents();
        }
        else {
            document.body.classList.remove('is-mobile');
        }
    });
}
function setupFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    if (faqItems.length === 0)
        return;
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            item.classList.toggle('active');
            const icon = question.querySelector('.faq-icon');
            if (icon) {
                if (item.classList.contains('active')) {
                    icon.textContent = '−';
                }
                else {
                    icon.textContent = '+';
                }
            }
        });
        question.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                question.click();
            }
        });
        question.setAttribute('tabindex', '0');
        question.setAttribute('role', 'button');
        question.setAttribute('aria-expanded', 'false');
    });
}
function setupTouchEvents() {
    document.querySelectorAll('.btn, .nav-link, [role="button"]').forEach(element => {
        element.addEventListener('touchstart', () => {
            element.classList.add('touch-active');
        });
        element.addEventListener('touchend', () => {
            element.classList.remove('touch-active');
        });
        element.addEventListener('touchcancel', () => {
            element.classList.remove('touch-active');
        });
    });
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
export { setupScrollAnimations, setupStickyNavbar, setupSmoothScrolling, setupMobileBehaviors, debounce };
//# sourceMappingURL=main.js.map