// Main TypeScript Module for Nedhub Website
// Handles core functionality, DOM interactions, and state management

// Import TypeScript modules
import { initNavigation } from './nav.js';
import { initAnimations } from './animations.js';
import { initFormValidation } from './form-validation.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Nedhub Website Initialized');

    // Initialize all components
    initNavigation();
    initAnimations();
    initFormValidation();

    // Set up scroll-based animations
    setupScrollAnimations();

    // Set up sticky navbar
    setupStickyNavbar();

    // Set up smooth scrolling for anchor links
    setupSmoothScrolling();

    // Set up mobile-specific behaviors
    setupMobileBehaviors();

    // Set up FAQ functionality
    setupFAQ();
});

// Scroll-based animation trigger
function setupScrollAnimations(): void {
    const scrollElements = document.querySelectorAll('.scroll-animate');

    const elementInView = (el: HTMLElement, dividend: number = 1) => {
        const elementTop = el.getBoundingClientRect().top;
        return elementTop <= (window.innerHeight || document.documentElement.clientHeight) / dividend;
    };

    const displayScrollElement = (element: HTMLElement) => {
        element.classList.add('visible');
    };

    const hideScrollElement = (element: HTMLElement) => {
        element.classList.remove('visible');
    };

    const handleScrollAnimation = () => {
        scrollElements.forEach((element) => {
            if (elementInView(element as HTMLElement, 1.25)) {
                displayScrollElement(element as HTMLElement);
            } else {
                hideScrollElement(element as HTMLElement);
            }
        });
    };

    // Run once on load
    handleScrollAnimation();

    // Run on scroll
    window.addEventListener('scroll', handleScrollAnimation);
}

// Sticky navbar functionality
function setupStickyNavbar(): void {
    const navbar = document.getElementById('main-nav');
    if (!navbar) return;

    const handleScroll = () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', handleScroll);
}

// Smooth scrolling for anchor links
function setupSmoothScrolling(): void {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e: Event) => {
            e.preventDefault();

            const targetId = (anchor as HTMLAnchorElement).getAttribute('href');
            if (!targetId) return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                (targetElement as HTMLElement).scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // Update URL without reloading
                history.pushState(null, '', targetId);
            }
        });
    });
}

// Mobile-specific behaviors
function setupMobileBehaviors(): void {
    // Check if device is mobile
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    if (isMobile) {
        // Add mobile class to body
        document.body.classList.add('is-mobile');

        // Set up touch events for better mobile UX
        setupTouchEvents();
    }

    // Listen for media query changes
    window.matchMedia('(max-width: 768px)').addEventListener('change', (e) => {
        if (e.matches) {
            document.body.classList.add('is-mobile');
            setupTouchEvents();
        } else {
            document.body.classList.remove('is-mobile');
        }
    });
}

// FAQ Accordion functionality
function setupFAQ(): void {
    const faqItems = document.querySelectorAll('.faq-item');

    if (faqItems.length === 0) return;

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question') as HTMLElement;
        
        question.addEventListener('click', () => {
            // Close all other FAQ items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });

            // Toggle current item
            item.classList.toggle('active');

            // Update icon
            const icon = question.querySelector('.faq-icon') as HTMLElement;
            if (icon) {
                if (item.classList.contains('active')) {
                    icon.textContent = '−';
                } else {
                    icon.textContent = '+';
                }
            }
        });

        // Add keyboard accessibility
        question.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                question.click();
            }
        });

        // Make question focusable for keyboard users
        question.setAttribute('tabindex', '0');
        question.setAttribute('role', 'button');
        question.setAttribute('aria-expanded', 'false');
    });
}

// Enhanced touch events for mobile
function setupTouchEvents(): void {
    // Add touch feedback to buttons
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

// Utility function for debouncing
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

// Export main functions for testing
export {
    setupScrollAnimations,
    setupStickyNavbar,
    setupSmoothScrolling,
    setupMobileBehaviors,
    debounce
};